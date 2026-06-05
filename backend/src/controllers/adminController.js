const Claim = require('../models/Claim');

const getAllClaims = async (req, res) => {
  try {
    // Fetch all
    const claims = await Claim.find({})
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(claims);
  } catch (error) {
    console.error('Error fetching all claims:', error);
    res.status(500).json({ message: 'Error fetching claims' });
  }
};

const updateClaimDecision = async (req, res) => {
  try {
    const { decision, adminNotes } = req.body;
    
    // Find
    const claim = await Claim.findById(req.params.id);

    if (!claim) {
      return res.status(404).json({ message: 'Claim not found' });
    }

    // Update
    claim.decision = decision;
    claim.adminNotes = adminNotes || claim.adminNotes;
    claim.status = 'reviewed';

    // Save
    const updatedClaim = await claim.save();
    
    res.json(updatedClaim);
  } catch (error) {
    console.error('Error updating claim:', error);
    res.status(500).json({ message: 'Error updating claim decision' });
  }
};

module.exports = { getAllClaims, updateClaimDecision };