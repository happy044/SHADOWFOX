import pool from '../config/db.js';

export const getPurchaseOrders = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM purchaseorders');
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deletePurchaseOrder = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Delete associated approvals
    await connection.query('DELETE FROM approvals WHERE po_id = ?', [id]);

    // 2. Delete associated documents
    await connection.query('DELETE FROM documents WHERE po_id = ?', [id]);

    // 3. Finally delete the PO
    await connection.query('DELETE FROM purchaseorders WHERE po_id = ?', [id]);

    await connection.commit();
    res.json({ message: 'Purchase Order and all associated records deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deletePurchaseOrder:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

export const createPurchaseOrder = async (req, res) => {
  const { supplier, date, total_amount, material_details, quantity, technical_details, remarks, created_by } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO purchaseorders (supplier, date, total_amount, status, material_details, quantity, technical_details, remarks, created_by) VALUES (?, ?, ?, "Draft", ?, ?, ?, ?, ?)',
      [supplier, date, total_amount, material_details, quantity, technical_details, remarks, created_by]
    );
    res.status(201).json({ po_id: result.insertId, message: 'Purchase Order created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updatePOStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    await pool.query('UPDATE purchaseorders SET status = ? WHERE po_id = ?', [status, id]);
    res.json({ message: 'PO status updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
