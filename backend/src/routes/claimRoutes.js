const express = require('express');
const router = express.Router();
const { submitClaim, getUserClaims } = require('../controllers/claimController');
const { getAllClaims, updateClaimDecision } = require('../controllers/adminController');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// --- User Routes ---
// POST /api/claims/submit
router.post('/submit', protect, upload.single('document'), submitClaim);

// GET /api/claims/my-claims
router.get('/my-claims', protect, getUserClaims);


// --- Admin Routes ---
// GET /api/claims (Requires both protect and admin middleware)
router.get('/', protect, admin, getAllClaims);

// PUT /api/claims/:id/review (Requires both protect and admin middleware)
router.put('/:id/review', protect, admin, updateClaimDecision);

module.exports = router;