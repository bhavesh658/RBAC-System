const mongoose = require('mongoose');
const logger = require('../utils/logger');

const connectDB = async () => {
    try {
        const connection = await mongoose.connect(process.env.MONGODB_URI);
        logger.info({ message: `MongoDB Connected: ${connection.connection.host}` });
    
    
    } catch (error) {
        logger.error({ message: 'MongoDB Connection Error:', error: error.message });
        process.exit(1);
    }
};

module.exports = connectDB;