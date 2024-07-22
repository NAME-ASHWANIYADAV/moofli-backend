require("dotenv").config();
const express = require("express");
const app = express();
const cors = require("cors");
const socketIo = require('socket.io');
const http = require ('http');
const bodyParser = require ('body-parser');
const connectDB = require("./db/config");
const path= require ("path");
const diaryRoutes = require('./Routes/diaryRoutes');
const searchRoutes = require('./Routes/searchRoutes');
const notificationRoutes = require('./Routes/notificationRoutes');
const userRoutes = require("./Routes/userRoutes");
const PORT = 4002;


connectDB();

const server =http.createServer(app);
const io = socketIo(server);
app.use(bodyParser.json());
// middleware
app.use(express.json());
app.use(cors());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(userRoutes);
app.use (diaryRoutes);
app.use (searchRoutes);
app.use (notificationRoutes);

// Socket.IO setup
io.on('connection', (socket) => {
    console.log('New client connected');

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

// Assuming you have a function to emit notifications
const notificationController = require('./controllers/notificationController');
notificationController.io = io; // Pass the io instance to the controller


app.listen(PORT,()=>{
    console.log(`Server start at Port No :${PORT}`)
})