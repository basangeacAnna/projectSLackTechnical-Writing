module.exports = (io, socket) => {
    // Join the user's personal room for notifications
    socket.join(`user:${socket.user.id}`);

    socket.on('dm:join_thread', ({ threadId }) => {
        console.log(`User ${socket.user.id} joined thread ${threadId}`);
        socket.join(`thread:${threadId}`);
    });

    socket.on('dm:leave_thread', ({ threadId }) => {
        console.log(`User ${socket.user.id} left thread ${threadId}`);
        socket.leave(`thread:${threadId}`);
    });

    socket.on('dm:typing', ({ threadId }) => {
        socket.to(`thread:${threadId}`).emit('dm:typing', {
            userId: socket.user.id,
            threadId
        });
    });

    socket.on('dm:stop_typing', ({ threadId }) => {
        socket.to(`thread:${threadId}`).emit('dm:stop_typing', {
            userId: socket.user.id,
            threadId
        });
    });
};