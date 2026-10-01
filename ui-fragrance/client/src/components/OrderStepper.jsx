import React from 'react';
import './OrderStepper.css';

const STEPS = [
  'Pending',
  'Processing',
  'Shipped',
  'Delivered',
];

const OrderStepper = ({ currentStatus }) => {
  if (currentStatus === 'Cancelled') {
    return <div className="order-stepper">Order Cancelled</div>;
  }

  const currentIndex = STEPS.indexOf(currentStatus);

  return (
    <div className="order-stepper">
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <div
            key={step}
            className={`stepper-item ${isCompleted ? 'completed' : ''} ${isActive ? 'active' : ''}`}
          >
            <div className="stepper-icon">
              {isCompleted ? '✓' : index + 1}
            </div>
            <p className="stepper-label">{step}</p>
            {index !== STEPS.length - 1 && <div className="stepper-line" />}
          </div>
        );
      })}
    </div>
  );
};

export default OrderStepper;
