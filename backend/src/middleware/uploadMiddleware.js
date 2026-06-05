const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Storage configuration
const storage = multer.diskStorage({
  destination(req, file, cb) {
    const dir = 'uploads/';
    // Check if directory exists, if not, create it
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename(req, file, cb) {
    // Format: claim-[timestamp].[extension]
    cb(null, `claim-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Allowed file types
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

// Setup multer with limits
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 5MB limit
});

module.exports = upload;