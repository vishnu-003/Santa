// src/models/userModel.js
const mongoose = require('mongoose');
const { token } = require('morgan');

// Define the schema for the 'user_list' collection
const user_listSchema = new mongoose.Schema({
    email: String,
    picked: {
        type: Boolean,
        default: false
    },
    picked_to: String
});

// Define the schema for the 'user' collection
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    otp: String,
    otpExpiry: Date,
    token:String,
    isVerified: {
        type: Boolean,
        default: false
    }
});

// Create and export models for both schemas
const User = mongoose.model('User', userSchema);
const UserList = mongoose.model('Userlist', user_listSchema, 'user_list');

module.exports = { User, UserList };
