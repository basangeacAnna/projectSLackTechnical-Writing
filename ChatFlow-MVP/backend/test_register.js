require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

// Create a specific pool for this script that forces SSL (required for Supabase)
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
    ssl: { rejectUnauthorized: false } 
});

const testRegister = async () => {
    const username = 'testuser_' + Date.now();
    const email = `test_${Date.now()}@example.com`;
    const password = 'password123';

    console.log(`Attempting to register user: ${username} / ${email}`);

    try {
        // 1. Check if user exists
        console.log('Checking if user exists...');
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            console.log('User already exists (unexpected for unique timestamp)');
            return;
        }

        // 2. Hash password
        console.log('Hashing password...');
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // 3. Insert user
        console.log('Inserting user...');
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, hashedPassword]
        );

        console.log('User created successfully:', newUser.rows[0]);
        process.exit(0);

    } catch (err) {
        console.error('REGISTRATION FAILED:', err);
        process.exit(1);
    }
};

testRegister();
