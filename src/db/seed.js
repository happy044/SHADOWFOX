import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

async function seedDb() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  try {
    console.log('Seeding database...');
    
    // Seed Plants and Departments
    await connection.query('INSERT INTO Plants (name, location) VALUES ("Main Plant", "North Zone"), ("Secondary Plant", "South Zone")');
    await connection.query('INSERT INTO Departments (name) VALUES ("Procurement"), ("Manufacturing"), ("Operations")');

    const users = [
      ['Eng. John Procurement', 'Procurement Engineer', 'procurement@factory.com', 'password123', 1, 1, null],
      ['Sarah Smith', 'Reporting Manager', 'manager@factory.com', 'password123', 1, 1, null],
      ['Robert Jones', 'Plant Manager 1', 'plant1@factory.com', 'password123', 1, 1, null],
      ['Alice Wong', 'Plant Manager 2', 'plant2@factory.com', 'password123', 1, 2, null],
      ['Elena Global', 'Global Head', 'global@factory.com', 'password123', 1, 1, null],
      ['David MD', 'MD', 'md@factory.com', 'password123', 1, 1, null],
      ['System Admin', 'Admin', 'admin@factory.com', 'password123', 1, 1, null]
    ];

    await connection.query(
      'INSERT IGNORE INTO Users (name, role, email, password, dept_id, plant_id, profile_photo) VALUES ?',
      [users]
    );

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  } finally {
    await connection.end();
  }
}

seedDb();
