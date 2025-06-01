import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Navbar from '../ui/Navbar';
import Footer from '../ui/Footer';
import anime from 'animejs';

const MainLayout: React.FC = () => {
  const location = useLocation();

  // Page transition animation using anime.js
  useEffect(() => {
    // Create animation when the component mounts or route changes
    anime({
      targets: '.page-content',
      opacity: [0, 1],
      translateY: [20, 0],
      easing: 'easeOutExpo',
      duration: 600,
      delay: 100
    });
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <Navbar />
      <main className="flex-grow pt-16"> {/* Reduced from pt-20 to pt-16 */}
        <div className="page-content container mx-auto px-4 py-8">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;