// Policy
const POLICY = {
  MIN_CLAIM_AMOUNT: 500,
  PER_CLAIM_LIMIT: 5000,
  CONSULTATION_COPAY_PERCENTAGE: 10,
  EXCLUSIONS: [
    "cosmetic", "weight loss", "infertility", "experimental", 
    "self-inflicted", "adventure sports", "war", "hiv/aids", 
    "alcoholism", "drug abuse", "non-allopathic", "lasik", "teeth whitening"
  ],
  PRE_AUTH_REQUIRED: ["mri", "ct scan"]
};

const evaluateClaim = (extractedData) => {
  let decision = 'APPROVED';
  let approvedAmount = 0;
  let rejectionReasons = [];
  let notes = [];

  // Confidence
  if (extractedData.confidence_score < 0.70) {
    return {
      decision: 'MANUAL_REVIEW',
      approvedAmount: 0,
      rejectionReasons: ['LOW_CONFIDENCE'],
      notes: `System confidence score (${extractedData.confidence_score}) is below 70%. Suspected illegible document or non-medical image.`
    };
  }

  // Validate
  if (!extractedData.doctor_name && !extractedData.diagnosis && extractedData.total_amount === 0) {
    rejectionReasons.push('MISSING_DOCUMENTS');
    notes.push("Missing valid prescription or bill details.");
  }
  
  // Invalid
  if (!extractedData.doctor_reg_no) {
    rejectionReasons.push('DOCTOR_REG_INVALID');
    notes.push("Doctor registration number is missing or invalid.");
  }

  // Process
  if (extractedData.total_amount < POLICY.MIN_CLAIM_AMOUNT) {
    rejectionReasons.push('BELOW_MIN_AMOUNT');
    notes.push(`Claim amount (₹${extractedData.total_amount}) is below the minimum threshold of ₹${POLICY.MIN_CLAIM_AMOUNT}.`);
  }

  // Coverage
  const fullTextContext = `${extractedData.diagnosis} ${extractedData.procedures?.join(' ')}`.toLowerCase();
  
  const hasExclusion = POLICY.EXCLUSIONS.some(exclusion => fullTextContext.includes(exclusion));
  if (hasExclusion) {
    rejectionReasons.push('SERVICE_NOT_COVERED');
    notes.push("Treatment contains excluded conditions (e.g., cosmetic, weight loss).");
  }

  // Pre-auth
  const testsContext = (extractedData.tests_prescribed || []).join(' ').toLowerCase();
  const needsPreAuth = POLICY.PRE_AUTH_REQUIRED.some(test => testsContext.includes(test));
  if (needsPreAuth) { // Note: In MVP we assume pre-auth is missing if test is present
    rejectionReasons.push('PRE_AUTH_MISSING');
    notes.push("High-value diagnostic test (MRI/CT) requires pre-authorization.");
  }

  // Limits
  
  // Calculate
  let consultationFee = extractedData.breakdown?.consultation || 0;
  let medicinesFee = extractedData.breakdown?.medicines || 0;
  let testsFee = extractedData.breakdown?.tests || 0;
  
  // If AI couldn't break it down, fallback to total amount
  let calculatedAmount = extractedData.total_amount;
  
  if (consultationFee > 0) {
    let copayDeduction = consultationFee * (POLICY.CONSULTATION_COPAY_PERCENTAGE / 100);
    calculatedAmount = extractedData.total_amount - copayDeduction;
    notes.push(`Applied ${POLICY.CONSULTATION_COPAY_PERCENTAGE}% co-pay deduction (₹${copayDeduction}) to consultation fee.`);
  }

  // Exceeded
  if (calculatedAmount > POLICY.PER_CLAIM_LIMIT) {
    rejectionReasons.push('PER_CLAIM_EXCEEDED');
    notes.push(`Claim amount exceeds per-claim limit of ₹${POLICY.PER_CLAIM_LIMIT}.`);
  }

  // Decision
  
  // Reject
  if (rejectionReasons.length > 0) {
    decision = 'REJECTED';
    approvedAmount = 0;
  } else {
    approvedAmount = calculatedAmount;
  }

  // Return
  return {
    decision: decision,
    approvedAmount: approvedAmount,
    rejectionReasons: rejectionReasons,
    confidence_score: extractedData.confidence_score,
    notes: notes.join(' | ') || "Processed successfully."
  };
};

module.exports = { evaluateClaim };