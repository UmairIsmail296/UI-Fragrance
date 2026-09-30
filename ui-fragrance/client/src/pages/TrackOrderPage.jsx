import React from 'react';
import TrackOrder from '../components/TrackOrder.jsx';
import './TrackOrderPage.css';

const TrackOrderPage = () => {
  return (
    <div className="page-fade track-page">
     

      <div className="container track-body">
        <TrackOrder />
      </div>
    </div>
  );
};

export default TrackOrderPage;
