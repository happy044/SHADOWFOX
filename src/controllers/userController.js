import pool from '../config/db.js';

export const getUsers = async (req, res) => {
  try {
    const result = await pool.query('SELECT user_id, name, role, email, password, signature_path, profile_photo FROM users');
    res.json(result.rows);
  } catch (error) {
    console.error('Error in getUsers:', error);
    res.status(500).json({ error: error.message });
  }
};

export const createUser = async (req, res) => {
  const { name, role, email, password, signature_path, profile_photo } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO users (name, role, email, password, signature_path, profile_photo) VALUES ($1, $2, $3, $4, $5, $6) RETURNING user_id',
      [name, role, email, password, signature_path, profile_photo]
    );
    res.status(201).json({ user_id: result.rows[0].user_id, message: 'User created successfully' });
  } catch (error) {
    console.error('Error in createUser:', error);
    res.status(500).json({ error: error.message });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Delete approvals associated with POs created by this user
    await client.query('DELETE FROM approvals WHERE po_id IN (SELECT po_id FROM purchaseorders WHERE created_by = $1)', [id]);
    
    // 2. Delete documents associated with POs created by this user
    await client.query('DELETE FROM documents WHERE po_id IN (SELECT po_id FROM purchaseorders WHERE created_by = $1)', [id]);

    // 3. Delete POs created by this user
    await client.query('DELETE FROM purchaseorders WHERE created_by = $1', [id]);

    // 4. Delete approvals submitted by this user for any PO
    await client.query('DELETE FROM approvals WHERE user_id = $1', [id]);

    // 5. Finally delete the user
    await client.query('DELETE FROM users WHERE user_id = $1', [id]);

    await client.query('COMMIT');
    res.json({ message: 'User and all associated records deleted successfully' });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in deleteUser:', error);
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { name, role, email, password } = req.body;
  try {
    await pool.query(
      'UPDATE users SET name = $1, role = $2, email = $3, password = $4 WHERE user_id = $5',
      [name, role, email, password, id]
    );
    res.json({ message: 'User updated successfully' });
  } catch (error) {
    console.error('Error in updateUser:', error);
    res.status(500).json({ error: error.message });
  }
};
