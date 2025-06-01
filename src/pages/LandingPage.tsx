import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Coffee, Power, Users, Clock, MapPin, ChevronRight } from 'lucide-react';
import Navbar from '../components/ui/Navbar';
import Footer from '../components/ui/Footer';
import anime from 'animejs';

const LandingPage: React.FC = () => {
  const heroRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const testimonialsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Animate hero section on load
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

    // Animate features on scroll
    const featuresObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            anime({
              targets: featuresRef.current?.querySelectorAll('.feature-card'),
              translateY: [50, 0],
              opacity: [0, 1],
              easing: 'easeOutExpo',
              duration: 800,
              delay: (el, i) => 150 * i
            });
            featuresObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (featuresRef.current) {
      featuresObserver.observe(featuresRef.current);
    }

    // Animate testimonials on scroll
    const testimonialsObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            anime({
              targets: testimonialsRef.current?.querySelectorAll('.testimonial-card'),
              scale: [0.9, 1],
              opacity: [0, 1],
              easing: 'easeOutExpo',
              duration: 800,
              delay: (el, i) => 150 * i
            });
            testimonialsObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (testimonialsRef.current) {
      testimonialsObserver.observe(testimonialsRef.current);
    }

    return () => {
      if (featuresRef.current) featuresObserver.unobserve(featuresRef.current);
      if (testimonialsRef.current) testimonialsObserver.unobserve(testimonialsRef.current);
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      <Navbar />
      
      {/* Hero Section - Updated background gradient */}
      <section ref={heroRef} className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-primary-900 via-primary-800 to-purple-900 dark:from-primary-950 dark:via-primary-900 dark:to-purple-950">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="animate-item text-4xl sm:text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
              Find Your Perfect <span className="text-primary-300">Workspace</span>
            </h1>
            <p className="animate-item text-xl text-gray-200 mb-10 max-w-2xl mx-auto">
              Discover coffee shops, coworking spaces, and more with all the amenities you need to be productive on the go.
            </p>
            <div className="animate-item flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/app" 
                className="px-8 py-3 bg-primary-500 text-white rounded-lg shadow-lg hover:bg-primary-600 transition-all duration-300 transform hover:-translate-y-1 font-medium flex items-center justify-center"
              >
                Find Spaces
                <ChevronRight className="h-5 w-5 ml-2" />
              </Link>
              <Link 
                to="/register" 
                className="px-8 py-3 bg-white/10 text-white rounded-lg shadow-lg hover:bg-white/20 transition-all duration-300 transform hover:-translate-y-1 font-medium backdrop-blur-sm"
              >
                Sign Up
              </Link>
            </div>
          </div>
          
          <div className="animate-item mt-16 max-w-5xl mx-auto relative">
            <div className="bg-gradient-to-r from-primary-500/20 to-purple-500/20 rounded-xl p-1 backdrop-blur-sm">
              <div className="rounded-lg overflow-hidden shadow-2xl">
                <img 
                  src="https://images.pexels.com/photos/7070/space-desk-workspace-coworking.jpg" 
                  alt="Workbru App Screenshot" 
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>
            
            {/* Floating stat cards */}
            <div className="hidden md:block absolute -bottom-6 -left-6 bg-white/10 backdrop-blur-sm dark:bg-dark-card/90 rounded-lg shadow-xl p-4 transform rotate-3">
              <div className="flex items-center">
                <div className="bg-purple-900/50 p-3 rounded-full">
                  <MapPin className="h-6 w-6 text-purple-300" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-300">Available Spaces</p>
                  <p className="text-xl font-bold text-white">3,500+</p>
                </div>
              </div>
            </div>
            
            <div className="hidden md:block absolute -top-6 -right-6 bg-white/10 backdrop-blur-sm dark:bg-dark-card/90 rounded-lg shadow-xl p-4 transform -rotate-2">
              <div className="flex items-center">
                <div className="bg-primary-900/50 p-3 rounded-full">
                  <Users className="h-6 w-6 text-primary-300" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-gray-300">Happy Users</p>
                  <p className="text-xl font-bold text-white">10,000+</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Features Section */}
      <section ref={featuresRef} className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              Everything You Need to <span className="text-primary-600 dark:text-primary-400">Stay Productive</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Filter workspaces by the amenities that matter most to you
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="feature-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Wifi className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Fast WiFi</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find places with reliable internet connections for video calls and serious work sessions.
              </p>
            </div>
            
            <div className="feature-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Power className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Power Outlets</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Never worry about your battery dying with spaces that have plenty of accessible outlets.
              </p>
            </div>
            
            <div className="feature-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Coffee className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Quality Coffee</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Filter for spaces with excellent coffee to keep you fueled throughout your workday.
              </p>
            </div>
            
            <div className="feature-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Users className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Meeting Rooms</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find spaces with private meeting rooms for team collaboration or client meetings.
              </p>
            </div>
            
            <div className="feature-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <Clock className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Open Late</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Discover spaces with extended hours for when inspiration strikes late in the day.
              </p>
            </div>
            
            <div className="feature-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
              <div className="bg-primary-100 dark:bg-primary-900/30 w-14 h-14 rounded-full flex items-center justify-center mb-6">
                <MapPin className="h-7 w-7 text-primary-600 dark:text-primary-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3">Convenient Locations</h3>
              <p className="text-gray-600 dark:text-gray-400">
                Find workspaces near you with our map view and detailed location information.
              </p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials Section */}
      <section ref={testimonialsRef} className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-100 dark:bg-dark-card/30">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              What Our Users <span className="text-primary-600 dark:text-primary-400">Are Saying</span>
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Join thousands of freelancers and remote workers who use Workbru to find their perfect workspace
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="testimonial-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl">
                  S
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Sarah Johnson</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Freelance Designer</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "Workbru has completely changed how I find places to work. I love being able to filter for spaces with fast WiFi and plenty of outlets. It's saved me from so many frustrating work sessions!"
              </p>
              <div className="mt-4 flex text-yellow-400">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
            
            <div className="testimonial-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl">
                  M
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Michael Chen</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Software Developer</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "As someone who works remotely full-time, finding good workspaces is essential. Workbru makes it so easy to discover new coffee shops and coworking spaces wherever I travel."
              </p>
              <div className="mt-4 flex text-yellow-400">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
            
            <div className="testimonial-card bg-white dark:bg-dark-card rounded-xl p-6 shadow-lg">
              <div className="flex items-center mb-4">
                <div className="h-12 w-12 rounded-full bg-primary-100 dark:bg-primary-900/30 flex items-center justify-center text-primary-600 dark:text-primary-400 font-bold text-xl">
                  J
                </div>
                <div className="ml-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white">Jessica Patel</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Marketing Consultant</p>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-300">
                "I love that I can find quiet spaces with meeting rooms for client meetings. The detailed amenity information helps me choose the perfect spot for whatever I'm working on that day."
              </p>
              <div className="mt-4 flex text-yellow-400">
                <span>★</span><span>★</span><span>★</span><span>★</span><span>★</span>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-primary-600 dark:bg-primary-900">
        <div className="container mx-auto">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">
              Ready to Find Your Perfect Workspace?
            </h2>
            <p className="text-xl text-primary-100 mb-10 max-w-2xl mx-auto">
              Join thousands of remote workers, freelancers, and digital nomads who use Workbru to stay productive.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/register" 
                className="px-8 py-3 bg-white text-primary-600 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-medium"
              >
                Sign Up For Free
              </Link>
              <Link 
                to="/app" 
                className="px-8 py-3 bg-primary-700 text-white rounded-lg shadow-lg hover:bg-primary-800 transition-all duration-300 transform hover:-translate-y-1 font-medium"
              >
                Browse Spaces
              </Link>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default LandingPage;