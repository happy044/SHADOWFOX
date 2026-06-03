-- Drop tables if they exist to apply schema changes
DROP TABLE IF EXISTS Documents;
DROP TABLE IF EXISTS Approvals;
DROP TABLE IF EXISTS PurchaseOrders;
DROP TABLE IF EXISTS Users;
DROP TABLE IF EXISTS Departments;
DROP TABLE IF EXISTS Plants;

-- Plants table
CREATE TABLE IF NOT EXISTS Plants (
    plant_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    location VARCHAR(255)
);

-- Departments table
CREATE TABLE IF NOT EXISTS Departments (
    dept_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL
);

 -- Users table: approvers and staff 
 CREATE TABLE IF NOT EXISTS Users ( 
     user_id SERIAL PRIMARY KEY, 
     name VARCHAR(100) NOT NULL, 
     role VARCHAR(50) NOT NULL, 
     email VARCHAR(150) UNIQUE NOT NULL, 
     password VARCHAR(255) NOT NULL, 
     signature_path TEXT, -- stored as base64 or file path 
     profile_photo TEXT, -- stored as base64
     dept_id INT,
     plant_id INT,
     FOREIGN KEY (dept_id) REFERENCES Departments(dept_id),
     FOREIGN KEY (plant_id) REFERENCES Plants(plant_id)
 ); 
 
 -- Purchase Orders table 
 CREATE TABLE IF NOT EXISTS PurchaseOrders ( 
     po_id SERIAL PRIMARY KEY, 
     supplier VARCHAR(150) NOT NULL, 
     date DATE NOT NULL, 
     total_amount DECIMAL(12,2) NOT NULL, 
     status VARCHAR(50) DEFAULT 'Draft',
     material_details TEXT,
     quantity INT,
     technical_details TEXT,
     remarks TEXT,
     qr_code_data TEXT,
     created_by INT,
     FOREIGN KEY (created_by) REFERENCES Users(user_id)
 ); 
 
 -- Approvals table: tracks each approval step 
 CREATE TABLE IF NOT EXISTS Approvals ( 
     approval_id SERIAL PRIMARY KEY, 
     po_id INT NOT NULL, 
     user_id INT NOT NULL, 
     approval_status VARCHAR(50) DEFAULT 'Pending', 
     timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
     comments TEXT, 
     FOREIGN KEY (po_id) REFERENCES PurchaseOrders(po_id), 
     FOREIGN KEY (user_id) REFERENCES Users(user_id) 
 ); 
 
 -- Documents table: stores final signed PO PDFs 
 CREATE TABLE IF NOT EXISTS Documents ( 
     doc_id SERIAL PRIMARY KEY, 
     po_id INT NOT NULL, 
     file_path VARCHAR(255) NOT NULL, 
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, 
     FOREIGN KEY (po_id) REFERENCES PurchaseOrders(po_id) 
 );
