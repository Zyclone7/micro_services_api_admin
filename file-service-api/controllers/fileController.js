const cloudinary = require('../config/cloudinary');
const File = require('../models/File');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');

// Multer storage configuration
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Upload files and metadata to Cloudinary
exports.uploadFiles = async (req, res) => {
  try {
    const epubFile = req.files.epub[0];
    const coverImage = req.files.coverImage[0];
    const { title, author, description } = req.body;

    // Check if the uploaded ePub file is valid
    if (epubFile.mimetype !== 'application/epub+zip') {
      return res.status(400).json({ error: 'Only ePub files are allowed' });
    }

    // Upload the ePub file to the epub_files folder in Cloudinary
    const epubUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: 'raw', 
          folder: 'epub_files', // Specify the folder in Cloudinary
          public_id: `${uuidv4()}-${epubFile.originalname}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(epubFile.buffer);
    });

    // Upload the cover image to Cloudinary
    const coverImageUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'cover_images', // Specify the folder in Cloudinary
          public_id: `${uuidv4()}-${coverImage.originalname}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(coverImage.buffer);
    });

    // Save the file details and metadata in the database
    const newFile = new File({
      originalName: epubFile.originalname,
      publicId: epubUploadResult.public_id,
      url: epubUploadResult.secure_url,
      coverImage: {
        originalName: coverImage.originalname,
        publicId: coverImageUploadResult.public_id,
        url: coverImageUploadResult.secure_url,
      },
      title,       // Save title from request
      author,      // Save author from request
      description  // Save description from request
    });

    await newFile.save();
    res.status(201).json(newFile);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Retrieve a file by its public ID
exports.getFile = async (req, res) => {
  try {
    const file = await File.findById(req.params.id);

    if (!file) {c
      return res.status(404).json({ error: 'File not found' });
    }

    res.json(file);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Delete a file from Cloudinary and its record from the database
exports.deleteFile = async (req, res) => {
try {
  const { id } = req.params;

  // Find the file by ID
  const file = await File.findById(id);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Log the publicId for debugging
  console.log('Deleting ePub file with publicId:', file.publicId);

  // Delete the ePub file from Cloudinary
  const epubDeletionResult = await cloudinary.uploader.destroy(file.publicId, { resource_type: 'raw' });

  // Log the deletion result for debugging
  console.log('ePub Deletion Result:', epubDeletionResult);

  // Check if the deletion of the ePub file was successful
  if (epubDeletionResult.result !== 'ok') {
    return res.status(500).json({ error: 'Failed to delete ePub file from Cloudinary', details: epubDeletionResult });
  }

  // Log the coverImage publicId for debugging
  console.log('Deleting cover image with publicId:', file.coverImage.publicId);

  // Delete the cover image from Cloudinary
  const coverImageDeletionResult = await cloudinary.uploader.destroy(file.coverImage.publicId);

  // Log the deletion result for debugging
  console.log('Cover Image Deletion Result:', coverImageDeletionResult);

  // Check if the deletion of the cover image was successful
  if (coverImageDeletionResult.result !== 'ok') {
    return res.status(500).json({ error: 'Failed to delete cover image from Cloudinary', details: coverImageDeletionResult });
  }

  // Delete the file record from the database
  await File.deleteOne({ _id: id });

  res.json({ message: 'File and cover image deleted successfully from Cloudinary and database' });
} catch (error) {
  console.error('Error during file deletion:', error);
  res.status(500).json({ error: 'Server error' });
}
};
// Update a file's metadata and/or files in Cloudinary and the database
exports.updateFile = async (req, res) => {
try {
  const { id } = req.params;
  const { title, author, description } = req.body;

  // Find the file by ID
  let file = await File.findById(id);

  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Check if a new ePub file is provided and update it
  if (req.files.epub) {
    const epubFile = req.files.epub[0];

    if (epubFile.mimetype !== 'application/epub+zip') {
      return res.status(400).json({ error: 'Only ePub files are allowed' });
    }

    // Delete the old ePub file from Cloudinary
    await cloudinary.uploader.destroy(file.publicId, { resource_type: 'raw' });

    // Upload the new ePub file to Cloudinary
    const epubUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          resource_type: 'raw', 
          folder: 'epub_files', 
          public_id: `${uuidv4()}-${epubFile.originalname}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(epubFile.buffer);
    });

    // Update file details in the database
    file.originalName = epubFile.originalname;
    file.publicId = epubUploadResult.public_id;
    file.url = epubUploadResult.secure_url;
  }

  // Check if a new cover image is provided and update it
  if (req.files.coverImage) {
    const coverImage = req.files.coverImage[0];

    // Delete the old cover image from Cloudinary
    await cloudinary.uploader.destroy(file.coverImage.publicId);

    // Upload the new cover image to Cloudinary
    const coverImageUploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { 
          folder: 'cover_images', 
          public_id: `${uuidv4()}-${coverImage.originalname}`
        },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      ).end(coverImage.buffer);
    });

    // Update cover image details in the database
    file.coverImage.originalName = coverImage.originalname;
    file.coverImage.publicId = coverImageUploadResult.public_id;
    file.coverImage.url = coverImageUploadResult.secure_url;
  }

  // Update metadata in the database
  if (title) file.title = title;
  if (author) file.author = author;
  if (description) file.description = description;

  await file.save();
  res.json(file);
} catch (error) {
  console.error('Error during file update:', error);
  res.status(500).json({ error: 'Server error' });
}
};


// Get all files
exports.getAllFiles = async (req, res) => {
  try {
    const epubFiles = await File.find({ originalName: { $regex: /\.epub$/, $options: 'i' } });

    res.json(epubFiles);
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};


// Multer middleware for handling file uploads
exports.uploadMiddleware = upload.fields([
  { name: 'epub', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
]);
