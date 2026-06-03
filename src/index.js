import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './config/db.js';
import apiRoutes from './routes/api.js';

dotenv.config();

// Trigger restart
const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
app.use('/api', apiRoutes);

// Root route
app.get('/', (req, res) => {
  res.send('<h1>Digital Project API</h1><p>The server is running successfully. Please use the <a href="https://digital-project-frontend.onrender.com">Frontend Application</a> to access the system.</p>');
});

// Basic health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'PO Signing System API is running' });
});

// Test DB connection
app.get('/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT 1 + 1 AS result');
    res.json({ status: 'OK', message: 'Database connection successful', result: result.rows[0].result });
  } catch (error) {
    res.status(500).json({ status: 'Error', message: 'Database connection failed', error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
