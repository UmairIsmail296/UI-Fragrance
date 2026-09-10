import React, { createContext, useContext, useState, useCallback } from 'react';

const OrderFormContext = createContext(null);

export const OrderFormProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [presetPerfume, setPresetPerfume] = useState('');

  const openOrderForm = useCallback((perfumeName = '') => {
    setPresetPerfume(perfumeName);
    setIsOpen(true);
  }, []);

  const closeOrderForm = useCallback(() => {
    setIsOpen(false);
    setPresetPerfume('');
  }, []);

  return (
    <OrderFormContext.Provider
      value={{ isOpen, presetPerfume, openOrderForm, closeOrderForm }}
    >
      {children}
    </OrderFormContext.Provider>
  );
};

export const useOrderForm = () => {
  const context = useContext(OrderFormContext);
  if (!context) {
    throw new Error('useOrderForm must be used within an OrderFormProvider');
  }
  return context;
};
