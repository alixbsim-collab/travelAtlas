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
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-wide';

  const variants = {
    primary: 'bg-coral-400 text-white hover:bg-coral-500 focus:ring-coral-300 shadow-button hover:shadow-button-hover',
    secondary: 'bg-columbia-700 text-white hover:bg-columbia-800 focus:ring-columbia-500 shadow-sm hover:shadow-md',
    outline: 'border-2 border-coral-300 text-coral-500 hover:bg-coral-50 hover:border-coral-400 focus:ring-coral-300',
    accent: 'bg-naples-400 text-charcoal-500 hover:bg-naples-500 focus:ring-naples-300 shadow-sm hover:shadow-md',
    ghost: 'text-charcoal-400 hover:bg-platinum-100 hover:text-charcoal-500 focus:ring-platinum-300',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm gap-1.5',
    md: 'px-6 py-2.5 text-base gap-2',
    lg: 'px-8 py-3.5 text-lg gap-2',
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
