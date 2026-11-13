import React from 'react';
import TrackOrder from '../components/TrackOrder.jsx';
import './TrackOrderPage.css';

const TrackOrderPage = () => {
  return (
    <main className="page-fade track-page">
      <div className="container track-body">
        <TrackOrder />
      </div>
    </main>
  );
};

export default TrackOrderPage;