const multer = require('multer');
const path = require('path');

// Storage
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Save
  },
  filename(req, file, cb) {
    // Format
    cb(null, `claim-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Allowed types
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

// Setup
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 } // Limit
});

module.exports = upload;