-- QUERY 1: Orders by Brand (Before Index)
EXPLAIN ANALYZE
SELECT *
FROM Orders
WHERE brand_id = 1;

--Result (Before Index):
--"Bitmap Heap Scan on orders  (cost=4.18..12.64 rows=4 width=74) (actual time=0.103..0.105 rows=8 loops=1)"
--"  Recheck Cond: (brand_id = 1)"
--"  Heap Blocks: exact=1"
--"  ->  Bitmap Index Scan on idx_orders_brand_id  (cost=0.00..4.18 rows=4 width=0) (actual time=0.092..0.092 rows=8 loops=1)"
--"        Index Cond: (brand_id = 1)"
--"Planning Time: 0.195 ms"
--"Execution Time: 0.259 ms"

-- QUERY 1: Orders by Brand (After Index)
EXPLAIN ANALYZE
SELECT *
FROM Orders
WHERE brand_id = 1;

--Result (After Index):
--"Bitmap Heap Scan on orders  (cost=4.18..12.64 rows=4 width=74) (actual time=0.029..0.030 rows=8 loops=1)"
--"  Recheck Cond: (brand_id = 1)"
--"  Heap Blocks: exact=1"
--"  ->  Bitmap Index Scan on idx_orders_brand_id  (cost=0.00..4.18 rows=4 width=0) (actual time=0.018..0.018 rows=8 loops=1)"
--"        Index Cond: (brand_id = 1)"
--"Planning Time: 0.093 ms"
--"Execution Time: 0.054 ms"


-- QUERY 2: Deliveries by Courier (Before Index)
EXPLAIN ANALYZE
SELECT *
FROM Deliveries
WHERE courier_id = 3;

--Result (Before Index):
--"Bitmap Heap Scan on deliveries  (cost=4.18..12.64 rows=4 width=70) (actual time=0.439..0.441 rows=3 loops=1)"
--"  Recheck Cond: (courier_id = 3)"
--"  Heap Blocks: exact=1"
--"  ->  Bitmap Index Scan on idx_deliveries_courier_id  (cost=0.00..4.18 rows=4 width=0) (actual time=0.247..0.247 rows=3 loops=1)"
--"        Index Cond: (courier_id = 3)"
--"Planning Time: 1.219 ms"
--"Execution Time: 0.535 ms"

-- QUERY 2: Deliveries by Courier (After Index)
EXPLAIN ANALYZE
SELECT *
FROM Deliveries
WHERE courier_id = 3;

--Result (After Index):
--"Bitmap Heap Scan on deliveries  (cost=4.18..12.64 rows=4 width=70) (actual time=0.028..0.029 rows=3 loops=1)"
--"  Recheck Cond: (courier_id = 3)"
--"  Heap Blocks: exact=1"
--"  ->  Bitmap Index Scan on idx_deliveries_courier_id  (cost=0.00..4.18 rows=4 width=0) (actual time=0.017..0.017 rows=3 loops=1)"
--"        Index Cond: (courier_id = 3)"
--"Planning Time: 0.103 ms"
--"Execution Time: 0.051 ms"

-- QUERY 3: Brand Revenue (Before Index)
EXPLAIN ANALYZE
SELECT vb.name AS brand_name,
       SUM(mi.price * oi.quantity) AS total_revenue
FROM Orders o
JOIN OrderItems oi ON o.order_id = oi.order_id
JOIN MenuItems mi ON oi.item_id = mi.item_id
JOIN VirtualBrands vb ON o.brand_id = vb.brand_id
WHERE o.order_status = 'DELIVERED'
GROUP BY vb.name;

