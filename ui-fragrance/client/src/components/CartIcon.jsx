import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import './CartIcon.css';

export default function CartIcon() {
  const { getTotalItems } = useCart();
  const count = getTotalItems();
  const previousCount = useRef(count);
  const [bump, setBump] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const changed = count !== previousCount.current;
    previousCount.current = count;

    if (!changed) return;

    setBump(true);
    const timer = setTimeout(() => setBump(false), 300);

    return () => clearTimeout(timer);
  }, [count]);

  return (
    <button
      type="button"
      className={`cart-icon ${bump ? 'cart-icon--bump' : ''}`}
      onClick={() => navigate('/cart')}
      aria-label={`View cart, ${count} ${count === 1 ? 'item' : 'items'}`}
    >
      <svg
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
        <circle cx="10" cy="20" r="1" />
        <circle cx="18" cy="20" r="1" />
      </svg>

      {count > 0 && (
        <span className="cart-badge" aria-hidden="true">
          {count > 99 ? '99+' : count}
        </span>
      )}
    </button>
  );
}