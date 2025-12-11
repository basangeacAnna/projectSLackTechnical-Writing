const activeUsers = new Map(); // userId -> Set<socketId>

module.exports = (io, socket) => {
    const userId = socket.user.id;
    
    // 1. Handle Connection (User comes online)
    if (!activeUsers.has(userId)) {
        activeUsers.set(userId, new Set());
    }
    const userSockets = activeUsers.get(userId);
    
    // If this is the first socket for this user, they just came online
    if (userSockets.size === 0) {
        io.emit('user_status_changed', {
            userId,
            status: 'online',
            timestamp: new Date().toISOString()
        });
        console.log(`✅ User ${userId} is ONLINE (Presence)`);
    }
    
    userSockets.add(socket.id);

    // 2. Handle Disconnect
    socket.on('disconnect', () => {
        if (activeUsers.has(userId)) {
            const userSockets = activeUsers.get(userId);
            userSockets.delete(socket.id);

            // If no more sockets for this user, they are offline
            if (userSockets.size === 0) {
                activeUsers.delete(userId);
                io.emit('user_status_changed', {
                    userId,
                    status: 'offline',
                    timestamp: new Date().toISOString()
                });
                console.log(`❌ User ${userId} is OFFLINE (Presence)`);
            }
        }
    });

    // 3. Handle get_online_users
    socket.on('get_online_users', () => {
        const onlineUsers = Array.from(activeUsers.keys());
        socket.emit('online_users_list', { users: onlineUsers });
    });
    
    // 4. Handle explicit user_connected event (legacy/redundant but kept for compatibility)
    socket.on('user_connected', () => {
        // Already handled above, but we can send the list back
        const onlineUsers = Array.from(activeUsers.keys());
        socket.emit('online_users_list', { users: onlineUsers });
    });
};
