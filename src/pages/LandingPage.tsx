import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, ChevronRight, Mail, ArrowRight, CheckCircle } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import { addToPica } from '../lib/pica';
import anime from 'animejs';

const LandingPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (heroRef.current) {
      anime({
        targets: heroRef.current.querySelectorAll('.animate-item'),
        translateY: [50, 0],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 1500,
        delay: (el, i) => 300 + 100 * i
      });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await addToPica(email);

      setSuccess(true);
      setEmail('');

      anime({
        targets: '.success-message',
        scale: [0.9, 1],
        opacity: [0, 1],
        easing: 'easeOutExpo',
        duration: 600
      });

    } catch (err: any) {
      console.error('Subscription error:', err);
      setError(err.message || 'Failed to subscribe. Please try again.');

      anime({
        targets: '.subscription-form',
        translateX: [0, -10, 10, -10, 10, 0],
        duration: 400,
        easing: 'easeInOutQuad'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-white dark:bg-gradient-to-b dark:from-primary-500 dark:via-primary-700 dark:to-primary-950">
      <Navbar />
      
      {/* Hero Section */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="animate-item text-4xl sm:text-5xl md:text-6xl font-bold text-primary-600 dark:text-white leading-tight mb-6">
              Find Your Perfect <span className="text-accent-green-500 dark:text-accent-green-400">Workspace</span>
            </h1>
            <p className="animate-item text-xl text-primary-700 dark:text-gray-200 mb-10 max-w-2xl mx-auto">
              Coming soon: Discover coffee shops, coworking spaces, and more with all the amenities you need to be productive on the go.
            </p>

            {/* Subscription Form */}
            <div className="animate-item subscription-form max-w-md mx-auto">
              {success ? (
                <div className="success-message bg-primary-50/80 dark:bg-white/10 backdrop-blur-sm rounded-lg p-6 text-primary-700 dark:text-white">
                  <div className="flex items-center justify-center mb-4">
                    <div className="bg-accent-green-500 rounded-full p-2">
                      <CheckCircle className="h-6 w-6 text-white" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">You're on the list!</h3>
                  <p>We'll notify you when Workbru launches.</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="relative">
                  <div className="flex items-center">
                    <div className="relative flex-grow">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Enter your email"
                        className="w-full pl-10 pr-4 py-3 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-primary-300 border border-primary-200 dark:border-0 bg-primary-50/80 dark:bg-white/10 backdrop-blur-sm text-primary-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-300"
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-3 bg-primary-600 text-white rounded-r-lg hover:bg-primary-700 transition-colors duration-200 flex items-center"
                    >
                      {loading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                        <>
                          Join Waitlist
                          <ArrowRight className="ml-2 h-5 w-5" />
                        </>
                      )}
                    </button>
                  </div>
                  {error && (
                    <p className="absolute -bottom-6 left-0 text-sm text-red-600 dark:text-red-300">{error}</p>
                  )}
                </form>
              )}
            </div>

            {/* Preview Image */}
            <div className="animate-item mt-16 max-w-5xl mx-auto relative">
              <div className="bg-primary-100/50 dark:bg-white/10 rounded-xl p-1 backdrop-blur-sm">
                <div className="rounded-lg overflow-hidden shadow-2xl">
                  <img 
                    src="https://images.pexels.com/photos/4427622/pexels-photo-4427622.jpeg" 
                    alt="Person working in a cafe" 
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LandingPage;