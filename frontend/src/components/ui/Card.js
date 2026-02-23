import React from 'react';
import { motion } from 'framer-motion';

function Card({ children, className = '', hover = false, ...rest }) {
  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -4, boxShadow: '0 20px 40px -12px rgba(44,66,81,0.15)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        className={`bg-white rounded-2xl shadow-sm border border-platinum-200 p-6 cursor-pointer ${className}`}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-sm border border-platinum-200 p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
