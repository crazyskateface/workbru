import React, { useState } from 'react';
import { 
  Plus, Search, Filter, Trash2, Edit, Eye, Coffee, Wifi, Power, Users, Clock, CheckCircle, XCircle, MapPin
} from 'lucide-react';
import { fetchNearbyWorkspaces } from '../../lib/googlePlaces';
import { Workspace } from '../../types';
import { supabase } from '../../lib/supabase';

const AdminWorkspaces: React.FC = () => {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  // Fetch places form state
  const [city, setCity] = useState('');
  const [radius, setRadius] = useState('5');
  const [fetchingPlaces, setFetchingPlaces] = useState(false);
  const [fetchStatus, setFetchStatus] = useState<{ success?: string; error?: string } | null>(null);

  React.useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('workspaces')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setWorkspaces(data || []);
      } catch (error) {
        console.error('Error fetching workspaces:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadWorkspaces();
  }, []);

  const handleFetchPlaces = async () => {
    if (!city.trim()) {
      setFetchStatus({ error: 'Please enter a city name' });
      return;
    }

    try {
      setFetchingPlaces(true);
      setFetchStatus(null);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-places`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ city: city.trim(), radius: parseInt(radius) })
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch places: ${response.statusText}`);
      }

      const data = await response.json();

      setFetchStatus({ success: data.message });
      
      // Refresh the workspaces list
      const { data: newWorkspaces } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      setWorkspaces(newWorkspaces || []);
    } catch (error) {
      console.error('Error fetching places:', error);
      setFetchStatus({ error: error.message });
    } finally {
      setFetchingPlaces(false);
    }
  };
  
  const filteredWorkspaces = workspaces.filter((workspace) => {
    if (searchQuery && !workspace.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });
  
  const handleDeleteClick = (workspace: Workspace) => {
    setSelectedWorkspace(workspace);
    setIsDeleteModalOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (selectedWorkspace?.id) {
      try {
        const { error } = await supabase
          .from('workspaces')
          .delete()
          .eq('id', selectedWorkspace.id);

        if (error) throw error;

        setWorkspaces(workspaces.filter(w => w.id !== selectedWorkspace.id));
        setIsDeleteModalOpen(false);
        setSelectedWorkspace(null);
      } catch (error) {
        console.error('Error deleting workspace:', error);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Manage Workspaces</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Add, edit, or remove workspaces from the platform
          </p>
        </div>
        
        <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200">
          <Plus className="h-5 w-5 mr-2" />
          Add Workspace
        </button>
      </div>

      {/* Fetch Places Section */}
      <div className="mb-8 bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Import Places</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              City
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Enter city name"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Radius (km)
            </label>
            <input
              type="number"
              value={radius}
              onChange={(e) => setRadius(e.target.value)}
              min="1"
              max="50"
              className="w-full px-3 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
          </div>
        </div>

        <div className="flex items-center">
          <button
            onClick={handleFetchPlaces}
            disabled={fetchingPlaces}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
          >
            {fetchingPlaces ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                Importing...
              </>
            ) : (
              <>
                <MapPin className="h-5 w-5 mr-2" />
                Import Places
              </>
            )}
          </button>

          {fetchStatus && (
            <div className={`ml-4 ${fetchStatus.error ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
              {fetchStatus.error || fetchStatus.success}
            </div>
          )}
        </div>
      </div>
      
      {/* Search and filters */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <input
              type="text"
              placeholder="Search workspaces..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white dark:bg-dark-input border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors duration-200"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
          
          <button 
            onClick={() => setShowFilters(!showFilters)}
            className="inline-flex items-center px-4 py-2 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg hover:bg-gray-50 dark:hover:bg-dark-input transition-colors duration-200"
          >
            <Filter className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-400" />
            <span className="text-gray-700 dark:text-gray-300">Filters</span>
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-4 p-4 bg-white dark:bg-dark-card border border-gray-200 dark:border-dark-border rounded-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amenities
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">WiFi</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Coffee</span>
                  </label>
                  <label className="flex items-center">
                    <input type="checkbox" className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded" />
                    <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">Power Outlets</span>
                  </label>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <select className="w-full px-3 py-2 bg-white dark:bg-dark-input border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors duration-200">
                  <option>All</option>
                  <option>Public</option>
                  <option>Private</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Rating
                </label>
                <select className="w-full px-3 py-2 bg-white dark:bg-dark-input border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors duration-200">
                  <option>Any</option>
                  <option>4+ Stars</option>
                  <option>3+ Stars</option>
                  <option>2+ Stars</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sort By
                </label>
                <select className="w-full px-3 py-2 bg-white dark:bg-dark-input border border-gray-200 dark:border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:text-white transition-colors duration-200">
                  <option>Name (A-Z)</option>
                  <option>Name (Z-A)</option>
                  <option>Rating (High to Low)</option>
                  <option>Rating (Low to High)</option>
                  <option>Date Added (Newest)</option>
                  <option>Date Added (Oldest)</option>
                </select>
              </div>
            </div>
            
            <div className="mt-4 flex justify-end">
              <button className="mr-3 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors duration-200">
                Clear Filters
              </button>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200">
                Apply Filters
              </button>
            </div>
          </div>
        )}
      </div>
      
      {/* Workspaces table */}
      <div className="bg-white dark:bg-dark-card rounded-xl shadow-md overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Loading workspaces...</p>
            </div>
          </div>
        ) : filteredWorkspaces.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No workspaces found</p>
            <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200">
              <Plus className="h-5 w-5 mr-2" />
              Add Workspace
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-border">
              <thead className="bg-gray-50 dark:bg-dark-input">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Address
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rating
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amenities
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-dark-card divide-y divide-gray-200 dark:divide-dark-border">
                {filteredWorkspaces.map((workspace) => (
                  <tr key={workspace.id} className="hover:bg-gray-50 dark:hover:bg-dark-input transition-colors duration-150">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0">
                          {workspace.photos && workspace.photos.length > 0 ? (
                            <img className="h-10 w-10 rounded-full object-cover\" src={workspace.photos[0]} alt={workspace.name} />
                          ) : (
                            <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-dark-input flex items-center justify-center">
                              <Coffee className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                            </div>
                          )}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 dark:text-white">{workspace.name}</div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">ID: {workspace.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900 dark:text-white">{workspace.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {workspace.attributes.rating ? (
                          <>
                            <span className="text-sm text-gray-900 dark:text-white mr-1">{workspace.attributes.rating.toFixed(1)}</span>
                            <span className="text-yellow-400">★</span>
                          </>
                        ) : (
                          <span className="text-sm text-gray-500 dark:text-gray-400">No rating</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        {workspace.amenities.wifi && <Wifi className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                        {workspace.amenities.coffee && <Coffee className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                        {workspace.amenities.outlets && <Power className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                        {workspace.amenities.meetingRooms && <Users className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                        {workspace.attributes.openLate && <Clock className="h-5 w-5 text-primary-600 dark:text-primary-400" />}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        workspace.isPublic 
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' 
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {workspace.isPublic ? 'Public' : 'Private'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300">
                          <Eye className="h-5 w-5" />
                        </button>
                        <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300">
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDeleteClick(workspace)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination */}
        <div className="bg-white dark:bg-dark-card px-4 py-3 flex items-center justify-between border-t border-gray-200 dark:border-dark-border sm:px-6">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                Showing <span className="font-medium">1</span> to <span className="font-medium">{filteredWorkspaces.length}</span> of{' '}
                <span className="font-medium">{filteredWorkspaces.length}</span> results
              </p>
            </div>
            <div>
              <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px" aria-label="Pagination">
                <a
                  href="#"
                  className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-input"
                >
                  <span className="sr-only">Previous</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
                <a
                  href="#"
                  className="relative inline-flex items-center px-4 py-2 border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-input"
                >
                  1
                </a>
                <a
                  href="#"
                  className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 dark:border-dark-border bg-white dark:bg-dark-card text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-dark-input"
                >
                  <span className="sr-only">Next</span>
                  <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </a>
              </nav>
            </div>
          </div>
        </div>
      </div>
      
      {/* Delete confirmation modal */}
      {isDeleteModalOpen && selectedWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Confirm Deletion</h3>
            <p className="text-gray-700 dark:text-gray-300 mb-6">
              Are you sure you want to delete <span className="font-semibold">{selectedWorkspace.name}</span>? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="px-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-input transition-colors duration-200"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminWorkspaces;