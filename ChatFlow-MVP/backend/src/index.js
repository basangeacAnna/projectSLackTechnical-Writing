const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const pool = require('./config/db');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const userRoutes = require('./routes/users');
const dmRoutes = require('./routes/dm');
// const uploadController = require('./controllers/uploadController'); // Uncomment when implemented

const app = express();
const server = http.createServer(app);

// Configura Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Accetta connessioni da chiunque (ok per sviluppo)
        methods: ["GET", "POST"]
    }
});

// Make io accessible to our router
app.set('io', io);

app.use(cors()); // CORS per API REST standard
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dm', dmRoutes);

const resetAllUsersOffline = async () => {
    try {
        await pool.query("UPDATE users SET status = 'offline'");
        console.log('All users reset to offline on startup');
    } catch (err) {
        console.error('Failed to reset users status on startup:', err);
    }
};

resetAllUsersOffline();

// Placeholder route if routes folder is empty locally
app.get('/', (req, res) => {
    res.send('Backend API + Socket.io running');
});

// Middleware per autenticazione Socket.io
io.use(async (socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
        return next(new Error('Authentication error'));
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = decoded;
        next();
    } catch (err) {
        next(new Error('Authentication error'));
    }
});

// Gestione Socket.io
io.on('connection', async (socket) => {
    console.log('User connected:', socket.id, 'User ID:', socket.user.id);
    // Restore current status and set to online unless user is DND
    try {
        const currentStatusRes = await pool.query('SELECT status FROM users WHERE id = $1', [socket.user.id]);
        const existingStatus = currentStatusRes.rows[0]?.status || 'online';
        const nextStatus = existingStatus === 'dnd' ? 'dnd' : 'online';
        await pool.query('UPDATE users SET status = $1 WHERE id = $2', [nextStatus, socket.user.id]);
        io.emit('status_change', { userId: socket.user.id, status: nextStatus });

        // Send list of currently online users to the new client
        const onlineUsers = await pool.query("SELECT id, status FROM users WHERE status != 'offline'");
        socket.emit('initial_status_list', onlineUsers.rows);

        // --- DM Logic ---
        require('./websocket/dmHandler')(io, socket);
        
        // --- Presence Logic ---
        require('./websocket/presence')(io, socket);
        // ----------------
    } catch (err) {
        console.error('Error updating status on connect:', err);
    }

    socket.on('join_channel', (channelId) => {
        socket.join(channelId);
        console.log(`User ${socket.id} joined channel ${channelId}`);
    });

    socket.on('send_message', (data) => {
        // Support both camelCase and snake_case for channel ID
        const targetChannel = data.channelId || data.channel_id;
        if (targetChannel) {
            socket.to(targetChannel).emit('receive_message', data);
            console.log(`Message sent to channel ${targetChannel}`);
        } else {
            console.error('Message received without channel ID:', data);
        }
    });

    // Explicit status change from client (online, away, dnd)
    socket.on('status_set', async ({ status }) => {
        const allowed = ['online', 'away', 'dnd'];
        if (!allowed.includes(status)) return;
        try {
            await pool.query('UPDATE users SET status = $1 WHERE id = $2', [status, socket.user.id]);
            io.emit('status_change', { userId: socket.user.id, status });
        } catch (err) {
            console.error('Error updating status via socket:', err);
        }
    });

    socket.on('disconnect', async () => {
        console.log('User disconnected:', socket.id);
        // Set user status to offline
        try {
            await pool.query('UPDATE users SET status = $1 WHERE id = $2', ['offline', socket.user.id]);
            io.emit('status_change', { userId: socket.user.id, status: 'offline' });
        } catch (err) {
            console.error('Error updating status to offline:', err);
        }
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server (HTTP + Socket.io) running on port ${PORT}`);
});
