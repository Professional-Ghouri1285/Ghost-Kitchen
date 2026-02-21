
CREATE TABLE KitchenHubs (
    hub_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(150) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('ACTIVE','INACTIVE'))
);

CREATE TABLE VirtualBrands (
    brand_id SERIAL PRIMARY KEY,
    hub_id INT NOT NULL,
    name VARCHAR(100) UNIQUE NOT NULL,
    active_status BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_virtualbrands_hub
        FOREIGN KEY (hub_id)
        REFERENCES KitchenHubs(hub_id)
        ON DELETE CASCADE
);

CREATE TABLE Inventory (
    ingredient_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    total_quantity INT NOT NULL CHECK (total_quantity >= 0),
    unit VARCHAR(20) NOT NULL
);

CREATE TABLE BrandInventoryAllocation (
    brand_id INT NOT NULL,
    ingredient_id INT NOT NULL,
    allocation_percentage DECIMAL(5,2) NOT NULL
        CHECK (allocation_percentage > 0 AND allocation_percentage <= 100),
    PRIMARY KEY (brand_id, ingredient_id),
    CONSTRAINT fk_bia_brand
        FOREIGN KEY (brand_id)
        REFERENCES VirtualBrands(brand_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_bia_ingredient
        FOREIGN KEY (ingredient_id)
        REFERENCES Inventory(ingredient_id)
        ON DELETE CASCADE
);

CREATE TABLE MenuItems (
    item_id SERIAL PRIMARY KEY,
    brand_id INT NOT NULL,
    name VARCHAR(100) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price > 0),
    is_available BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_menuitems_brand
        FOREIGN KEY (brand_id)
        REFERENCES VirtualBrands(brand_id)
        ON DELETE CASCADE
);

CREATE TABLE Orders (
    order_id SERIAL PRIMARY KEY,
    brand_id INT NOT NULL,
    order_status VARCHAR(20) NOT NULL
        CHECK (order_status IN ('PLACED','CANCELLED','DELIVERED')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_orders_brand
        FOREIGN KEY (brand_id)
        REFERENCES VirtualBrands(brand_id)
        ON DELETE CASCADE
);

CREATE TABLE OrderItems (
    order_item_id SERIAL PRIMARY KEY,
    order_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT NOT NULL CHECK (quantity > 0),
    CONSTRAINT fk_orderitems_order
        FOREIGN KEY (order_id)
        REFERENCES Orders(order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_orderitems_item
        FOREIGN KEY (item_id)
        REFERENCES MenuItems(item_id)
        ON DELETE CASCADE
);

CREATE TABLE Couriers (
    courier_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('AVAILABLE','BUSY')),
    rating DECIMAL(2,1)
        CHECK (rating BETWEEN 0 AND 5)
);

CREATE TABLE Deliveries (
    delivery_id SERIAL PRIMARY KEY,
    order_id INT UNIQUE NOT NULL,
    courier_id INT NOT NULL,
    delivery_status VARCHAR(20) NOT NULL
        CHECK (delivery_status IN ('ASSIGNED','PICKED','COMPLETED')),
    CONSTRAINT fk_deliveries_order
        FOREIGN KEY (order_id)
        REFERENCES Orders(order_id)
        ON DELETE CASCADE,
    CONSTRAINT fk_deliveries_courier
        FOREIGN KEY (courier_id)
        REFERENCES Couriers(courier_id)
        ON DELETE CASCADE
);

CREATE TABLE Payouts (
    payout_id SERIAL PRIMARY KEY,
    courier_id INT NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
    payout_date DATE DEFAULT CURRENT_DATE,
    CONSTRAINT fk_payouts_courier
        FOREIGN KEY (courier_id)
        REFERENCES Couriers(courier_id)
        ON DELETE CASCADE
);


CREATE INDEX idx_orders_brand_id ON Orders(brand_id);
CREATE INDEX idx_deliveries_courier_id ON Deliveries(courier_id);
CREATE INDEX idx_inventory_name ON Inventory(name);
CREATE INDEX idx_orderitems_order_item ON OrderItems(order_id, item_id);


CREATE OR REPLACE FUNCTION check_brand_inventory_allocation()
RETURNS TRIGGER AS $$
DECLARE
    brand_used INT;
    max_allowed NUMERIC;
BEGIN
    SELECT COALESCE(SUM(oi.quantity), 0)
    INTO brand_used
    FROM OrderItems oi
    JOIN Orders o ON oi.order_id = o.order_id
    WHERE o.brand_id = (
        SELECT brand_id
        FROM MenuItems
        WHERE item_id = NEW.item_id
    );

    SELECT (i.total_quantity * bia.allocation_percentage / 100)
    INTO max_allowed
    FROM BrandInventoryAllocation bia
    JOIN Inventory i ON bia.ingredient_id = i.ingredient_id
    WHERE bia.brand_id = (
        SELECT brand_id
        FROM MenuItems
        WHERE item_id = NEW.item_id
    )
    LIMIT 1;
    
    IF brand_used + NEW.quantity > max_allowed THEN
        RAISE EXCEPTION 'Brand inventory allocation exceeded';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_brand_inventory_allocation
BEFORE INSERT ON OrderItems
FOR EACH ROW
EXECUTE FUNCTION check_brand_inventory_allocation();


CREATE OR REPLACE FUNCTION enforce_order_status_transition()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.order_status IN ('DELIVERED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Cannot modify order once it is DELIVERED or CANCELLED';
    END IF;

    IF OLD.order_status = 'PLACED'
       AND NEW.order_status NOT IN ('DELIVERED', 'CANCELLED') THEN
        RAISE EXCEPTION 'Invalid order status transition';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER trg_enforce_order_status_transition
BEFORE UPDATE ON Orders
FOR EACH ROW
EXECUTE FUNCTION enforce_order_status_transition();

CREATE VIEW brand_sales_summary AS
SELECT
    vb.brand_id,
    vb.name AS brand_name,
    SUM(oi.quantity * mi.price) AS total_revenue
FROM Orders o
JOIN VirtualBrands vb ON o.brand_id = vb.brand_id
JOIN OrderItems oi ON o.order_id = oi.order_id
JOIN MenuItems mi ON oi.item_id = mi.item_id
WHERE o.order_status = 'DELIVERED'
GROUP BY vb.brand_id, vb.name;

CREATE VIEW inventory_allocation_usage AS
SELECT
    vb.name AS brand_name,
    i.name AS ingredient_name,
    bia.allocation_percentage,
    (i.total_quantity * bia.allocation_percentage / 100) AS max_allowed_quantity
FROM BrandInventoryAllocation bia
JOIN VirtualBrands vb ON bia.brand_id = vb.brand_id
JOIN Inventory i ON bia.ingredient_id = i.ingredient_id;

CREATE VIEW courier_performance_summary AS
SELECT
    c.courier_id,
    c.name AS courier_name,
    COUNT(d.delivery_id) AS completed_deliveries,
    COALESCE(SUM(p.amount), 0) AS total_payout
FROM Couriers c
LEFT JOIN Deliveries d
    ON c.courier_id = d.courier_id
    AND d.delivery_status = 'COMPLETED'
LEFT JOIN Payouts p
    ON c.courier_id = p.courier_id
GROUP BY c.courier_id, c.name;

