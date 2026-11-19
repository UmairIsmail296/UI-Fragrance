import React, { useCallback, useEffect, useState } from 'react';
import api from '../../utils/api.js';

const formatDate = (value) => (value ? new Date(value).toLocaleString() : '—');

const ContactInquiryManager = () => {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchInquiries = useCallback(async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const { data } = await api.get('/contact');
      setInquiries(Array.isArray(data) ? data : []);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to load customer inquiries.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInquiries();
  }, [fetchInquiries]);

  return (
    <section className="admin-section">
      <div className="admin-section-header">
        <h2>Customer Inquiries</h2>
        <button
          type="button"
          className="btn-outline small"
          onClick={fetchInquiries}
          disabled={loading}
        >
          Refresh
        </button>
      </div>

      {errorMessage && <p className="admin-inquiry-error" role="alert">{errorMessage}</p>}

      {loading ? (
        <div className="spinner-wrap" role="status"><div className="spinner" /></div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table admin-inquiries-table">
            <thead>
              <tr>
                <th>Received</th>
                <th>Name</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Message</th>
              </tr>
            </thead>
            <tbody>
              {inquiries.map((inquiry) => (
                <tr key={inquiry._id}>
                  <td>{formatDate(inquiry.createdAt)}</td>
                  <td>{inquiry.name}</td>
                  <td><a href={`tel:${inquiry.phone}`}>{inquiry.phone}</a></td>
                  <td><a href={`mailto:${inquiry.email}`}>{inquiry.email}</a></td>
                  <td className="admin-inquiry-message">{inquiry.message}</td>
                </tr>
              ))}
              {inquiries.length === 0 && (
                <tr><td colSpan={5} className="text-center">No customer inquiries yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
};

export default ContactInquiryManager;
