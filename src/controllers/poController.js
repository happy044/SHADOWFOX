import pool from '../config/db.js';

export const getPurchaseOrders = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM purchaseorders');
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete associated approvals
    await client.query('DELETE FROM approvals WHERE po_id = $1', [id]);

    // 2. Delete associated documents
    await client.query('DELETE FROM documents WHERE po_id = $1', [id]);

    // 3. Finally delete the PO
    await client.query('DELETE FROM purchaseorders WHERE po_id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'Purchase Order and all associated records deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in deletePurchaseOrder:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const createPurchaseOrder = async (req, res) => {
  const { supplier, date, total_amount, material_details, quantity, technical_details, remarks, created_by } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO purchaseorders (supplier, date, total_amount, status, material_details, quantity, technical_details, remarks, created_by) VALUES ($1, $2, $3, \'Draft\', $4, $5, $6, $7, $8) RETURNING po_id',
      [supplier, date, total_amount, material_details, quantity, technical_details, remarks, created_by]
    );
    res.status(201).json({ po_id: result.rows[0].po_id, message: 'Purchase Order created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePOStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE purchaseorders SET status = $1 WHERE po_id = $2', [status, id]);
    res.json({ message: 'PO status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
