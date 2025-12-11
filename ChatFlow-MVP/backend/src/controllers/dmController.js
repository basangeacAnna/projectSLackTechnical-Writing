const pool = require('../config/db');

exports.startDM = async (req, res) => {
    const userId = req.user.id;
    const { targetUserId } = req.body;

    if (!targetUserId) {
        return res.status(400).json({ error: 'targetUserId required' });
    }

    if (userId === targetUserId) {
        return res.status(400).json({ error: 'Cannot DM yourself' });
    }

    try {
        // Check if a thread already exists between these two users
        // We look for a thread_id that has exactly these two participants
        const existingThreadQuery = `
            SELECT t.id
            FROM dm_threads t
            JOIN dm_participants p1 ON t.id = p1.thread_id
            JOIN dm_participants p2 ON t.id = p2.thread_id
            WHERE p1.user_id = $1 AND p2.user_id = $2
            LIMIT 1
        `;
        
        const existingThreadResult = await pool.query(existingThreadQuery, [userId, targetUserId]);

        if (existingThreadResult.rows.length > 0) {
            return res.json({ threadId: existingThreadResult.rows[0].id });
        }

        // Start a transaction to ensure atomicity
        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Create new thread
            const newThreadResult = await client.query(
                'INSERT INTO dm_threads DEFAULT VALUES RETURNING id'
            );
            const threadId = newThreadResult.rows[0].id;

            // Add participants
            await client.query(
                'INSERT INTO dm_participants (thread_id, user_id) VALUES ($1, $2), ($1, $3)',
                [threadId, userId, targetUserId]
            );

            await client.query('COMMIT');
            res.json({ threadId });
        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('startDM error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getThreads = async (req, res) => {
    const userId = req.user.id;

    try {
        // Fetch threads where the user is a participant
        // Join to get the OTHER user's details
        // Join to get the last message details
        const query = `
            SELECT 
                t.id as "threadId",
                t.last_message_at as "lastMessageAt",
                m.content as "lastMessage",
                u.id as "otherUserId",
                u.username as "otherUsername",
                u.display_name as "otherDisplayName",
                u.avatar_url as "otherAvatarUrl",
                u.bio as "otherBio",
                u.status as "otherUserStatus",
                dp.visible as "selfVisible"
            FROM dm_participants dp
            JOIN dm_threads t ON dp.thread_id = t.id
            JOIN dm_participants other_dp ON t.id = other_dp.thread_id AND other_dp.user_id != $1
            JOIN users u ON other_dp.user_id = u.id
            LEFT JOIN dm_messages m ON t.last_message_id = m.id
            WHERE dp.user_id = $1 AND dp.visible = TRUE
            ORDER BY t.last_message_at DESC NULLS LAST
        `;

        const result = await pool.query(query, [userId]);
        console.log(`getThreads for ${userId}: found ${result.rows.length} threads`);

        const threads = result.rows.map(row => ({
            threadId: row.threadId,
            lastMessage: row.lastMessage || 'No messages yet',
            lastMessageAt: row.lastMessageAt,
            otherUser: {
                id: row.otherUserId,
                username: row.otherUsername,
                display_name: row.otherDisplayName,
                avatar_url: row.otherAvatarUrl,
                bio: row.otherBio,
                status: row.otherUserStatus
            },
            unreadCount: 0 // TODO: Implement unread count logic
        }));

        res.json(threads);
    } catch (err) {
        console.error('getThreads error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.getMessages = async (req, res) => {
    const { threadId } = req.params;
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;

    try {
        // Verify participation
        const participantCheck = await pool.query(
            'SELECT 1 FROM dm_participants WHERE thread_id = $1 AND user_id = $2',
            [threadId, userId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a participant' });
        }

        const query = `
            SELECT 
                m.id,
                m.content,
                m.sender_id,
                m.created_at,
                u.username,
                u.display_name,
                u.avatar_url,
                u.bio
            FROM dm_messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.thread_id = $1 AND m.is_deleted = FALSE
            ORDER BY m.created_at ASC
            LIMIT $2 OFFSET $3
        `;

        const result = await pool.query(query, [threadId, limit, offset]);
        res.json(result.rows);
    } catch (err) {
        console.error('getMessages error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.sendMessage = async (req, res) => {
    const { threadId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
        return res.status(400).json({ error: 'Content required' });
    }

    try {
        // Verify participation
        const participantCheck = await pool.query(
            'SELECT 1 FROM dm_participants WHERE thread_id = $1 AND user_id = $2',
            [threadId, userId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not a participant' });
        }

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            // Insert message
            const insertQuery = `
                INSERT INTO dm_messages (thread_id, sender_id, content)
                VALUES ($1, $2, $3)
                RETURNING id, created_at, content, sender_id
            `;
            const messageResult = await client.query(insertQuery, [threadId, userId, content]);
            const newMessage = messageResult.rows[0];

            // Update thread last_message
            await client.query(
                'UPDATE dm_threads SET last_message_id = $1, last_message_at = $2 WHERE id = $3',
                [newMessage.id, newMessage.created_at, threadId]
            );

            // Make thread visible for all participants (in case it was hidden)
            await client.query(
                'UPDATE dm_participants SET visible = TRUE WHERE thread_id = $1',
                [threadId]
            );

            await client.query('COMMIT');

            // Fetch sender details for the socket event
            const userResult = await pool.query(
                'SELECT id, username, display_name, avatar_url, bio FROM users WHERE id = $1',
                [userId]
            );
            const sender = userResult.rows[0];

            const fullMessage = {
                ...newMessage,
                username: sender.username,
                display_name: sender.display_name,
                avatar_url: sender.avatar_url,
                bio: sender.bio
            };

            // Emit Socket Event
            const io = req.app.get('io');
            if (io) {
                // Get other participants to notify
                const participantsResult = await pool.query(
                    'SELECT user_id FROM dm_participants WHERE thread_id = $1 AND user_id != $2',
                    [threadId, userId]
                );
                
                participantsResult.rows.forEach(row => {
                    io.to(`user:${row.user_id}`).emit('dm:new_message', {
                        threadId,
                        message: fullMessage
                    });
                });
                
                // Also emit to sender (optional, but good for consistency if they have multiple tabs)
                 io.to(`user:${userId}`).emit('dm:new_message', {
                        threadId,
                        message: fullMessage
                    });
            }

            res.status(201).json(fullMessage);

        } catch (e) {
            await client.query('ROLLBACK');
            throw e;
        } finally {
            client.release();
        }

    } catch (err) {
        console.error('sendMessage error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.markAsRead = async (req, res) => {
    const { threadId } = req.params;
    const { lastReadMessageId } = req.body;
    const userId = req.user.id;

    try {
        await pool.query(
            `INSERT INTO dm_read_state (thread_id, user_id, last_read_message_id, read_at)
             VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
             ON CONFLICT (thread_id, user_id) 
             DO UPDATE SET last_read_message_id = $3, read_at = CURRENT_TIMESTAMP`,
            [threadId, userId, lastReadMessageId]
        );

        // Emit read receipt
        const io = req.app.get('io');
        if (io) {
            const participantsResult = await pool.query(
                'SELECT user_id FROM dm_participants WHERE thread_id = $1 AND user_id != $2',
                [threadId, userId]
            );
            
            participantsResult.rows.forEach(row => {
                io.to(`user:${row.user_id}`).emit('dm:read_receipt', {
                    threadId,
                    userId,
                    lastReadMessageId,
                    readAt: new Date().toISOString()
                });
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('markAsRead error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteMessage = async (req, res) => {
    const { threadId, messageId } = req.params;
    const userId = req.user.id;

    try {
        // Verify ownership
        const messageResult = await pool.query(
            'SELECT sender_id FROM dm_messages WHERE id = $1',
            [messageId]
        );

        if (messageResult.rows.length === 0) {
            return res.status(404).json({ error: 'Message not found' });
        }

        if (messageResult.rows[0].sender_id !== userId) {
            return res.status(403).json({ error: 'Can only delete your own messages' });
        }

        // Soft delete
        await pool.query(
            'UPDATE dm_messages SET is_deleted = TRUE WHERE id = $1',
            [messageId]
        );

        // Emit deletion event
        const io = req.app.get('io');
        if (io) {
            // Notify thread participants
             // Get participants to notify
             const participantsResult = await pool.query(
                'SELECT user_id FROM dm_participants WHERE thread_id = $1',
                [threadId]
            );
            
            participantsResult.rows.forEach(row => {
                io.to(`user:${row.user_id}`).emit('dm:message_deleted', {
                    threadId,
                    messageId
                });
            });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('deleteMessage error:', err.message);
        res.status(500).send('Server Error');
    }
};

exports.deleteThread = async (req, res) => {
    const userId = req.user.id;
    const { threadId } = req.params;

    try {
        // Check if user is a participant
        const participantCheck = await pool.query(
            'SELECT 1 FROM dm_participants WHERE thread_id = $1 AND user_id = $2',
            [threadId, userId]
        );

        if (participantCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Not authorized or thread not found' });
        }

        // Soft delete for the user only (hide thread)
        const updateResult = await pool.query(
            'UPDATE dm_participants SET visible = FALSE WHERE thread_id = $1 AND user_id = $2',
            [threadId, userId]
        );

        console.log(`deleteThread: User ${userId} hid thread ${threadId}. Rows updated: ${updateResult.rowCount}`);

        // Emit event only to the user who deleted it
        const io = req.app.get('io');
        if (io) {
            io.to(`user:${userId}`).emit('dm:thread_deleted', { threadId });
        }

        res.json({ success: true });
    } catch (err) {
        console.error('deleteThread error:', err.message);
        res.status(500).send('Server Error');
    }
};
