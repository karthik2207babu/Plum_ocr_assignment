const mongoose = require('mongoose');

const claimSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  uploadedFiles: [{ type: String, required: true }],
  rawOCRText: { type: String },
  extractedData: { type: mongoose.Schema.Types.Mixed },
  validationResults: { type: mongoose.Schema.Types.Mixed },
  decision: { 
    type: String, 
    enum: ['PENDING', 'APPROVED', 'REJECTED', 'PARTIAL', 'MANUAL_REVIEW'],
    default: 'PENDING'
  },
  approvedAmount: { type: Number, default: 0 },
  rejectionReasons: [{ type: String }],
  confidenceScore: { type: Number },
  status: { type: String, default: 'processing' },
  adminNotes: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Claim', claimSchema);