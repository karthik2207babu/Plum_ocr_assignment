const Claim = require('../models/Claim');
const { processDocument } = require('../services/ocr/ocrService');
const { extractStructuredData } = require('../services/ai/aiService');
const { evaluateClaim } = require('../services/adjudication/ruleEngine');

const submitClaim = async (req, res) => {
  try {
    // Verify file
    if (!req.file) {
      return res.status(400).json({ message: 'Please upload a document' });
    }

    const filePath = req.file.path;

    // OCR
    const rawOCRText = await processDocument(filePath);

    // AI
    const extractedData = await extractStructuredData(rawOCRText);

    // Evaluate
    const adjudicationResult = evaluateClaim(extractedData);

    // Save
    const newClaim = await Claim.create({
      userId: req.user._id, // Attached by auth middleware
      uploadedFiles: [filePath],
      rawOCRText: rawOCRText,
      extractedData: extractedData,
      decision: adjudicationResult.decision,
      approvedAmount: adjudicationResult.approvedAmount,
      rejectionReasons: adjudicationResult.rejectionReasons,
      adminNotes: adjudicationResult.notes,
      status: 'processed'
    });

    // Return
    res.status(201).json({
      claim_id: newClaim._id,
      decision: newClaim.decision,
      approved_amount: newClaim.approvedAmount,
      rejection_reasons: newClaim.rejectionReasons,
      notes: newClaim.adminNotes
    });

  } catch (error) {
    console.error('Claim Processing Error:', error);
    res.status(500).json({ message: 'Error processing claim', error: error.message });
  }
};
const getUserClaims = async (req, res) => {
  try {
    // Fetch user
    const claims = await Claim.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json(claims);
  } catch (error) {
    console.error('Error fetching user claims:', error);
    res.status(500).json({ message: 'Error fetching claims' });
  }
};

module.exports = { submitClaim, getUserClaims };
