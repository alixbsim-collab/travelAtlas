import React from 'react';

function LoadingSpinner({ size = 'md', text = 'Loading...' }) {
  const sizes = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4">
      <div className="relative">
        {/* Spinning globe icon */}
        <div className={`${sizes[size]} animate-spin`}>
          <svg
            className="w-full h-full text-coral-500"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <div className="absolute inset-0 flex items-center justify-center text-2xl">
          🌍
        </div>
      </div>
      {text && (
        <p className="text-platinum-600 font-medium">{text}</p>
      )}
    </div>
  );
}

export default LoadingSpinner;
