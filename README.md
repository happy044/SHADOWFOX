# PO Signing System Backend

This is the backend for the Purchase Order (PO) Signing System.

## Prerequisites

- Node.js (v14+)
- MySQL Server

## Setup

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Database Setup (XAMPP):**
   - Start **Apache** and **MySQL** from the XAMPP Control Panel.
   - Open **phpMyAdmin** (usually at `http://localhost/phpmyadmin`).
   - Create a new database named `po_signing_system`.
   - You can either import `src/db/schema.sql` manually or run:
     ```bash
     npm run init-db
     ```
   - (Optional) Seed the database with initial users:
     ```bash
     node src/db/seed.js
     ```
   - Update the `.env` file with your XAMPP MySQL credentials (usually user `root` with no password):
     ```env
     DB_HOST=localhost
     DB_USER=root
     DB_PASSWORD=
     DB_NAME=po_signing_system
     ```

3. **Start the Server:**
   - For development:
     ```bash
     npm run dev
     ```
   - For production:
     ```bash
     npm start
     ```

## API Endpoints

### Users
- `GET /api/users` - Get all users
- `POST /api/users` - Create a new user

### Purchase Orders
- `GET /api/pos` - Get all POs
- `POST /api/pos` - Create a new PO
- `PATCH /api/pos/:id/status` - Update PO status

### Approvals
- `POST /api/approvals` - Submit an approval step
- `GET /api/pos/:po_id/approvals` - Get approval history for a specific PO

## Database Schema

The system uses the following tables:
- `Users`: Stores information about staff and approvers (Procurement, Finance, Manager, MD).
- `PurchaseOrders`: Tracks PO details and their current status.
- `Approvals`: Tracks each step in the approval workflow.
- `Documents`: Stores paths to the final signed PO PDFs.