--Result (Before Index):
--"GroupAggregate  (cost=28.99..29.02 rows=1 width=250) (actual time=3.239..3.263 rows=5 loops=1)"
--"  Group Key: vb.name"
--"  ->  Sort  (cost=28.99..29.00 rows=1 width=238) (actual time=2.860..2.866 rows=53 loops=1)"
--"        Sort Key: vb.name"
--"        Sort Method: quicksort  Memory: 27kB"
--"        ->  Nested Loop  (cost=20.35..28.98 rows=1 width=238) (actual time=2.070..2.291 rows=53 loops=1)"
--"              ->  Nested Loop  (cost=20.20..22.78 rows=1 width=24) (actual time=1.568..1.701 rows=53 loops=1)"
--"                    ->  Hash Join  (cost=20.05..21.88 rows=1 width=12) (actual time=1.055..1.095 rows=53 loops=1)"
--"                          Hash Cond: (oi.order_id = o.order_id)"
--"                          ->  Seq Scan on orderitems oi  (cost=0.00..1.66 rows=66 width=12) (actual time=0.140..0.151 rows=66 loops=1)"
--"                          ->  Hash  (cost=20.00..20.00 rows=4 width=8) (actual time=0.394..0.395 rows=31 loops=1)"
--"                                Buckets: 1024  Batches: 1  Memory Usage: 10kB"
--"                                ->  Seq Scan on orders o  (cost=0.00..20.00 rows=4 width=8) (actual time=0.312..0.320 rows=31 loops=1)"
--"                                      Filter: ((order_status)::text = 'DELIVERED'::text)"
--"                                      Rows Removed by Filter: 9"
--"                    ->  Index Scan using menuitems_pkey on menuitems mi  (cost=0.15..0.89 rows=1 width=20) (actual time=0.011..0.011 rows=1 loops=53)"
--"                          Index Cond: (item_id = oi.item_id)"
--"              ->  Index Scan using virtualbrands_pkey on virtualbrands vb  (cost=0.15..6.17 rows=1 width=222) (actual time=0.011..0.011 rows=1 loops=53)"
--"                    Index Cond: (brand_id = o.brand_id)"
--"Planning Time: 7.183 ms"
--"Execution Time: 4.780 ms"

-- QUERY 3: Brand Revenue (After Index)
EXPLAIN ANALYZE
SELECT vb.name AS brand_name,
       SUM(mi.price * oi.quantity) AS total_revenue
FROM Orders o
JOIN OrderItems oi ON o.order_id = oi.order_id
JOIN MenuItems mi ON oi.item_id = mi.item_id
JOIN VirtualBrands vb ON o.brand_id = vb.brand_id
WHERE o.order_status = 'DELIVERED'
GROUP BY vb.name;

--Result (After Index):
--"GroupAggregate  (cost=28.99..29.02 rows=1 width=250) (actual time=0.993..1.016 rows=5 loops=1)"
--"  Group Key: vb.name"
--"  ->  Sort  (cost=28.99..29.00 rows=1 width=238) (actual time=0.975..0.981 rows=53 loops=1)"
--"        Sort Key: vb.name"
--"        Sort Method: quicksort  Memory: 27kB"
--"        ->  Nested Loop  (cost=20.35..28.98 rows=1 width=238) (actual time=0.791..0.937 rows=53 loops=1)"
--"              ->  Nested Loop  (cost=20.20..22.78 rows=1 width=24) (actual time=0.781..0.869 rows=53 loops=1)"
--"                    ->  Hash Join  (cost=20.05..21.88 rows=1 width=12) (actual time=0.527..0.550 rows=53 loops=1)"
--"                          Hash Cond: (oi.order_id = o.order_id)"
--"                          ->  Seq Scan on orderitems oi  (cost=0.00..1.66 rows=66 width=12) (actual time=0.023..0.029 rows=66 loops=1)"
--"                          ->  Hash  (cost=20.00..20.00 rows=4 width=8) (actual time=0.214..0.215 rows=31 loops=1)"
--"                                Buckets: 1024  Batches: 1  Memory Usage: 10kB"
--"                                ->  Seq Scan on orders o  (cost=0.00..20.00 rows=4 width=8) (actual time=0.012..0.019 rows=31 loops=1)"
--"                                      Filter: ((order_status)::text = 'DELIVERED'::text)"
--"                                      Rows Removed by Filter: 9"
--"                    ->  Index Scan using menuitems_pkey on menuitems mi  (cost=0.15..0.89 rows=1 width=20) (actual time=0.006..0.006 rows=1 loops=53)"
--"                          Index Cond: (item_id = oi.item_id)"
--"              ->  Index Scan using virtualbrands_pkey on virtualbrands vb  (cost=0.15..6.17 rows=1 width=222) (actual time=0.001..0.001 rows=1 loops=53)"
--"                    Index Cond: (brand_id = o.brand_id)"
--"Planning Time: 4.294 ms"
--"Execution Time: 1.088 ms"
