import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Sun, Moon, MapPin, User, LogOut } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getCurrentUser, signOut } from '../../lib/supabase';
import anime from 'animejs';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const location = useLocation();
  const { darkMode, toggleDarkMode } = useTheme();
  
  // Check if user is logged in
  useEffect(() => {
    const checkUser = async () => {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    };
    
    checkUser();
  }, []);
  
  // Handle scroll effect
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
  
  // Animate logo on mount
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
  
  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
    // Animate mobile menu
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
            <MapPin className="h-6 w-6 text-primary-600 dark:text-primary-400 mr-2" />
            <span className="text-2xl font-bold text-primary-700 dark:text-primary-300">Workbru</span>
          </Link>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link 
              to="/app" 
              className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
            >
              Find Spaces
            </Link>
            
            {/* Show login/register or user menu */}
            {user ? (
              <div className="relative">
                <button 
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                >
                  <User className="h-5 w-5" />
                  <span>Account</span>
                </button>
                
                {/* User dropdown menu */}
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-card rounded-md shadow-lg py-1 z-10">
                    <Link 
                      to="/app" 
                      className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-input"
                    >
                      Dashboard
                    </Link>
                    {user.role === 'admin' && (
                      <Link 
                        to="/admin" 
                        className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-input"
                      >
                        Admin Panel
                      </Link>
                    )}
                    <button 
                      onClick={handleSignOut}
                      className="block w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link 
                  to="/login" 
                  className="text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400 transition-colors duration-200"
                >
                  Login
                </Link>
                <Link 
                  to="/register" 
                  className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md transition-colors duration-200"
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
            <Link 
              to="/app" 
              className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
              onClick={() => setIsOpen(false)}
            >
              Find Spaces
            </Link>
            
            {user ? (
              <>
                <Link 
                  to="/app" 
                  className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setIsOpen(false)}
                >
                  Dashboard
                </Link>
                {user.role === 'admin' && (
                  <Link 
                    to="/admin" 
                    className="block py-2 text-gray-700 dark:text-gray-200 hover:text-primary-600 dark:hover:text-primary-400"
                    onClick={() => setIsOpen(false)}
                  >
                    Admin Panel
                  </Link>
                )}
                <button 
                  onClick={() => {
                    handleSignOut();
                    setIsOpen(false);
                  }}
                  className="block w-full text-left py-2 text-red-600 dark:text-red-400"
                >
                  <div className="flex items-center">
                    <LogOut className="h-4 w-4 mr-2" />
                    <span>Sign Out</span>
                  </div>
                </button>
              </>
            ) : (
              <>
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