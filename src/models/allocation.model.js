const pool = require('../config/db');

const getAll = async () => {
    const result = await pool.query(
        `SELECT bia.*, vb.name AS brand_name, i.name AS ingredient_name
         FROM BrandInventoryAllocation bia
         JOIN VirtualBrands vb ON bia.brand_id = vb.brand_id
         JOIN Inventory i ON bia.ingredient_id = i.ingredient_id`
    );
    return result.rows;
};

const getOne = async (brandId, ingredientId) => {
    const result = await pool.query(
        `SELECT bia.*, vb.name AS brand_name, i.name AS ingredient_name
         FROM BrandInventoryAllocation bia
         JOIN VirtualBrands vb ON bia.brand_id = vb.brand_id
         JOIN Inventory i ON bia.ingredient_id = i.ingredient_id
         WHERE bia.brand_id = $1 AND bia.ingredient_id = $2`,
        [brandId, ingredientId]
    );
    return result.rows[0];
};

const create = async ({ brand_id, ingredient_id, allocation_percentage }) => {
    const result = await pool.query(
        'INSERT INTO BrandInventoryAllocation (brand_id, ingredient_id, allocation_percentage) VALUES ($1, $2, $3) RETURNING *',
        [brand_id, ingredient_id, allocation_percentage]
    );
    return result.rows[0];
};

const update = async (brandId, ingredientId, { allocation_percentage }) => {
    const result = await pool.query(
        'UPDATE BrandInventoryAllocation SET allocation_percentage = $1 WHERE brand_id = $2 AND ingredient_id = $3 RETURNING *',
        [allocation_percentage, brandId, ingredientId]
    );
    return result.rows[0];
};

const remove = async (brandId, ingredientId) => {
    const result = await pool.query(
        'DELETE FROM BrandInventoryAllocation WHERE brand_id = $1 AND ingredient_id = $2 RETURNING *',
        [brandId, ingredientId]
    );
    return result.rows[0];
};

module.exports = { getAll, getOne, create, update, remove };
