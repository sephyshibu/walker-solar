import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin, FiSend, FiCheck } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { contactApi } from '../services/api';
import SEO from '../components/common/SEO';
import toast from 'react-hot-toast';
import './Contact.css';

const Contact: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [contactId, setContactId] = useState('');
  const [whatsappSent, setWhatsappSent] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await contactApi.create(formData);
      setWhatsappUrl(response.data.data.whatsappUrl);
      setContactId(response.data.data.contact.id);
      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleWhatsAppClick = async () => {
    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    
    // Mark as WhatsApp sent
    try {
      await contactApi.markWhatsAppSent(contactId);
      setWhatsappSent(true);
      toast.success('WhatsApp message tracked!');
    } catch (error) {
      console.error('Failed to track WhatsApp status:', error);
    }
  };

  const resetForm = () => {
    setSubmitted(false);
    setWhatsappUrl('');
    setContactId('');
    setWhatsappSent(false);
    setFormData({
      name: '',
      email: '',
      phone: '',
      subject: '',
      message: '',
    });
  };

  if (submitted) {
    return (
      <div className="contact-page">
        <div className="container">
          <div className="success-message">
            <div className="success-icon">
              <FiCheck />
            </div>
            <h2>Thank You!</h2>
            <p>Your message has been sent successfully.</p>
            <p className="whatsapp-info">
              For faster response, click the button below to send your message directly to our WhatsApp!
            </p>
            <button 
              className={`btn btn-whatsapp btn-lg ${whatsappSent ? 'sent' : ''}`}
              onClick={handleWhatsAppClick}
            >
              <FaWhatsapp />
              {whatsappSent ? 'WhatsApp Sent ✓' : 'Send via WhatsApp'}
            </button>
            {whatsappSent && (
              <p className="whatsapp-confirmed">
                <FiCheck /> We've received your WhatsApp message notification!
              </p>
            )}
            <div className="success-actions">
              <button className="btn btn-secondary" onClick={resetForm}>
                Send Another Message
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="contact-page">
      <SEO 
        title="Contact Us - Get in Touch | WALKERS"
        description="Contact WALKERS for solar product inquiries, quotes, technical support or general questions. Call us, email us or visit our store. We're here to help!"
        keywords="contact WALKERS, solar support, solar inquiry, get quote, solar installation help"
        url="https://walkers.com/contact"
      />
      
      <div className="container">
        <div className="contact-header">
          <h1>Contact Us</h1>
          <p>Have questions? We'd love to hear from you.</p>
        </div>

        <div className="contact-layout">
          <div className="contact-info">
            <div className="info-card">
              <FiMapPin className="info-icon" />
              <h3>Our Location</h3>
              <p>123 Solar Street<br />Green City, India - 600001</p>
            </div>
            <div className="info-card">
              <FiPhone className="info-icon" />
              <h3>Phone</h3>
              <p><a href="tel:+919876543210">+91 98765 43210</a></p>
            </div>
            <div className="info-card">
              <FiMail className="info-icon" />
              <h3>Email</h3>
              <p><a href="mailto:info@solarshop.com">info@solarshop.com</a></p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Your Name *</label>
                <input
                  type="text"
                  name="name"
                  className="form-input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email Address *</label>
                <input
                  type="email"
                  name="email"
                  className="form-input"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  className="form-input"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subject *</label>
                <select
                  name="subject"
                  className="form-input"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select a subject</option>
                  <option value="Product Inquiry">Product Inquiry</option>
                  <option value="Quote Request">Quote Request</option>
                  <option value="Technical Support">Technical Support</option>
                  <option value="Order Status">Order Status</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Message *</label>
              <textarea
                name="message"
                className="form-input form-textarea"
                value={formData.message}
                onChange={handleChange}
                placeholder="How can we help you?"
                required
              />
            </div>

            <button type="submit" className="btn btn-primary btn-lg" disabled={loading}>
              <FiSend />
              {loading ? 'Sending...' : 'Send Message'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
