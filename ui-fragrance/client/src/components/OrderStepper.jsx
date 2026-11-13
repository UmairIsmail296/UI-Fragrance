import React from 'react';
import './OrderStepper.css';

const STEPS = ['Pending', 'Processing', 'Shipped', 'Delivered'];

const OrderStepper = ({ currentStatus }) => {
  if (currentStatus === 'Cancelled') {
    return (
      <div className="order-stepper__message order-stepper__message--cancelled">
        <span aria-hidden="true">×</span>
        Order cancelled
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(currentStatus);

  if (currentIndex === -1) {
    return (
      <div className="order-stepper__message">
        Order status unavailable
      </div>
    );
  }

  return (
    <ol
      className="order-stepper"
      aria-label="Order progress"
    >
      {STEPS.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isActive = index === currentIndex;

        return (
          <li
            key={step}
            className={`order-stepper__item ${
              isCompleted ? 'order-stepper__item--completed' : ''
            } ${isActive ? 'order-stepper__item--active' : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <span className="order-stepper__icon" aria-hidden="true">
              {isCompleted ? '✓' : index + 1}
            </span>

            <span className="order-stepper__label">{step}</span>

            <span className="order-stepper__state">
              {isCompleted ? 'Completed' : isActive ? 'Current' : 'Upcoming'}
            </span>

            {index < STEPS.length - 1 && (
              <span className="order-stepper__line" aria-hidden="true" />
            )}
          </li>
        );
      })}
    </ol>
  );
};

export default OrderStepper;