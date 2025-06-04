import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import anime from 'animejs';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    anime({
      targets: '.logo',
      translateY: [20, 0],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 1000,
      delay: 300
    });
  }, []);
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      anime({
        targets: '.mobile-menu',
        translateY: [20, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 400
      });
    }
  };

  // Only show login/signup on non-root paths
  const showAuthButtons = location.pathname !== '/';
  
  return (
    <nav className={`fixed w-full z-10 transition-all duration-300 ${
      isScrolled || location.pathname !== '/' 
        ? 'bg-white dark:bg-dark-card shadow-md py-2' 
        : 'bg-transparent py-4'
    }`}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center">
          {/* Logo */}
          <Link to="/" className="logo flex items-center">
            <img 
              src={darkMode ? "/workbru-logo_White-transparent.svg" : "/workbru-logo_Purple.svg"}
              alt="Workbru"
              className="h-8"
            />
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {showAuthButtons && (
              <>
                <Link 
                  to="/app" 
                  className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  Find Spaces
                </Link>
                <Link 
                  to="/login" 
                  className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-md transition-colors duration-200"
                >
                  Sign Up
                </Link>
              </>
            )}
            
            {/* Theme toggle */}
            <button 
              onClick={toggleDarkMode}
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
          </div>
          
          {/* Mobile menu button */}
          <button 
            onClick={toggleMenu}
            className="md:hidden text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
          >
            {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
        
        {/* Mobile Navigation */}
        {isOpen && (
          <div className="mobile-menu md:hidden mt-4 py-4 border-t border-gray-200 dark:border-dark-border">
            {showAuthButtons && (
              <>
                <Link 
                  to="/app" 
                  className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setIsOpen(false)}
                >
                  Find Spaces
                </Link>
                <Link 
                  to="/login" 
                  className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setIsOpen(false)}
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setIsOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
            
            <button 
              onClick={() => {
                toggleDarkMode();
                setIsOpen(false);
              }}
              className="flex items-center py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
            >
              {darkMode ? (
                <>
                  <Sun className="h-4 w-4 mr-2" />
                  <span>Light Mode</span>
                </>
              ) : (
                <>
                  <Moon className="h-4 w-4 mr-2" />
                  <span>Dark Mode</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;