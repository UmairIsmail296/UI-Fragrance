import React from 'react';
import { Helmet } from 'react-helmet-async';

const SITE_URL = 'https://www.ui-fragrance.store';
const DEFAULT_TITLE =
  'UI Fragrance | Buy Luxury & Long Lasting Perfumes in Pakistan';
const DEFAULT_DESCRIPTION =
  'Shop luxury and long lasting perfumes in Pakistan at UI Fragrance. Discover signature scents with nationwide delivery.';
const DEFAULT_KEYWORDS =
  'perfumes in Pakistan, long lasting perfumes in Pakistan, luxury perfumes, UI Fragrance';
const DEFAULT_IMAGE = '/IMG_E1195.JPG';

const toAbsoluteUrl = (value) => new URL(value, SITE_URL).toString();

const SEO = ({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  keywords = DEFAULT_KEYWORDS,
  canonical,
  image = DEFAULT_IMAGE,
  ogType = 'website',
  ogTitle = title,
  ogDescription = description,
  ogUrl,
  ogImage = image,
}) => {
  const canonicalUrl = toAbsoluteUrl(
    canonical || (typeof window !== 'undefined' ? window.location.pathname : '/')
  );
  const imageUrl = toAbsoluteUrl(image);
  const ogImageUrl = toAbsoluteUrl(ogImage);
  const ogUrlValue = ogUrl ? toAbsoluteUrl(ogUrl) : canonicalUrl;

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="keywords" content={keywords} />
      <link rel="canonical" href={canonicalUrl} />

      <meta property="og:type" content={ogType} />
      <meta property="og:site_name" content="UI Fragrance" />
      <meta property="og:url" content={ogUrlValue} />
      <meta property="og:title" content={ogTitle} />
      <meta property="og:description" content={ogDescription} />
      <meta property="og:image" content={ogImageUrl} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={ogTitle} />
      <meta name="twitter:description" content={ogDescription} />
      <meta name="twitter:image" content={ogImageUrl} />
    </Helmet>
  );
};

export default SEO;
