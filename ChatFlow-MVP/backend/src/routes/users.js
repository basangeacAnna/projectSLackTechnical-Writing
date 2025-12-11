const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// @route   GET api/users/:userId
// @desc    Get user profile
// @access  Public (or Protected if you prefer, keeping it Public for now as per spec)
router.get('/:userId', userController.getUserProfile);

// @route   PUT api/users/me
// @desc    Update own profile
// @access  Private
router.put('/me', auth, userController.updateUserProfile);

module.exports = router;
