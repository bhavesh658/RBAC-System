const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require("./middleware/sanitizeRequest")
const apiRoutes = require('./routes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true,
}));
app.use(morgan('combined'));

app.use(mongoSanitize)

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());



const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later',
  },
});

app.use(limiter);


app.get('/api/v1/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running successfully',
  });
});

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "RBAC API is running"
  });
});
app.use('/api/v1', apiRoutes);


app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
  });
});


app.use(errorHandler);

module.exports = app;