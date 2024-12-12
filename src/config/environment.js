// src/config/environment.js
require('dotenv').config();

// console.log(process.env.MONGODB_URI)

module.exports = {
    port: process.env.PORT || 3000,
    mongoUri: process.env.MONGODB_URI,
    jwtSecret: process.env.JWT_SECRET,
    environment: process.env.NODE_ENV || 'development'
};
