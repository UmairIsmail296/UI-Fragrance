import React from 'react';
import TrackOrder from '../components/TrackOrder.jsx';
import './TrackOrderPage.css';

const TrackOrderPage = () => {
  return (
    <div className="page-fade track-page">
      <div className="track-hero">
        <div className="container text-center">
          <h1 className="section-title">
            Track Your <span>Order</span>
          </h1>
          <p className="section-subtitle">
            Enter your Order ID below to see the current status of your
            delivery.
          </p>
        </div>
      </div>

      <div className="container track-body">
        <TrackOrder />
      </div>
    </div>
  );
};

export default TrackOrderPage;
