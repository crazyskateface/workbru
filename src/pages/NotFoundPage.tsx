import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Home, ArrowLeft } from 'lucide-react';
import anime from 'animejs';

const NotFoundPage: React.FC = () => {
  useEffect(() => {
    // Animate the 404 text
    anime({
      targets: '.error-text',
      scale: [0.5, 1],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 1000
    });
    
    // Animate the map pin
    anime({
      targets: '.map-pin',
      translateY: ['50px', '0px'],
      rotate: ['45deg', '0deg'],
      opacity: [0, 1],
      easing: 'easeOutElastic(1, .5)',
      duration: 1500,
      delay: 300
    });
    
    // Animate the message and buttons
    anime({
      targets: '.content-fade',
      translateY: [20, 0],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 800,
      delay: anime.stagger(100, {start: 700})
    });
  }, []);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 bg-gray-50 dark:bg-dark-bg">
      <div className="text-center">
        <div className="relative mb-6">
          <h1 className="error-text text-9xl font-bold text-gray-200 dark:text-gray-800 opacity-0">404</h1>
          <div className="map-pin absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 opacity-0">
            <MapPin className="h-32 w-32 text-primary-500 dark:text-primary-600" />
          </div>
        </div>
        
        <h2 className="content-fade text-3xl font-bold text-gray-900 dark:text-white mb-4 opacity-0">
          Workspace Not Found
        </h2>
        <p className="content-fade text-lg text-gray-600 dark:text-gray-400 max-w-md mx-auto mb-8 opacity-0">
          The workspace you're looking for seems to be lost in the digital wilderness. Let's help you find your way back.
        </p>
        
        <div className="content-fade flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4 opacity-0">
          <Link 
            to="/"
            className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 transition-colors duration-200"
          >
            <Home className="h-5 w-5 mr-2" />
            Go to Homepage
          </Link>
          <button 
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center px-5 py-3 border border-gray-300 dark:border-gray-700 text-base font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-dark-card hover:bg-gray-50 dark:hover:bg-dark-input transition-colors duration-200"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFoundPage;