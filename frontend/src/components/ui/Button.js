import React from 'react';
import { motion } from 'framer-motion';

function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled = false,
  className = '',
  type = 'button',
  ...rest
}) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-coral-400 text-white hover:bg-coral-500 focus:ring-coral-400',
    secondary: 'bg-columbia-700 text-white hover:bg-columbia-800 focus:ring-columbia-600',
    outline: 'border-2 border-coral-400 text-coral-500 hover:bg-coral-50 focus:ring-coral-400',
    accent: 'bg-naples-400 text-charcoal-500 hover:bg-naples-500 focus:ring-naples-400',
    ghost: 'text-charcoal-400 hover:bg-platinum-100 focus:ring-platinum-300',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-2.5 text-base',
    lg: 'px-8 py-3 text-lg',
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={disabled}
      whileHover={disabled ? {} : { scale: 1.02 }}
      whileTap={disabled ? {} : { scale: 0.97 }}
      className={`${baseStyles} ${variants[variant] || variants.primary} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
}

export default Button;
