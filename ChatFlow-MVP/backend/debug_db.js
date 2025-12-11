const pool = require('./src/config/db');
require('dotenv').config();

async function debugDB() {
    try {
        console.log('Debugging DB...');
        
        // Find a user with a visible thread
        const userRes = await pool.query('SELECT user_id, thread_id FROM dm_participants WHERE visible = TRUE LIMIT 1');
        if (userRes.rows.length === 0) {
            console.log('No visible threads found.');
            return;
        }
        const { user_id: userId, thread_id: threadId } = userRes.rows[0];
        console.log('Testing with user:', userId, 'thread:', threadId);

        // 1. Verify it shows up in getThreads query
        const query = `
            SELECT 
                t.id as "threadId",
                dp.visible
            FROM dm_participants dp
            JOIN dm_threads t ON dp.thread_id = t.id
            WHERE dp.user_id = $1 AND (dp.visible = TRUE OR dp.visible IS NULL)
        `;
        const res1 = await pool.query(query, [userId]);
        const found1 = res1.rows.find(r => r.threadId === threadId);
        console.log('Before delete, found:', !!found1);

        // 2. Simulate Delete (UPDATE visible = FALSE)
        console.log('Updating visible = FALSE...');
        await pool.query('UPDATE dm_participants SET visible = FALSE WHERE thread_id = $1 AND user_id = $2', [threadId, userId]);

        // 3. Verify it is GONE from getThreads query
        const res2 = await pool.query(query, [userId]);
        const found2 = res2.rows.find(r => r.threadId === threadId);
        console.log('After delete, found:', !!found2);

        if (found2) {
            console.error('BUG: Thread still visible!');
            console.log('Row data:', found2);
        } else {
            console.log('SUCCESS: Thread is hidden.');
        }

        // 4. Restore (UPDATE visible = TRUE)
        console.log('Restoring visible = TRUE...');
        await pool.query('UPDATE dm_participants SET visible = TRUE WHERE thread_id = $1 AND user_id = $2', [threadId, userId]);

    } catch (err) {
        console.error('Debug failed:', err);
    } finally {
        await pool.end();
    }
}

debugDB();
