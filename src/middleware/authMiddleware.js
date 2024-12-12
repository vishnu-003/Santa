// src/middleware/authMiddleware.js
const { verifyToken } = require('../utils/jwtUtils');

const authenticate = async (req, res, next) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        const userData = await User.findOne({email: isVerified.email});
        req.user = userData;
        req.token = token;
        if (!token) {
            return res.status(401).json({ message: 'Authentication required' });
        }

        const decoded = verifyToken(token);
        req.user = { id: decoded.userId };
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};



module.exports = { authenticate };