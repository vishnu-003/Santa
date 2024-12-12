// src/services/userService.js
const AWS = require('aws-sdk');
const {User} = require('../models/userModel');
const {UserList} = require('../models/userModel');
const { hashPassword, comparePassword } = require('../utils/passwordUtils');
const { generateToken } = require('../utils/jwtUtils');
const crypto = require('crypto');

AWS.config.update({
    region: process.env.AWS_REGION, // e.g., 'us-east-1'
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
});
  
  
const ses = new AWS.SES();
  
  // Helper function to generate OTP
  function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }
  
  // Send OTP email to user
  async function sendOTP(email, otp) {
    const params = {
      Source: process.env.SES_SENDER_EMAIL,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Registration OTP',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `<h1>Registration OTP</h1><p>Your OTP for registration is: <strong>${otp}</strong></p>`,
            Charset: 'UTF-8'
          },
          Text: {
            Data: `Your OTP for registration is: ${otp}`,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
        const data = await ses.sendEmail(params).promise();
        console.log("Email sent successfully:", data);
      } catch (err) {
        console.error("Error sending email:", err);
        throw new Error('Failed to send OTP');
      }
    }


//success mail
  // Send  email to user
  async function sendsanta(email,user) {
    const params = {
      Source: process.env.SES_SENDER_EMAIL,
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Secret_Santa',
          Charset: 'UTF-8'
        },
        Body: {
          Html: {
            Data: `<h1> Secret_Santa</h1><p> Your Secret_Santa for : <strong>${user}</strong></p>`,
            Charset: 'UTF-8'
          },
          Text: {
            Data: `Your Secret_Santa for: ${user}`,
            Charset: 'UTF-8'
          }
        }
      }
    };

    try {
        const data = await ses.sendEmail(params).promise();
        console.log("Email sent successfully:", data);
      } catch (err) {
        console.error("Error sending email:", err);
        throw new Error('Failed to send OTP');
      }
    }

  //register
  async function register(userData) {
    if (!userData.email.endsWith('@minfytech.com')) {
        throw new Error('Only @minfytech.com email addresses are allowed');
    }
  
    const existingUser = await User.findOne({ email: userData.email });
    if (existingUser) {
        throw new Error('Email already registered');
    }
  
    const otp = generateOTP();
    const otpExpiry = new Date();
    otpExpiry.setMinutes(otpExpiry.getMinutes() + 10);
    
    const hashedPassword = await hashPassword(userData.password);

    const user = await User.create({
        name: userData.name,
        email: userData.email,
        password: hashedPassword,
        otp: otp,
        otpExpiry: otpExpiry,
        isVerified: false
    });

    await sendOTP(userData.email, otp);
  
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        message: 'Please verify your email with the OTP sent to your inbox'
    };
}


// Verify OTP
async function verifyOTP(email, otp) {
    if (!email || !otp) {
      throw new Error('Identifier (email or userId) and OTP are required');
    }
  
    const user = await User.findOne({ email: email });
  
    if (!user) {
      throw new Error('User not found');
    }
  
    if (user.isVerified) {
      throw new Error('User already verified');
    }
  
    // Rate limit OTP attempts
    if (user.otpAttempts >= 3) {
      throw new Error('Maximum OTP attempts exceeded');
    }
  
    // Use constant-time comparison for OTP
    const storedOTP = Buffer.from(user.otp.padStart(6, '0')); // Ensure 6 digits
    const receivedOTP = Buffer.from(otp.padStart(6, '0'));   // Ensure 6 digits
  
    try {
      const isValid = crypto.timingSafeEqual(storedOTP, receivedOTP);
      if (!isValid) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        await user.save();
        throw new Error('Invalid OTP');
      }
    } catch (error) {
      user.otpAttempts = (user.otpAttempts || 0) + 1;
      await user.save();
      throw new Error('Invalid OTP');
    }
  
    if (new Date() > user.otpExpiry) {
      throw new Error('OTP has expired');
    }
  
    // OTP is valid, mark user as verified
    user.isVerified = true;
    user.otp = null;
    user.otpExpiry = null;
    user.otpAttempts = 0;
    await user.save();
  
    return true;
  }
    
// Define the login method inside the class

async function login(email, password) {
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
        throw new Error('Invalid credentials');
    }

    // Check if user is verified
    if (!user.isVerified) {
        throw new Error('User not verified');
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.password);
    if (!isValidPassword) {
        throw new Error('Invalid credentials');
    }

    // Generate new token
    const token = generateToken(user._id);

    // Update user's token in database
    await User.findByIdAndUpdate(user._id, { token });

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        },
        token: token
        
    };
}


// Get random user from UserList
async function getUserList(token) {
    try {
        // Validate token and get current user
        const currentUser = await User.findOne({ token });
        if (!currentUser) {
            throw new Error('Invalid or expired token');
        }
        console.log(`Current user: ${currentUser.email}`);

        // Check if user has already been picked
        const alreadyUsed = await UserList.findOne({ picked_to: currentUser.email });

        if (alreadyUsed) {
            console.log("You have already picked");
            return {
                currentUser: formatUserResponse(currentUser),
                randomUser: null
            };
        }
        

        // Get random unpicked user
        const randomUser = await getRandomUnpickedUser(currentUser.email);
        if (!randomUser) {
            return {
                currentUser: formatUserResponse(currentUser),
                randomUser: null
            };
        }

        // Update picked user and send notification
        await updatePickedUser(randomUser._id, currentUser.email);
        await sendsanta(currentUser.email, randomUser.email);

        return {
            currentUser: formatUserResponse(currentUser),
            randomUser
        };

    } catch (error) {
        console.error("Error fetching random user:", error);
        throw error;
    }
}

// Helper functions
function formatUserResponse(user) {
    return {
        id: user._id,
        name: user.name,
        email: user.email,
        isVerified: user.isVerified
    };
}

async function getRandomUnpickedUser(currentUserEmail) {
    const randomUsers = await UserList.aggregate([
        { 
            $match: { 
                picked: false,
                email: { $ne: currentUserEmail }
            } 
        },
        { $sample: { size: 1 } }
    ]);
    return randomUsers[0] || null;
}

async function updatePickedUser(userId, pickedToEmail) {
    return UserList.findByIdAndUpdate(
        userId,
        {
            $set: {
                picked: true,
                picked_to: pickedToEmail
            }
        }
    );
}



module.exports = {
  generateOTP,
  sendOTP,
  sendsanta,
  register,
  verifyOTP,
  login,
  getUserList
};