import React, { useState } from 'react';
import { Helmet } from 'react-helmet-async';
import './FAQSection.css';

const FAQS = [
  {
    question: 'What are UI Fragrance Eau de Parfum perfumes, and how long do they last?',
    answer:
      'Morning Dew, Rose Noir and Aethel are 50 ml Eau de Parfum (EDP) fragrances. They are formulated for 8+ hours of lasting power; actual longevity can vary with skin, weather and how you apply the fragrance.',
  },
  {
    question: 'How long does delivery take, and do you ship across Pakistan?',
    answer:
      'We ship nationwide across Pakistan. Delivery is estimated at 2–4 business days for major cities and 4–7 business days for other areas. You can use your tracking ID on our Track Order page to check your order status.',
  },
  {
    question: 'Which payment methods can I use?',
    answer:
      'You can choose Cash on Delivery (COD) or a secure online payment method offered at checkout. Available online payment options are shown when you place your order.',
  },
  {
    question: 'How does the 30% pre-booking discount work?',
    answer:
      'The 30% discount applies to eligible fragrances while their pre-booking offer is open, and the discounted price is shown when you place your order. Pre-booked orders are dispatched within 5–7 business days.',
  },
  {
    question: 'What should I do if my perfume arrives damaged or leaking?',
    answer:
      'Please contact UI Fragrance support within 24–48 hours of delivery and share clear photos or a video of the unboxing and the damaged or leaking bottle so we can arrange a replacement. For other return or exchange questions, contact support before sending an item back.',
  },
  {
    question: 'Are UI Fragrance perfumes authentic?',
    answer:
      'UI Fragrance perfumes are created using our original fragrance formulations. Morning Dew, Rose Noir and Aethel are part of our own Eau de Parfum collection.',
  },
  {
    question: 'How should I store my Eau de Parfum?',
    answer:
      'For the best shelf life, keep your perfume tightly capped in a cool, dry place away from direct sunlight, heat and humidity. Avoid storing it in a bathroom or leaving it in a hot car.',
  },
];

const faqStructuredData = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQS.map(({ question, answer }) => ({
    '@type': 'Question',
    name: question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: answer,
    },
  })),
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <>
      <Helmet>
        <script type="application/ld+json">
          {JSON.stringify(faqStructuredData).replace(/</g, '\\u003c')}
        </script>
      </Helmet>
      <section className="faq-section" aria-labelledby="faq-heading">
        <div className="faq-section__container">
          <header className="faq-section__header">
            <span className="faq-section__eyebrow">A little more clarity</span>
            <h2 id="faq-heading">
              Frequently asked <em>questions</em>
            </h2>
            <p>
              Helpful details about our fragrances, delivery and caring for
              your order.
            </p>
          </header>

          <div className="faq-section__list">
            {FAQS.map(({ question, answer }, index) => {
              const isOpen = openIndex === index;
              const buttonId = `faq-question-${index + 1}`;
              const panelId = `faq-answer-${index + 1}`;

              return (
                <article className="faq-section__item" key={question}>
                  <h3 className="faq-section__question-heading">
                    <button
                      id={buttonId}
                      className="faq-section__question"
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => setOpenIndex(isOpen ? null : index)}
                    >
                      <span>{question}</span>
                      <svg
                        className={`faq-section__icon${isOpen ? ' is-open' : ''}`}
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path d="M12 5v14M5 12h14" />
                      </svg>
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    className={`faq-section__panel${isOpen ? ' is-open' : ''}`}
                    role="region"
                    aria-labelledby={buttonId}
                    aria-hidden={!isOpen}
                  >
                    <div className="faq-section__panel-inner">
                      <p>{answer}</p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default FAQSection;
