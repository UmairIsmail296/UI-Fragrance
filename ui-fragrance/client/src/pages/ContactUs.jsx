import React, { useState } from 'react';
import SEO from '../components/SEO.jsx';
import api from '../utils/api.js';
import './ContactUs.css';

const EMPTY_FORM = {
  name: '',
  phone: '',
  email: '',
  message: '',
};

const EMAIL_PATTERN = /^\S+@\S+\.\S+$/;
const PHONE_PATTERN = /^\+?[\d\s().-]+$/;

const validateForm = (form) => {
  const errors = {};
  const phoneDigits = form.phone.replace(/\D/g, '');

  if (!form.name.trim()) {
    errors.name = 'Please enter your name.';
  } else if (form.name.trim().length > 120) {
    errors.name = 'Your name must be 120 characters or fewer.';
  }

  if (!form.phone.trim()) {
    errors.phone = 'Please enter your phone number.';
  } else if (!PHONE_PATTERN.test(form.phone.trim()) || phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Enter a valid phone number with 7 to 15 digits.';
  }

  if (!form.email.trim()) {
    errors.email = 'Please enter your email address.';
  } else if (!EMAIL_PATTERN.test(form.email.trim())) {
    errors.email = 'Please enter a valid email address.';
  } else if (form.email.trim().length > 254) {
    errors.email = 'Your email address must be 254 characters or fewer.';
  }

  if (!form.message.trim()) {
    errors.message = 'Please enter your message.';
  } else if (form.message.trim().length > 5000) {
    errors.message = 'Your message must be 5000 characters or fewer.';
  }

  return errors;
};

const ContactUs = () => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => {
      if (!current[name]) return current;
      const next = { ...current };
      delete next[name];
      return next;
    });
    setSubmitError('');
    setSuccessMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitting) return;

    const nextErrors = validateForm(form);
    setErrors(nextErrors);
    setSubmitError('');
    setSuccessMessage('');
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    try {
      const { data } = await api.post('/contact', {
        name: form.name.trim(),
        phone: form.phone.trim(),
        email: form.email.trim(),
        message: form.message.trim(),
      });
      setForm(EMPTY_FORM);
      setErrors({});
      setSuccessMessage(data.message || 'Your message has been sent successfully.');
    } catch (error) {
      setSubmitError(
        error.response?.data?.message ||
          'We could not send your message. Please try again or contact us directly.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="contact-page">
      <SEO
        title="Contact UI Fragrance | Customer Support in Pakistan"
        description="Contact UI Fragrance for help with fragrances, orders and delivery across Pakistan."
        canonical="/contact"
      />
      <section className="contact-page__intro" aria-labelledby="contact-heading">
        <p className="contact-page__eyebrow">We are here to help</p>
        <h1 id="contact-heading">Contact <em>Us</em></h1>
        <p>
          Have a question about a fragrance or an order? Send us a message and
          our team will be happy to help.
        </p>
      </section>

      <div className="contact-page__content">
        <section className="contact-page__form-card" aria-labelledby="contact-form-heading">
          <div className="contact-page__form-heading">
            <span>Get in touch</span>
            <h2 id="contact-form-heading">Send us a message</h2>
            <p>All fields are required.</p>
          </div>

          <form className="contact-form" onSubmit={handleSubmit} noValidate>
            <div className="contact-form__field">
              <label htmlFor="contact-name">Your Name</label>
              <input
                id="contact-name"
                name="name"
                type="text"
                autoComplete="name"
                maxLength={120}
                value={form.name}
                onChange={handleChange}
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'contact-name-error' : undefined}
                required
              />
              {errors.name && <span id="contact-name-error" className="contact-form__error">{errors.name}</span>}
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-phone">Phone Number</label>
              <input
                id="contact-phone"
                name="phone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                maxLength={30}
                value={form.phone}
                onChange={handleChange}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? 'contact-phone-error' : undefined}
                required
              />
              {errors.phone && <span id="contact-phone-error" className="contact-form__error">{errors.phone}</span>}
            </div>

            <div className="contact-form__field">
              <label htmlFor="contact-email">Email Address</label>
              <input
                id="contact-email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                value={form.email}
                onChange={handleChange}
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'contact-email-error' : undefined}
                required
              />
              {errors.email && <span id="contact-email-error" className="contact-form__error">{errors.email}</span>}
            </div>

            <div className="contact-form__field contact-form__field--message">
              <label htmlFor="contact-message">Message</label>
              <textarea
                id="contact-message"
                name="message"
                rows={6}
                maxLength={5000}
                value={form.message}
                onChange={handleChange}
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? 'contact-message-error' : undefined}
                required
              />
              {errors.message && <span id="contact-message-error" className="contact-form__error">{errors.message}</span>}
            </div>

            {submitError && <p className="contact-form__notice is-error" role="alert">{submitError}</p>}
            {successMessage && <p className="contact-form__notice is-success" role="status">{successMessage}</p>}

            <button className="contact-form__submit" type="submit" disabled={submitting}>
              {submitting ? (
                <>
                  <span className="contact-form__spinner" aria-hidden="true" />
                  Sending...
                </>
              ) : (
                'Send message'
              )}
            </button>
          </form>
        </section>

        <aside className="contact-page__support" aria-label="Other ways to contact us">
          <span className="contact-page__eyebrow">Client care</span>
          <h2>A little help goes a long way.</h2>
          <p>Prefer to reach us directly? Our team is available every day.</p>
          <div className="contact-page__support-links">
            <a href="https://wa.me/923096248054" target="_blank" rel="noopener noreferrer">
              <span>WhatsApp</span>
              <strong>+92 309 6248054</strong>
            </a>
            <a href="mailto:hellouifragrance@gmail.com">
              <span>Email</span>
              <strong>hellouifragrance@gmail.com</strong>
            </a>
            <div>
              <span>Available hours</span>
              <strong>Mon – Sun, 08:00 AM – 10:00 PM</strong>
            </div>
          </div>
        </aside>
      </div>

    </main>
  );
};

export default ContactUs;
