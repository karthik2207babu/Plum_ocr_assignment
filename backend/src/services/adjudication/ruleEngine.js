// SOURCE: policy_terms.json
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

  // ---------------------------------------------------------
  // STEP 1: GARBAGE/AI CONFIDENCE CHECK 
  // SOURCE: adjudication_rules.md - Special Scenarios (System confidence < 70%)
  // ---------------------------------------------------------
  if (extractedData.confidence_score < 0.70) {
    return {
      decision: 'MANUAL_REVIEW',
      approvedAmount: 0,
      rejectionReasons: ['LOW_CONFIDENCE'],
      notes: `System confidence score (${extractedData.confidence_score}) is below 70%. Suspected illegible document or non-medical image.`
    };
  }

  // ---------------------------------------------------------
  // STEP 2: DOCUMENT VALIDATION
  // SOURCE: adjudication_rules.md - Category 2: Documentation Issues
  // ---------------------------------------------------------
  if (!extractedData.doctor_name && !extractedData.diagnosis && extractedData.total_amount === 0) {
    rejectionReasons.push('MISSING_DOCUMENTS');
    notes.push("Missing valid prescription or bill details.");
  }
  
  // SOURCE: adjudication_rules.md - DOCTOR_REG_INVALID
  if (!extractedData.doctor_reg_no) {
    rejectionReasons.push('DOCTOR_REG_INVALID');
    notes.push("Doctor registration number is missing or invalid.");
  }

  // ---------------------------------------------------------
  // STEP 3: PROCESS ISSUES
  // SOURCE: adjudication_rules.md - Category 6: Process Issues
  // SOURCE: policy_terms.json - claim_requirements.minimum_claim_amount
  // ---------------------------------------------------------
  if (extractedData.total_amount < POLICY.MIN_CLAIM_AMOUNT) {
    rejectionReasons.push('BELOW_MIN_AMOUNT');
    notes.push(`Claim amount (₹${extractedData.total_amount}) is below the minimum threshold of ₹${POLICY.MIN_CLAIM_AMOUNT}.`);
  }

  // ---------------------------------------------------------
  // STEP 4: COVERAGE & EXCLUSIONS
  // SOURCE: adjudication_rules.md - Category 3: Coverage Issues
  // SOURCE: policy_terms.json - exclusions
  // ---------------------------------------------------------
  const fullTextContext = `${extractedData.diagnosis} ${extractedData.procedures?.join(' ')}`.toLowerCase();
  
  const hasExclusion = POLICY.EXCLUSIONS.some(exclusion => fullTextContext.includes(exclusion));
  if (hasExclusion) {
    rejectionReasons.push('SERVICE_NOT_COVERED');
    notes.push("Treatment contains excluded conditions (e.g., cosmetic, weight loss).");
  }

  // SOURCE: adjudication_rules.md - PRE_AUTH_MISSING
  // SOURCE: policy_terms.json - diagnostic_tests.covered_tests
  const testsContext = (extractedData.tests_prescribed || []).join(' ').toLowerCase();
  const needsPreAuth = POLICY.PRE_AUTH_REQUIRED.some(test => testsContext.includes(test));
  if (needsPreAuth) { // Note: In MVP we assume pre-auth is missing if test is present
    rejectionReasons.push('PRE_AUTH_MISSING');
    notes.push("High-value diagnostic test (MRI/CT) requires pre-authorization.");
  }

  // ---------------------------------------------------------
  // STEP 5: LIMIT VALIDATION & MATH
  // SOURCE: adjudication_rules.md - Category 4: Limit Issues
  // SOURCE: policy_terms.json - coverage_details
  // ---------------------------------------------------------
  
  // Calculate deductions (Consultation has 10% copay per policy_terms.json)
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

  // SOURCE: test_cases.json (TC003) & adjudication_rules.md - PER_CLAIM_EXCEEDED
  if (calculatedAmount > POLICY.PER_CLAIM_LIMIT) {
    rejectionReasons.push('PER_CLAIM_EXCEEDED');
    notes.push(`Claim amount exceeds per-claim limit of ₹${POLICY.PER_CLAIM_LIMIT}.`);
  }

  // ---------------------------------------------------------
  // FINAL DECISION LOGIC
  // ---------------------------------------------------------
  
  // If there are any rejection reasons, the claim is rejected.
  if (rejectionReasons.length > 0) {
    decision = 'REJECTED';
    approvedAmount = 0;
  } else {
    approvedAmount = calculatedAmount;
  }

  // Return the strict JSON format required by adjudication_rules.md Decision Output Format
  return {
    decision: decision,
    approvedAmount: approvedAmount,
    rejectionReasons: rejectionReasons,
    confidence_score: extractedData.confidence_score,
    notes: notes.join(' | ') || "Processed successfully."
  };
};

module.exports = { evaluateClaim };