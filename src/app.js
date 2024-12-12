// src/app.js
const express = require('express');
const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/database');

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());

// Routes
app.use('/api', routes);

// Error handling
app.use(errorHandler);

module.exports = app;


