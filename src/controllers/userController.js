import pool from '../config/db.js';

export const getUsers = async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT user_id, name, role, email, password, signature_path, profile_photo FROM users');
    res.json(rows);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  const { name, role, email, password, signature_path, profile_photo } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, role, email, password, signature_path, profile_photo) VALUES (?, ?, ?, ?, ?, ?)',
      [name, role, email, password, signature_path, profile_photo]
    );
    res.status(201).json({ user_id: result.insertId, message: 'User created successfully' });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // 1. Delete approvals associated with POs created by this user
    await connection.query('DELETE FROM approvals WHERE po_id IN (SELECT po_id FROM purchaseorders WHERE created_by = ?)', [id]);
    
    // 2. Delete documents associated with POs created by this user
    await connection.query('DELETE FROM documents WHERE po_id IN (SELECT po_id FROM purchaseorders WHERE created_by = ?)', [id]);

    // 3. Delete POs created by this user
    await connection.query('DELETE FROM purchaseorders WHERE created_by = ?', [id]);

    // 4. Delete approvals submitted by this user for any PO
    await connection.query('DELETE FROM approvals WHERE user_id = ?', [id]);

    // 5. Finally delete the user
    await connection.query('DELETE FROM users WHERE user_id = ?', [id]);

    await connection.commit();
    res.json({ message: 'User and all associated records deleted successfully' });
  } catch (error) {
    await connection.rollback();
    console.error('Error in deleteUser:', error);
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, role, email, password } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = ?, role = ?, email = ?, password = ? WHERE user_id = ?',
      [name, role, email, password, id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ error: error.message });
  }
};
