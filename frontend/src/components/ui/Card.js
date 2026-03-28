import React from 'react';
import { motion } from 'framer-motion';

function Card({ children, className = '', hover = false, ...rest }) {
  if (hover) {
    return (
      <motion.div
        whileHover={{ y: -6, boxShadow: '0 8px 30px rgba(44,66,81,0.12), 0 2px 8px rgba(44,66,81,0.06)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
        className={`bg-white rounded-2xl shadow-card border border-platinum-200/60 p-6 cursor-pointer ${className}`}
        {...rest}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl shadow-card border border-platinum-200/60 p-6 ${className}`}
      {...rest}
    >
      {children}
    </div>
  );
}

export default Card;
