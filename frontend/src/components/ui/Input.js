import React from 'react';

function Input({
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  error,
  disabled = false,
  required = false,
  className = '',
  id,
  name
}) {
  const inputId = id || name || label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-charcoal-500 mb-2"
        >
          {label}
          {required && <span className="text-primary-500 ml-1">*</span>}
        </label>
      )}
      <input
        id={inputId}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        className={`
          w-full px-4 py-2.5 rounded-lg border-2
          ${error ? 'border-red-500 focus:border-red-500' : 'border-gray-300 focus:border-primary-500'}
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-200' : 'focus:ring-primary-200'}
          disabled:bg-gray-100 disabled:cursor-not-allowed
          transition-colors duration-200
        `}
      />
      {error && (
        <p className="mt-1 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Input;
