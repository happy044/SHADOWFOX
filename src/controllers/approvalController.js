import pool from '../config/db.js';

export const submitApproval = async (req, res) => {
  const { po_id, user_id, approval_status, comments } = req.body;
  
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    // Insert approval record
    await connection.query(
      'INSERT INTO approvals (po_id, user_id, approval_status, comments) VALUES (?, ?, ?, ?)',
      [po_id, user_id, approval_status, comments]
    );

    // Update PO status based on current role and approval status
    let nextStatus = '';
    if (approval_status === 'Rejected') {
      nextStatus = 'Rejected';
    } else {
      // Get current user role
      const [userRows] = await connection.query('SELECT role FROM users WHERE user_id = ?', [user_id]);
      const userRole = userRows[0].role;

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

    await connection.query('UPDATE purchaseorders SET status = ? WHERE po_id = ?', [nextStatus, po_id]);

    await connection.commit();
    res.status(201).json({ message: 'Approval submitted successfully', nextStatus });
  } catch (error) {
    await connection.rollback();
    res.status(500).json({ error: error.message });
  } finally {
    connection.release();
  }
};

export const getApprovalsByPO = async (req, res) => {
  const { po_id } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT a.*, u.name as user_name, u.role, u.signature_path 
       FROM Approvals a 
       JOIN Users u ON a.user_id = u.user_id 
       WHERE a.po_id = ?`,
      [po_id]
    );
    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
