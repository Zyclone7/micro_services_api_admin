const express = require('express');
const {
  getTimeSpentByUserAndBook,
  saveTimeSpent,
  getAllTimeSpent,
  getTotalTimeSpentByUser,
  deleteUserTimeSpent,
} = require('../controllers/timeController');

const router = express.Router();

// Routes for time spent operations
router.get('/:userId/:bookId', getTimeSpentByUserAndBook);  // Get time spent on a specific book
router.post('/:userId/:bookId/:courseId', saveTimeSpent);  // Save time spent on a specific book for a specific course
router.get('/', getAllTimeSpent);  // Get all time spent data
router.get('/:userId', getTotalTimeSpentByUser);  // Get total time spent by a user (across all books)
router.delete('/:userId', deleteUserTimeSpent);  // Delete all time spent by a user

module.exports = router;
