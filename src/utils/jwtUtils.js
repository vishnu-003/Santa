// src/utils/jwtUtils.js
const jwt = require('jsonwebtoken');
const config = require('../config/environment');

const generateToken = (userId) => {
    return jwt.sign(
        { userId },
        config.jwtSecret,
        { expiresIn: '24h' }
    );
};

const verifyToken = (token) => {
    try {
        return jwt.verify(token, config.jwtSecret);
    } catch (error) {
        throw new Error('Invalid token');
    }
};

module.exports = {
    generateToken,
    verifyToken
};
