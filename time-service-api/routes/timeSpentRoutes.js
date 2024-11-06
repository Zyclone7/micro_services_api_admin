// timeRoutes.js

const express = require('express');
const {
  getTimeSpentByUserAndBook,
  saveTimeSpent,
  getAllTimeSpent
} = require('../controller/timeController');

const router = express.Router();

// Routes for time spent operations
router.get('/:userId/:bookId', getTimeSpentByUserAndBook);
router.post('/:userId/:bookId', saveTimeSpent);
router.get('/', getAllTimeSpent);

module.exports = router;
