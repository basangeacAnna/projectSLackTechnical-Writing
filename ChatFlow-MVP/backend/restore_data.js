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

const restore = async () => {
  try {
    console.log('Connecting to database...');
    console.log(`Host: ${process.env.DB_HOST}`);
    console.log('Restoring data...');

    // 1. Create User
    const password = 'password123';
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Insert user
    const userRes = await pool.query(`
      INSERT INTO public.users (username, email, password_hash, display_name, status, bio)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, username;
    `, ['demo_user', 'demo@example.com', hashedPassword, 'Demo User', 'online', 'I am a demo user']);
    
    const userId = userRes.rows[0].id;
    console.log(`Created user: ${userRes.rows[0].username} (${userId})`);

    // 2. Check if channels exist, if not create General
    const channelsRes = await pool.query('SELECT * FROM public.channels WHERE name = $1', ['General']);
    
    let channelId;
    if (channelsRes.rows.length === 0) {
        const newChannel = await pool.query(`
          INSERT INTO public.channels (name, description, owner_id)
          VALUES ($1, $2, $3)
          RETURNING id, name;
        `, ['General', 'General discussion', userId]);
        channelId = newChannel.rows[0].id;
        console.log(`Created channel: ${newChannel.rows[0].name} (${channelId})`);
    } else {
        channelId = channelsRes.rows[0].id;
        console.log(`Channel 'General' already exists. Updating owner...`);
        // Update owner to ensure it's valid (since original owner was deleted)
        await pool.query('UPDATE public.channels SET owner_id = $1 WHERE id = $2', [userId, channelId]);
    }

    // 3. Add Member to channel
    // Check if already member
    const memberRes = await pool.query('SELECT * FROM public.channel_members WHERE channel_id = $1 AND user_id = $2', [channelId, userId]);
    if (memberRes.rows.length === 0) {
        await pool.query(`
          INSERT INTO public.channel_members (channel_id, user_id, role)
          VALUES ($1, $2, 'admin');
        `, [channelId, userId]);
        console.log('Added user to channel.');
    }

    console.log('---------------------------------------------------');
    console.log('RESTORE COMPLETE.');
    console.log('Login with: demo@example.com / password123');
    console.log('---------------------------------------------------');
    process.exit(0);
  } catch (err) {
    console.error('Error restoring:', err);
    process.exit(1);
  }
};

restore();
