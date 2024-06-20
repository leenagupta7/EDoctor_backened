const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const {app,server} = require('./Socket')
const fileupload = require('express-fileupload');
const cloudinary = require('cloudinary').v2;
const port = process.env.PORT || 4000;
require('dotenv').config();

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


mongoose.connect(process.env.database)
    .then(() => {
        console.log('website it run at 4000')
        server.listen(port, () => console.log(`Server is running on port ${port}`));
    }).catch(err => console.log(err));
    