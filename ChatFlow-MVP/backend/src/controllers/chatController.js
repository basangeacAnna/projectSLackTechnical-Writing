const pool = require('../config/db');

exports.getChannels = async (req, res) => {
    try {
        const channels = await pool.query('SELECT * FROM channels ORDER BY created_at ASC');
        res.json(channels.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.createChannel = async (req, res) => {
    const { name, description } = req.body;
    try {
        const newChannel = await pool.query(
            'INSERT INTO channels (name, description) VALUES ($1, $2) RETURNING *',
            [name, description]
        );
        res.json(newChannel.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMessages = async (req, res) => {
    const { channelId } = req.params;
    try {
        const messages = await pool.query(
            `SELECT m.*, u.username, u.display_name, u.avatar_url, u.bio, u.status 
             FROM messages m 
             JOIN users u ON m.user_id = u.id 
             WHERE m.channel_id = $1 
             ORDER BY m.created_at ASC`,
            [channelId]
        );
        res.json(messages.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.sendMessage = async (req, res) => {
    const { content, userId, channelId } = req.body;
    try {
        const newMessage = await pool.query(
            'INSERT INTO messages (content, user_id, channel_id) VALUES ($1, $2, $3) RETURNING *',
            [content, userId, channelId]
        );
        
        // Fetch full user details for the response so the frontend
        // can hydrate presence / profile data immediately
        const user = await pool.query(
            'SELECT id, username, display_name, avatar_url, bio, status, email, created_at FROM users WHERE id = $1',
            [userId]
        );
        
        const messageWithUser = {
            ...newMessage.rows[0],
            username: user.rows[0]?.username,
            display_name: user.rows[0]?.display_name,
            avatar_url: user.rows[0]?.avatar_url,
            bio: user.rows[0]?.bio,
            status: user.rows[0]?.status
        };

        res.json(messageWithUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.getChannelMembers = async (req, res) => {
    const { channelId } = req.params;
    try {
        const result = await pool.query(
            `SELECT u.id,
                    u.username,
                    u.display_name,
                    u.avatar_url,
                    u.bio,
                    u.status,
                    u.email,
                    u.created_at,
                    cm.role,
                    cm.joined_at
             FROM channel_members cm
             JOIN users u ON cm.user_id = u.id
             WHERE cm.channel_id = $1
             ORDER BY LOWER(COALESCE(u.display_name, u.username)) ASC`,
            [channelId]
        );
        res.json(result.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteChannel = async (req, res) => {
    const { channelId } = req.params;
    
    try {
        // In a real app, check ownership here using req.user.id
        // const channel = await pool.query('SELECT owner_id FROM channels WHERE id = $1', [channelId]);
        // if (channel.rows.length === 0) return res.status(404).json({ error: 'Channel not found' });
        // if (channel.rows[0].owner_id !== req.user.id) return res.status(403).json({ error: 'Not authorized' });

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Delete messages
            await client.query('DELETE FROM messages WHERE channel_id = $1', [channelId]);

            // Delete members
            await client.query('DELETE FROM channel_members WHERE channel_id = $1', [channelId]);

            // Delete channel
            await client.query('DELETE FROM channels WHERE id = $1', [channelId]);

            await client.query('COMMIT');
            
            const io = req.app.get('io');
            if (io) {
                io.emit('channel_deleted', { channelId });
            }

            res.json({ success: true });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
};
