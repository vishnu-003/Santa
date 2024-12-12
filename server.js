// server.js
const app = require('./src/app');
const config = require('./src/config/environment');
const connectDB = require('./src/config/database');

// Connect to database
connectDB()
    .then(() => {
        app.listen(config.port, () => {
            console.log(`Server is running on port ${config.port}`);
        });
    })
    .catch(err => {
        console.error('Failed to start server:', err);
        process.exit(1);
    });
