import React, { useEffect, useState } from 'react';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import './CartIcon.css';

const CartIcon = () => {
  const { getTotalItems } = useCart();
  const [count, setCount] = useState(getTotalItems());
  const [bump, setBump] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const current = getTotalItems();
    if (current !== count) {
      setCount(current);
      if (current > 0) {
        setBump(true);
        const t = setTimeout(() => setBump(false), 300);
        return () => clearTimeout(t);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [getTotalItems()]);

  return (
    <button className={`cart-icon ${bump ? 'bump' : ''}`} onClick={() => navigate('/cart')} aria-label="View cart">
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" stroke="#d4af37" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        <circle cx="10" cy="20" r="1" fill="#d4af37" />
        <circle cx="18" cy="20" r="1" fill="#d4af37" />
      </svg>
      {count > 0 && <span className="cart-badge">{count}</span>}
    </button>
  );
};

export default CartIcon;
