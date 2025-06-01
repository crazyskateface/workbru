import React, { useEffect } from 'react';
import { Outlet, useLocation, Link } from 'react-router-dom';
import { ChevronRight, LayoutDashboard, Users, Coffee, LogOut, Download } from 'lucide-react';
import { signOut } from '../../lib/supabase';
import anime from 'animejs';

const AdminLayout: React.FC = () => {
  const location = useLocation();

  useEffect(() => {
    anime({
      targets: '.admin-content',
      opacity: [0, 1],
      translateX: [20, 0],
      easing: 'easeOutExpo',
      duration: 500,
      delay: 100
    });
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/login';
  };

  return (
    <div className="h-screen flex bg-gray-50 dark:bg-dark-bg transition-colors duration-300">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-dark-card shadow-md flex flex-col h-screen sticky top-0">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-400">
            Workbru <span className="text-sm font-normal">Admin</span>
          </h1>
        </div>
        
        <nav className="flex-1">
          <ul>
            <li>
              <Link 
                to="/admin" 
                className={`flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-dark-input transition-colors duration-200 ${
                  location.pathname === '/admin' ? 'bg-primary-50 dark:bg-primary-900/30 border-r-4 border-primary-500' : ''
                }`}
              >
                <LayoutDashboard className="w-5 h-5 mr-3 text-primary-600 dark:text-primary-400" />
                <span className="text-gray-800 dark:text-gray-200">Dashboard</span>
                {location.pathname === '/admin' && <ChevronRight className="w-5 h-5 ml-auto text-primary-500" />}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/workspaces" 
                className={`flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-dark-input transition-colors duration-200 ${
                  location.pathname === '/admin/workspaces' ? 'bg-primary-50 dark:bg-primary-900/30 border-r-4 border-primary-500' : ''
                }`}
              >
                <Coffee className="w-5 h-5 mr-3 text-primary-600 dark:text-primary-400" />
                <span className="text-gray-800 dark:text-gray-200">Workspaces</span>
                {location.pathname === '/admin/workspaces' && <ChevronRight className="w-5 h-5 ml-auto text-primary-500" />}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/import" 
                className={`flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-dark-input transition-colors duration-200 ${
                  location.pathname === '/admin/import' ? 'bg-primary-50 dark:bg-primary-900/30 border-r-4 border-primary-500' : ''
                }`}
              >
                <Download className="w-5 h-5 mr-3 text-primary-600 dark:text-primary-400" />
                <span className="text-gray-800 dark:text-gray-200">Import</span>
                {location.pathname === '/admin/import' && <ChevronRight className="w-5 h-5 ml-auto text-primary-500" />}
              </Link>
            </li>
            <li>
              <Link 
                to="/admin/users" 
                className={`flex items-center px-6 py-3 hover:bg-gray-100 dark:hover:bg-dark-input transition-colors duration-200 ${
                  location.pathname === '/admin/users' ? 'bg-primary-50 dark:bg-primary-900/30 border-r-4 border-primary-500' : ''
                }`}
              >
                <Users className="w-5 h-5 mr-3 text-primary-600 dark:text-primary-400" />
                <span className="text-gray-800 dark:text-gray-200">Users</span>
                {location.pathname === '/admin/users' && <ChevronRight className="w-5 h-5 ml-auto text-primary-500" />}
              </Link>
            </li>
          </ul>
        </nav>
        
        <div className="p-4 border-t border-gray-200 dark:border-dark-border mt-auto">
          <button 
            onClick={handleSignOut}
            className="w-full flex items-center justify-center px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="admin-content p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;