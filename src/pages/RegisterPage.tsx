import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Lock, UserPlus, Eye, EyeOff, User, Check, X } from 'lucide-react';
import { signUpWithEmail } from '../lib/supabase';
import anime from 'animejs';

const RegisterPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false,
  });
  
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
  
  // Check password strength when password changes
  useEffect(() => {
    const strength = {
      score: 0,
      hasMinLength: password.length >= 8,
      hasUpperCase: /[A-Z]/.test(password),
      hasLowerCase: /[a-z]/.test(password),
      hasNumber: /[0-9]/.test(password),
      hasSpecialChar: /[^A-Za-z0-9]/.test(password),
    };
    
    let score = 0;
    if (strength.hasMinLength) score++;
    if (strength.hasUpperCase) score++;
    if (strength.hasLowerCase) score++;
    if (strength.hasNumber) score++;
    if (strength.hasSpecialChar) score++;
    
    strength.score = score;
    setPasswordStrength(strength);
  }, [password]);
  
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password || !confirmPassword || !firstName || !lastName) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (passwordStrength.score < 3) {
      setError('Please create a stronger password');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const { error } = await signUpWithEmail(email, password, firstName, lastName);
      
      if (error) {
        throw error;
      }

      // Auth listener will handle the redirect to /app
      
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Failed to register. Please try again.');
      setLoading(false);
      
      // Shake animation for error
      anime({
        targets: 'form',
        translateX: [0, -10, 10, -10, 10, 0],
        duration: 400,
        easing: 'easeInOutQuad'
      });
    }
  };
  
  // Get password strength color
  const getPasswordStrengthColor = () => {
    if (passwordStrength.score <= 1) return 'bg-red-500';
    if (passwordStrength.score <= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gray-50 dark:bg-dark-bg">
      <div className="max-w-md w-full bg-white dark:bg-dark-card rounded-xl shadow-xl overflow-hidden">
        <div className="p-6 sm:p-8">
          <div className="logo text-center mb-8">
            <h1 className="text-3xl font-bold text-primary-700 dark:text-primary-400">Workbru</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Find your perfect workspace</p>
          </div>
          
          <h2 className="form-element text-2xl font-bold text-gray-900 dark:text-white mb-6 text-center">Create an Account</h2>
          
          {error && (
            <div className="form-element mb-6 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}
          
          <form onSubmit={handleRegister}>
            <div className="form-element mb-6 grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                    placeholder="John"
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name
                </label>
                <input
                  id="lastName"
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200"
                  placeholder="Doe"
                />
              </div>
            </div>
            
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
              
              {/* Password strength indicator */}
              {password.length > 0 && (
                <div className="mt-2">
                  <div className="w-full h-1.5 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${getPasswordStrengthColor()}`} 
                      style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                    <div className="flex items-center">
                      {passwordStrength.hasMinLength ? 
                        <Check className="h-3 w-3 text-green-500 mr-1" /> : 
                        <X className="h-3 w-3 text-red-500 mr-1" />
                      }
                      <span className="text-gray-600 dark:text-gray-400">At least 8 characters</span>
                    </div>
                    <div className="flex items-center">
                      {passwordStrength.hasUpperCase ? 
                        <Check className="h-3 w-3 text-green-500 mr-1" /> : 
                        <X className="h-3 w-3 text-red-500 mr-1" />
                      }
                      <span className="text-gray-600 dark:text-gray-400">Uppercase letter</span>
                    </div>
                    <div className="flex items-center">
                      {passwordStrength.hasLowerCase ? 
                        <Check className="h-3 w-3 text-green-500 mr-1" /> : 
                        <X className="h-3 w-3 text-red-500 mr-1" />
                      }
                      <span className="text-gray-600 dark:text-gray-400">Lowercase letter</span>
                    </div>
                    <div className="flex items-center">
                      {passwordStrength.hasNumber ? 
                        <Check className="h-3 w-3 text-green-500 mr-1" /> : 
                        <X className="h-3 w-3 text-red-500 mr-1" />
                      }
                      <span className="text-gray-600 dark:text-gray-400">Number</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="form-element mb-6">
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`block w-full pl-10 pr-3 py-2 border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-colors duration-200 ${
                    confirmPassword && password !== confirmPassword 
                      ? 'border-red-500 dark:border-red-700' 
                      : 'border-gray-300 dark:border-dark-border'
                  }`}
                  placeholder="••••••••"
                />
                {confirmPassword && password !== confirmPassword && (
                  <div className="text-red-500 text-xs mt-1">Passwords don't match</div>
                )}
              </div>
            </div>
            
            <div className="form-element mb-6">
              <div className="flex items-start">
                <div className="flex items-center h-5">
                  <input
                    id="terms"
                    type="checkbox"
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                </div>
                <div className="ml-3 text-sm">
                  <label htmlFor="terms" className="text-gray-600 dark:text-gray-400">
                    I agree to the{' '}
                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Terms of Service
                    </a>{' '}
                    and{' '}
                    <a href="#" className="text-primary-600 dark:text-primary-400 hover:underline">
                      Privacy Policy
                    </a>
                  </label>
                </div>
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
                  <UserPlus className="h-5 w-5 mr-2" />
                )}
                Create Account
              </button>
            </div>
          </form>
          
          <div className="form-element text-center mt-6">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Already have an account?{' '}
              <Link to="/login" className="text-primary-600 dark:text-primary-400 hover:underline font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;