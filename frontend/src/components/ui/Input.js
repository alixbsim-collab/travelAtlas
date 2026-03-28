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
  name,
  ...rest
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
          {required && <span className="text-coral-400 ml-1">*</span>}
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
          w-full px-4 py-3 rounded-xl border
          ${error ? 'border-red-400 focus:border-red-400' : 'border-platinum-300 focus:border-coral-300'}
          focus:outline-none focus:ring-2
          ${error ? 'focus:ring-red-100' : 'focus:ring-coral-100'}
          disabled:bg-platinum-50 disabled:cursor-not-allowed
          transition-all duration-200
          placeholder:text-platinum-400
        `}
        {...rest}
      />
      {error && (
        <p className="mt-1.5 text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}

export default Input;
