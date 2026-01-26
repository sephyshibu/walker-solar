import React, { useState } from 'react';
import { FiMail, FiPhone, FiMapPin } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import SEO from '../components/common/SEO';
import toast from 'react-hot-toast';
import './Contact.css';

const Contact: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  // WhatsApp number (replace with your actual number)
  const WHATSAPP_NUMBER = '917356645787'; // Format: country code + number without +

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);

    // Build WhatsApp message
    const whatsappMessage = `*New Contact Form Message*
    
*Name:* ${formData.name}
*Email:* ${formData.email}
*Phone:* ${formData.phone || 'Not provided'}
*Subject:* ${formData.subject}

*Message:*
${formData.message}`;

    // Encode message for URL
    const encodedMessage = encodeURIComponent(whatsappMessage);
    
    // Create WhatsApp URL
    const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
    
    // Open WhatsApp in new tab
    window.open(whatsappUrl, '_blank');
    
    toast.success('Opening WhatsApp...');
    setLoading(false);
    
    // Reset form after a short delay
    setTimeout(() => {
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    }, 1000);
  };

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
                  placeholder="Enter your name"
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
                  placeholder="Enter your email"
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
                  placeholder="Enter your phone number"
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

            <button type="submit" className="btn btn-whatsapp btn-lg" disabled={loading}>
              <FaWhatsapp />
              {loading ? 'Opening WhatsApp...' : 'Send Message via WhatsApp'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;