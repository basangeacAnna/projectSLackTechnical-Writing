const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
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

app.use(cors()); // CORS per API REST standard
app.use(express.json());

// Routes
// app.use('/api/auth', authRoutes); // Uncomment when files actally exist locally if you want to run locally
// app.use('/api/chat', chatRoutes); // Uncomment when files actally exist locally

// Placeholder route if routes folder is empty locally
app.get('/', (req, res) => {
    res.send('Backend API + Socket.io running');
});

// Gestione Socket.io
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join_channel', (channelId) => {
        socket.join(channelId);
        console.log(`User ${socket.id} joined channel ${channelId}`);
    });

    socket.on('send_message', (data) => {
        socket.to(data.channelId).emit('receive_message', data);
    });

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server (HTTP + Socket.io) running on port ${PORT}`);
});
