import React from 'react';
import FAQSection from '../components/FAQSection.jsx';
import SEO from '../components/SEO.jsx';

const FAQPage = () => (
  <main>
    <SEO
      title="Frequently Asked Questions | UI Fragrance"
      description="Find answers to common questions about UI Fragrance perfumes, delivery, payments and customer care."
      canonical="/faq"
    />
    <FAQSection />
  </main>
);

export default FAQPage;
