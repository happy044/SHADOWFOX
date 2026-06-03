import pool from '../config/db.js';

async function seedDb() {
  const client = await pool.connect();

  try {
    console.log('Seeding database...');
    
    // Seed Plants and Departments
    await client.query('INSERT INTO Plants (name, location) VALUES (\'Main Plant\', \'North Zone\'), (\'Secondary Plant\', \'South Zone\')');
    await client.query('INSERT INTO Departments (name) VALUES (\'Procurement\'), (\'Manufacturing\'), (\'Operations\')');

    const users = [
      ['Eng. John Procurement', 'Procurement Engineer', 'procurement@factory.com', 'password123', 1, 1, null],
      ['Sarah Smith', 'Reporting Manager', 'manager@factory.com', 'password123', 1, 1, null],
      ['Robert Jones', 'Plant Manager 1', 'plant1@factory.com', 'password123', 1, 1, null],
      ['Alice Wong', 'Plant Manager 2', 'plant2@factory.com', 'password123', 1, 2, null],
      ['Elena Global', 'Global Head', 'global@factory.com', 'password123', 1, 1, null],
      ['David MD', 'MD', 'md@factory.com', 'password123', 1, 1, null],
      ['System Admin', 'Admin', 'admin@factory.com', 'password123', 1, 1, null]
    ];

    for (const user of users) {
      await client.query(
        'INSERT INTO Users (name, role, email, password, dept_id, plant_id, profile_photo) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (email) DO NOTHING',
        user
      );
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

seedDb();
