import React from 'react';
import { Link } from 'react-router-dom';
import { Github as GitHub, Twitter, Instagram } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';

const Footer: React.FC = () => {
  const { darkMode } = useTheme();

  return (
    <footer className="bg-white dark:bg-dark-card shadow-inner pt-10 pb-6">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo and tagline */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center">
              <img 
                src={darkMode ? "/workbru-logo_White-transparent-navbar.png" : "/workbru-logo_Purple-navbar.png"}
                alt="Workbru"
                className="h-8"
              />
            </Link>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Find the perfect workspace for your productivity needs, anywhere you go.
            </p>
            <div className="mt-6 flex space-x-4">
              <a href="#" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200">
                <GitHub className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-500 hover:text-primary-600 dark:text-gray-400 dark:hover:text-primary-400 transition-colors duration-200">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Product</h3>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">Coming Soon!</p>
          </div>
          
          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200 uppercase tracking-wider">Support</h3>
          </div>
        </div>
        
        <div className="mt-10 pt-6 border-t border-gray-200 dark:border-dark-border">
          <p className="text-sm text-center text-gray-500 dark:text-gray-400">
            &copy; {new Date().getFullYear()} Workbru. All rights reserved. App crafted by{' '}
            <a 
              href="https://dragoonstudio.com" 
              target="_blank" 
              rel="noopener noreferrer" 
              className="text-primary-600 dark:text-primary-400 hover:underline"
            >
              Dragoon Studio
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;