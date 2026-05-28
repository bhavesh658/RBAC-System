require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const logger = require("./utils/logger")
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Start Express server
    app.listen(PORT, () => {
      logger.info(`Server is running on port ${PORT}`);

    });
  } catch (error) {
    logger.error('Server Startup Error:', error.message);
    process.exit(1);
  }
};

startServer();