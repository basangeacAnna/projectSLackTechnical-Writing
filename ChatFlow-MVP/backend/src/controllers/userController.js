const pool = require('../config/db');

exports.getUserProfile = async (req, res) => {
    const { userId } = req.params;
    try {
        const userResult = await pool.query(
            'SELECT id, username, email, display_name, bio, avatar_url, status, created_at FROM users WHERE id = $1',
            [userId]
        );

        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        res.json(userResult.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.updateUserProfile = async (req, res) => {
    const { display_name, bio, status, avatar_url } = req.body;
    const userId = req.user.id; // From auth middleware

    try {
        // Build dynamic query based on provided fields
        const fields = [];
        const values = [];
        let query = 'UPDATE users SET ';
        let index = 1;

        if (display_name !== undefined) {
            fields.push(`display_name = $${index++}`);
            values.push(display_name);
        }
        if (bio !== undefined) {
            fields.push(`bio = $${index++}`);
            values.push(bio);
        }
        if (status !== undefined) {
            fields.push(`status = $${index++}`);
            values.push(status);
        }
        if (avatar_url !== undefined) {
            fields.push(`avatar_url = $${index++}`);
            values.push(avatar_url);
        }

        if (fields.length === 0) {
            return res.status(400).json({ message: 'No fields to update' });
        }

        query += fields.join(', ') + ` WHERE id = $${index} RETURNING id, username, email, display_name, bio, avatar_url, status, created_at`;
        values.push(userId);

        const updatedUser = await pool.query(query, values);

        res.json(updatedUser.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
