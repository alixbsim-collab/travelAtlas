import React from 'react';
import Header from './Header';
import Footer from './Footer';
import AnimatedLayout from './AnimatedLayout';

function MainLayout({ children }) {
  return (
    <div className="flex flex-col min-h-screen bg-naples-50">
      <Header />
      <main className="flex-grow">
        <AnimatedLayout>
          {children}
        </AnimatedLayout>
      </main>
      <Footer />
    </div>
  );
}

export default MainLayout;
