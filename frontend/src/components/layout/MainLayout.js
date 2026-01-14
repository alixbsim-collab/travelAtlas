import React from 'react';
import Header from './Header';
import Footer from './Footer';

function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-neutral-cream">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
