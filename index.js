const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const app = express();
const fileupload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const port = process.env.PORT || 4200;
require('dotenv').config();
const http = require('http').Server(app);
const io = require('socket.io')(http);

var usb = io.of('/user-namespace');
usb.on('connection',function(socket){
    console.log('user connected');
    socket.on('disconnect',function(){
        console.log('user disconnected');
    })
});
//MiddleWares
app.use(express.json());
app.use(cors());
app.use(fileupload({
    useTempFiles: true
}));

// Cloudinary configuration
cloudinary.config({
    cloud_name: process.env.cloudname,
    api_key: process.env.apikey,
    api_secret: process.env.apisecret,
});

// Routes
const stripeRoutes = require('./routes/stripeRoutes');
const userRoutes = require('./routes/userRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const messageRoute = require('./routes/messageRoute');

app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctor', doctorRoutes);
app.use('/api/message', messageRoute);

http.listen(4000, () => {
    console.log('Server running on port 4000');
});
mongoose.connect(process.env.database)
    .then(() => {
        console.log('website it run at 4000')
        app.listen(port, () => console.log(`Server is running on port ${port}`));
    }).catch(err => console.log(err));
    