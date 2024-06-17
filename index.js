const express = require('express');
const mongoose = require('mongoose');
const Doctor = require('./Modal/Doctor');
const cors = require('cors');
const app = express();
const fileupload = require('express-fileupload');
const User = require('./Modal/UserModal');
const cloudinary = require('cloudinary').v2;
const port = process.env.PORT || 4200;
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

app.use('/api/stripe', stripeRoutes);
app.use('/api/users', userRoutes);
app.use('/api/doctor', doctorRoutes);

app.listen(4000, () => {
    console.log('Server running on port 4000');
});
mongoose.connect(process.env.database)
    .then(() => {
        console.log('website it run at 4000')
        app.listen(port, () => console.log(`Server is running on port ${port}`));
    }).catch(err => console.log(err));
    