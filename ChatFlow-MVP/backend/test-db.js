const pool = require('./src/config/db');

async function testConnection() {
  try {
    console.log('Attempting to connect to Supabase...');
    console.log(`Host: ${process.env.DB_HOST}`);
    
    const client = await pool.connect();
    console.log('Client connected successfully.');
    
    const res = await client.query('SELECT NOW() as now, version()');
    console.log('Query successful!');
    console.log('Database Time:', res.rows[0].now);
    console.log('Postgres Version:', res.rows[0].version);
    
    client.release();
    await pool.end();
    console.log('Connection closed.');
  } catch (err) {
    console.error('Connection failed:', err);
    process.exit(1);
  }
}

testConnection();
