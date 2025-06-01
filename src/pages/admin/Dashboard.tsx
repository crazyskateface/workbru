import React, { useEffect } from 'react';
import { Coffee, Users, Star, Map, Zap, TrendingUp, BarChart } from 'lucide-react';
import anime from 'animejs';

const AdminDashboard: React.FC = () => {
  useEffect(() => {
    // Animate dashboard cards on mount
    anime({
      targets: '.dashboard-card',
      translateY: [20, 0],
      opacity: [0, 1],
      easing: 'easeOutExpo',
      duration: 800,
      delay: anime.stagger(100)
    });
  }, []);
  
  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Admin Dashboard</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-1">
          Overview of your Workbru workspace statistics and management
        </p>
      </div>
      
      {/* Stats cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="dashboard-card bg-white dark:bg-dark-card rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-primary-100 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400">
              <Coffee className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Workspaces</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">348</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-500">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">12% increase</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="dashboard-card bg-white dark:bg-dark-card rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
              <Users className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Registered Users</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">12,456</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-500">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">8% increase</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="dashboard-card bg-white dark:bg-dark-card rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
              <Star className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Average Rating</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">4.7</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-500">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">0.2 increase</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">from last month</span>
          </div>
        </div>
        
        <div className="dashboard-card bg-white dark:bg-dark-card rounded-xl shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
              <Map className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Cities Covered</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-white">86</p>
            </div>
          </div>
          <div className="mt-4 flex items-center text-green-500">
            <TrendingUp className="h-4 w-4 mr-1" />
            <span className="text-xs font-medium">4 new</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">this month</span>
          </div>
        </div>
      </div>
      
      {/* Activity and charts section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent activity */}
        <div className="dashboard-card lg:col-span-1 bg-white dark:bg-dark-card rounded-xl shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                <Zap className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">New workspace added</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">The Productive Space, San Francisco</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">10 minutes ago</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                <Users className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">New user registered</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">sarah.johnson@example.com</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">1 hour ago</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400">
                <Star className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">New review submitted</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Urban Brew, 5 stars</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">3 hours ago</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400">
                <Coffee className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">Workspace updated</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Library Lounge, new amenities added</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">1 day ago</p>
              </div>
            </div>
            
            <div className="flex items-start">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                <Users className="h-5 w-5" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900 dark:text-white">User deleted</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">john.smith@example.com</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">2 days ago</p>
              </div>
            </div>
          </div>
          
          <button className="mt-6 w-full py-2 bg-gray-100 dark:bg-dark-input hover:bg-gray-200 dark:hover:bg-dark-border text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition-colors duration-200">
            View All Activity
          </button>
        </div>
        
        {/* Charts section */}
        <div className="dashboard-card lg:col-span-2 bg-white dark:bg-dark-card rounded-xl shadow-md p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Overview</h2>
            <div className="flex items-center space-x-2">
              <button className="px-3 py-1 text-sm bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-md">
                Monthly
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-input rounded-md">
                Weekly
              </button>
              <button className="px-3 py-1 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-input rounded-md">
                Daily
              </button>
            </div>
          </div>
          
          {/* Simplified chart visualization */}
          <div className="h-64 flex items-end justify-between px-2">
            {[40, 55, 45, 60, 75, 65, 80, 70, 60, 90, 85, 95].map((height, index) => (
              <div key={index} className="w-full max-w-[18px] mx-1">
                <div 
                  className="bg-primary-500 dark:bg-primary-600 rounded-t-sm hover:bg-primary-600 dark:hover:bg-primary-500 transition-all duration-200"
                  style={{ height: `${height}%` }}
                ></div>
                <div className="text-xs text-center text-gray-500 dark:text-gray-400 mt-1">
                  {index === 0 ? 'Jan' : 
                   index === 1 ? 'Feb' : 
                   index === 2 ? 'Mar' : 
                   index === 3 ? 'Apr' : 
                   index === 4 ? 'May' : 
                   index === 5 ? 'Jun' : 
                   index === 6 ? 'Jul' : 
                   index === 7 ? 'Aug' : 
                   index === 8 ? 'Sep' : 
                   index === 9 ? 'Oct' : 
                   index === 10 ? 'Nov' : 'Dec'}
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-gray-50 dark:bg-dark-input rounded-lg p-4">
              <div className="flex items-center">
                <BarChart className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Most Popular Amenity</h3>
              </div>
              <div className="mt-2">
                <div className="flex items-center mb-1">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">WiFi</span>
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">92%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                  <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-dark-input rounded-lg p-4">
              <div className="flex items-center">
                <BarChart className="h-5 w-5 text-primary-600 dark:text-primary-400 mr-2" />
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Most Active City</h3>
              </div>
              <div className="mt-2">
                <div className="flex items-center mb-1">
                  <span className="text-lg font-semibold text-gray-900 dark:text-white">San Francisco</span>
                  <span className="ml-auto text-sm text-gray-500 dark:text-gray-400">143 spaces</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-dark-border rounded-full h-2">
                  <div className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;