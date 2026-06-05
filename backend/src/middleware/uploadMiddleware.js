const multer = require('multer');
const path = require('path');

// Configure local storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Files will be saved in the backend/uploads directory
  },
  filename(req, file, cb) {
    // Format: claim-[timestamp]-[original-extension]
    cb(null, `claim-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Define acceptable file types (Images and PDFs)
const fileFilter = (req, file, cb) => {
  const filetypes = /jpe?g|png|pdf/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Images and PDFs only!'), false);
  }
};

// Initialize Multer
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit per file
});

module.exports = upload;