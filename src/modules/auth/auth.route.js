const express = require('express');

const { login,getProfile,logout,forgotPassword,resetPassword } = require('./auth.controller');
const { loginValidation,resetPasswordValidation,changePasswordValidation } = require('./auth.validation');
const authenticate = require('../../middleware/authenticate');
const validateRequest = require('../../middleware/validateRequest');
const authController = require('./auth.controller');

const router = express.Router();



// POST /api/v1/auth/login
router.post('/login',loginValidation,validateRequest,login);
router.post('/logout',authenticate,logout);
router.get('/me',authenticate,getProfile);
router.post('/forgot-password',validateRequest,authController.forgotPassword);
router.post('/reset-password',resetPasswordValidation,validateRequest,authController.resetPassword);
router.post('/change-password',changePasswordValidation,authenticate,validateRequest,authController.changePassword);
module.exports = router;