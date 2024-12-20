const express = require('express');
const { 
  uploadFiles, 
  getFile, 
  deleteFile, 
  uploadMiddleware, 
  getAllFiles, 
  updateFile 
} = require('../controllers/fileController');

const router = express.Router();

// Helper function to handle async errors
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Route to upload new files
router.post('/upload', uploadMiddleware, asyncHandler(async (req, res) => {
  const file = await uploadFiles(req, res);
  res.status(201).json(file);
}));

// Route to get a file by ID
router.get('/:id', asyncHandler(getFile));

// Route to get all files
router.get('/', asyncHandler(getAllFiles));

// Route to delete a file by ID
router.delete('/:id', asyncHandler(async (req, res) => {
  await deleteFile(req, res);
  res.status(200).json({ message: 'File deleted successfully' });
}));

// Route to update a file by ID
router.put('/:id', uploadMiddleware, asyncHandler(async (req, res) => {
  const file = await updateFile(req, res);
  res.status(200).json(file);
}));

// Export the router
module.exports = router;
