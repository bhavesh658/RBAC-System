const winston = require('winston');
require('winston-daily-rotate-file'); 
const path = require('path');

const logLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';

const logger = winston.createLogger({
  level: logLevel,
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }), 
    winston.format.json() 
  ),
  transports: [
    new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '../logs', 'application-%DATE%.log'), 
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true, 
      maxSize: '20m',      
      maxFiles: '14d',     
    }),
    
    new winston.transports.DailyRotateFile({
      filename: path.join(__dirname, '../logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',      // Is file mein sirf errors jayenge
    })
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(), // Info, Warn, Error alag-alag color ke dikhenge
      winston.format.printf(({ timestamp, level, message, stack }) => {
        return `[${timestamp}] ${level}: ${stack || message}`; // Local par JSON ke badle normal text dikhega
      })
    ),
  }));
}

module.exports = logger;