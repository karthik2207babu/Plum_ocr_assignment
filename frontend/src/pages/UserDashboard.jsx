import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

const UserDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  
  const [claims, setClaims] = useState([]);
  const [isLoadingClaims, setIsLoadingClaims] = useState(true);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadFeedback, setUploadFeedback] = useState(null); // { type: 'success' | 'error', message: '' }

  // Fetch claims on component mount
  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setIsLoadingClaims(true);
    try {
      const data = await api.getUserClaims();
      setClaims(data);
    } catch (error) {
      console.error('Failed to fetch claims:', error);
    } finally {
      setIsLoadingClaims(false);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setUploadFeedback(null);
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadFeedback({ type: 'error', message: 'Please select a file first.' });
      return;
    }

    setIsUploading(true);
    setUploadFeedback(null);

    const formData = new FormData();
    // The key 'document' MUST match the upload.single('document') in our Node backend
    formData.append('document', selectedFile);

    try {
      const result = await api.submitClaim(formData);
      setUploadFeedback({ 
        type: 'success', 
        message: `Claim processed! Decision: ${result.decision}` 
      });
      setSelectedFile(null);
      // Reset the file input visually
      document.getElementById('file-upload').value = '';
      
      // Refresh the history list
      fetchClaims();
    } catch (error) {
      setUploadFeedback({ type: 'error', message: error.message || 'Failed to upload claim.' });
    } finally {
      setIsUploading(false);
    }
  };

  // Helper to color-code decisions
  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'APPROVED': return 'var(--success)';
      case 'REJECTED': return 'var(--error)';
      case 'PARTIAL': return '#f59e0b'; // warning orange
      case 'MANUAL_REVIEW': return '#3b82f6'; // blue
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h2>Welcome, {user?.name}</h2>
        <button className="btn" onClick={logout} style={{ backgroundColor: 'var(--text-muted)' }}>
          Logout
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '2rem' }}>
        
        {/* Left Column: Upload Form */}
        <div className="card" style={{ height: 'fit-content' }}>
          <h3 style={{ marginBottom: '1rem' }}>Submit New Claim</h3>
          
          <form onSubmit={handleUploadSubmit}>
            <div className="input-group">
              <label htmlFor="file-upload">Upload Medical Bill or Prescription</label>
              <input 
                type="file" 
                id="file-upload" 
                accept=".jpg,.jpeg,.png,.pdf"
                onChange={handleFileChange}
                disabled={isUploading}
              />
              <small style={{ color: 'var(--text-muted)', display: 'block', marginTop: '0.5rem' }}>
                Supported formats: JPG, PNG, PDF (Max 5MB)
              </small>
            </div>

            {uploadFeedback && (
              <div style={{ 
                padding: '0.75rem', 
                marginBottom: '1rem', 
                borderRadius: '4px',
                backgroundColor: uploadFeedback.type === 'success' ? '#d1fae5' : '#fee2e2',
                color: uploadFeedback.type === 'success' ? '#065f46' : '#991b1b'
              }}>
                {uploadFeedback.message}
              </div>
            )}

            <button 
              type="submit" 
              className="btn" 
              style={{ width: '100%' }}
              disabled={isUploading || !selectedFile}
            >
              {isUploading ? 'AI is Processing...' : 'Submit Claim'}
            </button>
          </form>
        </div>

        {/* Right Column: Claim History */}
        <div className="card">
          <h3 style={{ marginBottom: '1rem' }}>My Claim History</h3>
          
          {isLoadingClaims ? (
            <p>Loading your claims...</p>
          ) : claims.length === 0 ? (
            <p style={{ color: 'var(--text-muted)' }}>You haven't submitted any claims yet.</p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border-color)' }}>
                    <th style={{ padding: '0.75rem' }}>Date</th>
                    <th style={{ padding: '0.75rem' }}>Decision</th>
                    <th style={{ padding: '0.75rem' }}>Approved Amount</th>
                    <th style={{ padding: '0.75rem' }}>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.map((claim) => (
                    <tr key={claim._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.75rem' }}>
                        {new Date(claim.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: '0.75rem', fontWeight: 'bold', color: getDecisionColor(claim.decision) }}>
                        {claim.decision}
                      </td>
                      <td style={{ padding: '0.75rem' }}>
                        ₹{claim.approvedAmount || 0}
                      </td>
                      <td style={{ padding: '0.75rem', fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                        {claim.adminNotes || (claim.rejectionReasons?.length > 0 ? claim.rejectionReasons.join(', ') : 'No notes')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default UserDashboard;