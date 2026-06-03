import express from 'express';
import pool from '../config/db.js';
import * as userController from '../controllers/userController.js';
import * as poController from '../controllers/poController.js';
import * as approvalController from '../controllers/approvalController.js';

const router = express.Router();

// User routes
router.get('/users', userController.getUsers);
router.post('/users', userController.createUser);
router.put('/users/:id', userController.updateUser);
router.delete('/users/:id', userController.deleteUser);
router.patch('/users/:id/signature', async (req, res) => {
  const { id } = req.params;
  const { signature_path } = req.body;
  try {
    await pool.query('UPDATE users SET signature_path = ? WHERE user_id = ?', [signature_path, id]);
    res.json({ message: 'Signature updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/users/:id/photo', async (req, res) => {
  const { id } = req.params;
  const { profile_photo } = req.body;
  try {
    await pool.query('UPDATE users SET profile_photo = ? WHERE user_id = ?', [profile_photo, id]);
    res.json({ message: 'Profile photo updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Purchase Order routes
router.get('/pos', poController.getPurchaseOrders);
router.post('/pos', poController.createPurchaseOrder);
router.patch('/pos/:id/status', poController.updatePOStatus);
router.delete('/pos/:id', poController.deletePurchaseOrder);
router.get('/pos/:po_id/approvals', approvalController.getApprovalsByPO);

// Approval routes
router.post('/approvals', approvalController.submitApproval);

router.get('/audit-logs', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT a.*, u.name as user_name, u.role, p.supplier 
      FROM approvals a
      JOIN users u ON a.user_id = u.user_id
      JOIN purchaseorders p ON a.po_id = p.po_id
      ORDER BY a.timestamp DESC
    `);
    res.json(rows);
  } catch (error) {
    console.error('Error in /audit-logs:', error);
    res.status(500).json({ error: error.message });
  }
});

// Admin Panel Data
router.get('/plants', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM plants');
    res.json(rows);
  } catch (error) {
    console.error('Error in /plants:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/plants', async (req, res) => {
  const { name, location } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO plants (name, location) VALUES (?, ?)', [name, location]);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/plants/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM plants WHERE plant_id = ?', [req.params.id]);
    res.json({ message: 'Plant deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/departments', async (req, res) => {
  try {
    const [rows] = await pool.query('SELECT * FROM departments');
    res.json(rows);
  } catch (error) {
    console.error('Error in /departments:', error);
    res.status(500).json({ error: error.message });
  }
});

router.post('/departments', async (req, res) => {
  const { name } = req.body;
  try {
    const [result] = await pool.query('INSERT INTO departments (name) VALUES (?)', [name]);
    res.status(201).json({ id: result.insertId });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/departments/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM departments WHERE dept_id = ?', [req.params.id]);
    res.json({ message: 'Department deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
