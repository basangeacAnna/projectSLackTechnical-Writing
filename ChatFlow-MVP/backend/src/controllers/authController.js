const pool = require('../config/db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

exports.register = async (req, res) => {
    const { username, email, password } = req.body;
    try {
        // Check if user exists
        const userCheck = await pool.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Insert user
        const newUser = await pool.query(
            'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
            [username, email, hashedPassword]
        );

        // Generate token
        const token = jwt.sign({ id: newUser.rows[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const user = newUser.rows[0];
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.username,
            avatar_url: null,
            bio: '',
            status: 'online',
            created_at: user.created_at
        };

        res.status(201).json({ token, user: userResponse });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.login = async (req, res) => {
    const { email, password } = req.body;
    try {
        // Check user
        const userResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (userResult.rows.length === 0) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        const user = userResult.rows[0];

        // Check password
        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            return res.status(400).json({ message: 'Invalid Credentials' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '1h' });

        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.display_name || user.username,
            avatar_url: user.avatar_url || null,
            bio: user.bio || '',
            status: user.status || 'online',
            created_at: user.created_at
        };

        res.json({ token, user: userResponse });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMe = async (req, res) => {
    try {
        const userResult = await pool.query('SELECT id, username, email, display_name, avatar_url, bio, status, created_at FROM users WHERE id = $1', [req.user.id]);
        
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        const user = userResult.rows[0];
        const userResponse = {
            id: user.id,
            username: user.username,
            email: user.email,
            display_name: user.display_name || user.username,
            avatar_url: user.avatar_url || null,
            bio: user.bio || '',
            status: user.status || 'online',
            created_at: user.created_at
        };

        res.json(userResponse);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
