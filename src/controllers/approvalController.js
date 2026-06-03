import pool from '../config/db.js';

export const submitApproval = async (req, res) => {
  const { po_id, user_id, approval_status, comments } = req.body;
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Insert approval record
    await client.query(
      'INSERT INTO approvals (po_id, user_id, approval_status, comments) VALUES ($1, $2, $3, $4)',
      [po_id, user_id, approval_status, comments]
    );

    // Update PO status based on current role and approval status
    let nextStatus = '';
    if (approval_status === 'Rejected') {
      nextStatus = 'Rejected';
    } else {
      // Get current user role
      const userResult = await client.query('SELECT role FROM users WHERE user_id = $1', [user_id]);
      const userRole = userResult.rows[0].role;

      switch (userRole) {
        case 'Procurement Engineer': nextStatus = 'Pending Reporting Manager'; break;
        case 'Reporting Manager': nextStatus = 'Pending Plant Manager 1'; break;
        case 'Plant Manager 1': nextStatus = 'Pending Plant Manager 2'; break;
        case 'Plant Manager 2': nextStatus = 'Pending Global Head'; break;
        case 'Global Head': nextStatus = 'Pending MD'; break;
        case 'MD': nextStatus = 'Approved'; break;
        default: nextStatus = 'Draft';
      }
    }

    await client.query('UPDATE purchaseorders SET status = $1 WHERE po_id = $2', [nextStatus, po_id]);

    await client.query('COMMIT');
    res.status(201).json({ message: 'Approval submitted successfully', nextStatus });
  } catch (error) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: error.message });
  } finally {
    client.release();
  }
};

export const getApprovalsByPO = async (req, res) => {
  const { po_id } = req.params;
  try {
    const result = await pool.query(
      `SELECT a.*, u.name as user_name, u.role, u.signature_path 
       FROM Approvals a 
       JOIN Users u ON a.user_id = u.user_id 
       WHERE a.po_id = $1`,
      [po_id]
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
