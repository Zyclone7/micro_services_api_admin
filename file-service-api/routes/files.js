const express = require('express');
const { 
  uploadFiles, 
  getFile, 
  deleteFile, 
  uploadMiddleware, 
  getAllFiles, 
  updateFile 
} = require('../controllers/fileController');
const { sendToQueue } = require('../config/rabbitmq'); // Import RabbitMQ utility

const router = express.Router();

// Route to upload new files
router.post('/upload', uploadMiddleware, async (req, res) => {
  try {
    const file = await uploadFiles(req, res);

    // Send message to RabbitMQ after successful file upload
    await sendToQueue('file_events', {
      action: 'upload',
      fileId: file._id,
      filename: file.filename,
      message: 'File has been uploaded successfully!'
    });

    res.status(201).json(file);
  } catch (error) {
    res.status(500).json({ error: 'File upload failed' });
  }
});

// Route to get a file by ID
router.get('/:id', getFile);

// Route to get all files
router.get('/', getAllFiles);

// Route to delete a file by ID
router.delete('/:id', async (req, res) => {
  try {
    const file = await deleteFile(req, res);

    // Send message to RabbitMQ after successful file deletion
    await sendToQueue('file_events', {
      action: 'delete',
      fileId: req.params.id,
      message: 'File has been deleted successfully!'
    });

    res.status(200).json({ message: 'File deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'File deletion failed' });
  }
});

// Route to update a file by ID
router.put('/:id', uploadMiddleware, async (req, res) => {
  try {
    const file = await updateFile(req, res);

    // Send message to RabbitMQ after successful file update
    await sendToQueue('file_events', {
      action: 'update',
      fileId: req.params.id,
      filename: file.filename,
      message: 'File has been updated successfully!'
    });

    res.status(200).json(file);
  } catch (error) {
    res.status(500).json({ error: 'File update failed' });
  }
});

module.exports = router;
