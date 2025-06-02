import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, LogIn, Eye, EyeOff } from 'lucide-react';
import { signInWithEmail } from '../lib/supabase';
import anime from 'animejs';

const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Animate form elements on mount
    anime({
      targets: '.form-element',
      translateY: [20, 0],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 800,
      delay: anime.stagger(100, {start: 300})
    });
    
    // Animate logo
    anime({
      targets: '.logo',
      scale: [0.9, 1],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 1000
    });
  }, []);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { data, error } = await signInWithEmail(email, password);
      
      if (error) {
        throw error;
      }
      
      if (data) {
        // Get the attempted route or default to /app
        const attemptedRoute = localStorage.getItem('attemptedRoute') || '/app';
        // Clear the attempted route
        localStorage.removeItem('attemptedRoute');
        
        // Success animation before redirect
        await anime({
          targets: 'form',
          opacity: [1, 0],
          translateY: [0, -20],
          easing: 'easeInOutQuad',
          duration: 400
        }).finished;
        
        // Navigate to the attempted route or default route
        navigate(attemptedRoute, { replace: true });
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to login. Please check your credentials.');
      
      // Shake animation for error
      anime({
        targets: 'form',
        translateX: [0, -10, 10, -10, 10, 0],
        duration: 400,
        easing: 'easeInOutQuad'
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="logo text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-400">Workbru</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Find your perfect workspace</p>
          </div>
          
          <h2 className="form-element text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Sign In</h2>
          
          {error && (
            <div className="form-element mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleLogin}>
            <div className="form-element mb-6">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                  placeholder="you@example.com"
                />
              </div>
            </div>
            
            <div className="form-element mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? 
                    <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-500" /> : 
                    <Eye className="h-5 w-5 text-gray-400 hover:text-gray-500" />
                  }
                </button>
              </div>
            </div>
            
            <div className="form-element mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                  Forgot password?
                </a>
              </div>
            </div>
            
            <div className="form-element mb-6">
              <button
                type="submit"
                disabled={loading}
                className="w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors duration-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                ) : (
                  <LogIn className="h-5 w-5 mr-2" />
                )}
                Sign In
              </button>
            </div>
          </form>
          
          <div className="form-element text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have an account?{' '}
              <Link to="/register" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Sign up
              </Link>
            </p>
          </div>
          
          <div className="form-element text-center mt-8">
            <p className="text-xs text-gray-500 dark:text-gray-500">
              By signing in, you agree to our{' '}
              <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                Terms of Service
              </a>{' '}
              and{' '}
              <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                Privacy Policy
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;