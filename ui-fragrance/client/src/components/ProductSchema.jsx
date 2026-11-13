import React from 'react';
import { Helmet } from 'react-helmet-async';
import { resolveAssetUrl } from '../utils/api.js';

const SITE_URL = 'https://ui-fragrance.store';

const ProductSchema = ({ product }) => {
  const image = product.photos?.[0] || product.image;
  const imageUrl = image
    ? new URL(resolveAssetUrl(image), SITE_URL).toString()
    : undefined;
  const productUrl = new URL(`/product/${product._id}`, SITE_URL).toString();
  const price = Number(product.discountPrice ?? product.actualPrice);

  const structuredData = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description,
    ...(imageUrl ? { image: imageUrl } : {}),
    sku: String(product._id),
    brand: 'UI Fragrance',
    offers: {
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: 'PKR',
      price,
      availability: 'https://schema.org/InStock',
    },
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(structuredData).replace(/</g, '\\u003c')}
      </script>
    </Helmet>
  );
};

export default ProductSchema;
