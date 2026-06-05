import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { api } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useContext(AuthContext);
  
  const [claims, setClaims] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal State
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [reviewDecision, setReviewDecision] = useState('APPROVED');
  const [adminNotes, setAdminNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchClaims();
  }, []);

  const fetchClaims = async () => {
    setIsLoading(true);
    try {
      const data = await api.getAllClaims();
      setClaims(data);
    } catch (error) {
      console.error('Failed to fetch all claims:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openReviewModal = (claim) => {
    setSelectedClaim(claim);
    setReviewDecision('APPROVED');
    setAdminNotes(claim.adminNotes || '');
  };

  const closeModal = () => {
    setSelectedClaim(null);
    setAdminNotes('');
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await api.reviewClaim(selectedClaim._id, {
        decision: reviewDecision,
        adminNotes: adminNotes
      });
      
      await fetchClaims(); // Refresh the table
      closeModal();
    } catch (error) {
      alert(error.message || 'Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDecisionColor = (decision) => {
    switch (decision) {
      case 'APPROVED': return 'var(--success)';
      case 'REJECTED': return 'var(--error)';
      case 'PARTIAL': return '#f59e0b';
      case 'MANUAL_REVIEW': return '#3b82f6';
      default: return 'var(--text-muted)';
    }
  };

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <h2>Admin Control Panel</h2>
          <p style={{ color: 'var(--text-muted)' }}>Logged in as {user?.name}</p>
        </div>
        <button className="btn" onClick={logout} style={{ backgroundColor: 'var(--text-muted)' }}>
          Logout
        </button>
      </div>

      <div className="card">
        <h3 style={{ marginBottom: '1rem' }}>All System Claims</h3>
        
        {isLoading ? (
          <p>Loading system claims...</p>
        ) : claims.length === 0 ? (
          <p style={{ color: 'var(--text-muted)' }}>No claims found in the database.</p>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', backgroundColor: '#f9fafb' }}>
                  <th style={{ padding: '0.75rem' }}>Date</th>
                  <th style={{ padding: '0.75rem' }}>User</th>
                  <th style={{ padding: '0.75rem' }}>Status</th>
                  <th style={{ padding: '0.75rem' }}>Decision</th>
                  <th style={{ padding: '0.75rem' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {claims.map((claim) => (
                  <tr key={claim._id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem' }}>
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <strong>{claim.userId?.name || 'Unknown'}</strong><br/>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{claim.userId?.email}</span>
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{ 
                        padding: '0.25rem 0.5rem', 
                        borderRadius: '999px', 
                        fontSize: '0.75rem',
                        backgroundColor: claim.status === 'reviewed' ? '#d1fae5' : '#e0e7ff'
                      }}>
                        {claim.status.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: '0.75rem', fontWeight: 'bold', color: getDecisionColor(claim.decision) }}>
                      {claim.decision}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <button 
                        onClick={() => openReviewModal(claim)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: claim.decision === 'MANUAL_REVIEW' ? 'var(--primary-color)' : 'var(--text-muted)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer'
                        }}
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Review Modal */}
      {selectedClaim && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '2rem', zIndex: 1000
        }}>
          <div className="card" style={{ 
            width: '100%', maxWidth: '800px', maxHeight: '90vh', 
            overflowY: 'auto', backgroundColor: 'white' 
          }}>
            <h2 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1rem' }}>
              Manual Claim Review
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', marginBottom: '2rem' }}>
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>AI Extracted Data</h4>
                <pre style={{ 
                  backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '4px', 
                  fontSize: '0.85rem', overflowX: 'auto', maxHeight: '300px' 
                }}>
                  {JSON.stringify(selectedClaim.extractedData, null, 2)}
                </pre>
              </div>
              
              <div>
                <h4 style={{ marginBottom: '0.5rem' }}>Raw OCR Text</h4>
                <div style={{ 
                  backgroundColor: '#f3f4f6', padding: '1rem', borderRadius: '4px', 
                  fontSize: '0.85rem', whiteSpace: 'pre-wrap', maxHeight: '300px', overflowY: 'auto' 
                }}>
                  {selectedClaim.rawOCRText || 'No text extracted.'}
                </div>
              </div>
            </div>

            <form onSubmit={handleReviewSubmit} style={{ borderTop: '1px solid var(--border-color)', paddingTop: '1rem' }}>
              <div className="input-group">
                <label>Admin Override Decision</label>
                <select 
                  value={reviewDecision} 
                  onChange={(e) => setReviewDecision(e.target.value)}
                  style={{ fontWeight: 'bold' }}
                >
                  <option value="APPROVED">APPROVE CLAIM</option>
                  <option value="REJECTED">REJECT CLAIM</option>
                  <option value="PARTIAL">PARTIAL APPROVAL</option>
                </select>
              </div>

              <div className="input-group">
                <label>Adjudication Notes (Visible to User)</label>
                <textarea 
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '4px', minHeight: '100px', border: '1px solid var(--border-color)' }}
                  placeholder="Explain the reasoning for this override..."
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal} className="btn" style={{ backgroundColor: 'white', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
                  Cancel
                </button>
                <button type="submit" className="btn" disabled={isSubmitting}>
                  {isSubmitting ? 'Saving...' : 'Finalize Decision'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;