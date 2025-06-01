import { useState } from 'react';
import { MapPin, Search, Filter, Plus, Eye, Edit, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import type { Workspace } from '../../types';

function AdminWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [city, setCity] = useState('');
  const [importStatus, setImportStatus] = useState<{
    inProgress: boolean;
    message?: string;
    error?: string;
    progress?: {
      processed: number;
      total: number;
      currentType: string;
      costEstimate: {
        searchCost: number;
        detailsCost: number;
        total: number;
      };
    };
  }>();

  const handleImport = async () => {
    if (!city.trim()) {
      setImportStatus({ inProgress: false, error: 'Please enter a city name' });
      return;
    }

    try {
      setImportStatus({ inProgress: true });
      
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/fetch-places`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({ 
          city: city.trim(),
          batchSize: 10,
          resume: false
        })
      });

      if (!response.ok) {
        throw new Error(`Failed to import places: ${response.statusText}`);
      }

      const data = await response.json();
      
      setImportStatus({
        inProgress: true,
        message: data.message,
        progress: {
          processed: data.session.processed,
          total: data.session.totalProcessed,
          currentType: data.session.currentType,
          costEstimate: data.session.costEstimate
        }
      });

      // Refresh workspace list
      const { data: newWorkspaces } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false });
      
      setWorkspaces(newWorkspaces || []);
    } catch (error) {
      console.error('Error importing places:', error);
      setImportStatus({
        inProgress: false,
        error: error.message
      });
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Workspaces</h1>
      </div>

      {/* Import Section */}
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
        </div>

        <div className="flex items-center">
          <button
            onClick={handleImport}
            disabled={importStatus?.inProgress}
            className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
          >
            {importStatus?.inProgress ? (
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

          {importStatus?.progress && (
            <div className="ml-4 flex-1">
              <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-1">
                <span>Processing {importStatus.progress.currentType}</span>
                <span>
                  {importStatus.progress.processed} / {importStatus.progress.total} places
                </span>
              </div>
              <div className="w-full h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary-600 transition-all duration-300"
                  style={{ 
                    width: `${(importStatus.progress.processed / importStatus.progress.total) * 100}%`
                  }}
                ></div>
              </div>
              <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                Estimated cost: ${importStatus.progress.costEstimate.total.toFixed(2)}
              </div>
            </div>
          )}

          {importStatus?.error && (
            <div className="ml-4 text-red-600 dark:text-red-400">
              {importStatus.error}
            </div>
          )}
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workspaces..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
          />
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="inline-flex items-center px-4 py-2 bg-white dark:bg-dark-card border border-gray-300 dark:border-dark-border rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-dark-card-hover"
        >
          <Filter className="h-5 w-5 mr-2" />
          Filters
        </button>
      </div>

      {/* Workspaces List */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
        {loading ? (
          <div className="p-6 text-center">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Loading workspaces...</p>
          </div>
        ) : workspaces.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-gray-600 dark:text-gray-400">No workspaces found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-dark-card-hover">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Address</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
                {workspaces.map((workspace) => (
                  <tr key={workspace.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">{workspace.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">{workspace.address}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {new Date(workspace.created_at).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        <Eye className="h-5 w-5" />
                      </button>
                      <button className="text-primary-600 hover:text-primary-900 mr-3">
                        <Edit className="h-5 w-5" />
                      </button>
                      <button className="text-red-600 hover:text-red-900">
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminWorkspaces;