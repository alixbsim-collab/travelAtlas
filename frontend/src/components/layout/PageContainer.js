import React from 'react';

function PageContainer({ children, className = '' }) {
  return (
    <div className={`container mx-auto px-4 py-8 ${className}`}>
      {children}
    </div>
  );
}

export default PageContainer;
