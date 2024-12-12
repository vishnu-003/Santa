// src/routes/userRoutes.js
const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticate } = require('../middleware/authMiddleware');

router.post('/register', userController.register);
router.post('/verifyotp', userController.verifyotp);
router.post('/login', userController.login);
router.get('/getuserList',userController.getUserList)

module.exports = router;


