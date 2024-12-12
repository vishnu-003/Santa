// src/controllers/userController.js
const { register, verifyOTP, resendOTP,login, getUserList} = require('../services/userService');

class UserController {
    // Register user
    async register(req, res, next) {
        try {
            const user = await register(req.body);
            res.status(201).json({
                status: 'success',
                data: user
            });
        } 
        catch (error) {
            next(error);
        }
    }

    // Verify OTP
    async verifyotp(req, res, next) {
        try {
            const { email, otp } = req.body;
            await verifyOTP(email, otp);
            res.json({
                status: 'success',
                message: 'Email verified successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    // Resend OTP
    async resendOTP(req, res, next) {
        try {
            const { identifier } = req.body;
            await resendOTP(identifier);
            res.json({
                status: 'success',
                message: 'OTP resent successfully'
            });
        } catch (error) {
            next(error);
        }
    }

    //login
    async login(req, res, next) {
        try {
            const { email, password} = req.body;
            await login(email, password);
            res.json({
                status: 'success',
                message: 'Login successfully',
            });
        } catch (error) {
            next(error);
        }
    }

    // Get random user from UserList
    async getUserList(req, res, next) {
        try {
            // Get token from request header
            // Assumes "Bearer <token>"
            const token = req.headers.authorization?.split(' ')[1]; 
            
            if (!token) {
                return res.status(401).json({
                    status: 'error',
                    message: 'Authentication token is required'
                });
            }
    
            // Pass the token to getUserList function
            const user = await getUserList(token);
            
            res.json({
                status: 'success',
                data: user
            });
        } catch (error) {
            // If there's a specific token error, send appropriate response
            if (error.message === 'Invalid or expired token') {
                return res.status(401).json({
                    status: 'error',
                    message: error.message
                });
            }
            
            // For other errors, use the error handling middleware
            next(error);
        }
    }
}

module.exports = new UserController();

