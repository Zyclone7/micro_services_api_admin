const express = require('express');
const {
  getTimeSpentByUserAndBook,
  saveTimeSpent,
  getAllTimeSpent,
  getTotalTimeSpentByUser  // Import the new controller
} = require('../controllers/timeController');

const router = express.Router();

// Routes for time spent operations
router.get('/:userId/:bookId', getTimeSpentByUserAndBook);  // Get time spent on a specific book
router.post('/:userId/:bookId', saveTimeSpent);  // Save time spent on a specific book
router.get('/', getAllTimeSpent);  // Get all time spent data
router.get('/:userId', getTotalTimeSpentByUser);  // Get total time spent by a user (across all books)

module.exports = router;
