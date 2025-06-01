import React, { useState, useEffect } from 'react';
import { MapPin, AlertCircle, Check, X, Loader2, DollarSign, Clock, FileSpreadsheet, RefreshCw } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Workspace } from '../../types';

interface ImportSession {
  id: string;
  city: string;
  processed_count: number;
  completed_types: string[];
  next_page_tokens: Record<string, string>;
  last_processed_at: string;
  status: 'in_progress' | 'completed' | 'failed';
}

interface ImportProgress {
  processed: number;
  total: number;
  percentage: number;
  currentType: string;
  costEstimate?: {
    searchCost: number;
    detailsCost: number;
    total: number;
  };
}

function ImportWorkspaces() {
  const [city, setCity] = useState('');
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [sessions, setSessions] = useState<ImportSession[]>([]);
  const [recentWorkspaces, setRecentWorkspaces] = useState<Workspace[]>([]);

  useEffect(() => {
    loadImportSessions();
    loadRecentWorkspaces();
  }, []);

  const loadImportSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('import_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error('Error loading import sessions:', error);
    }
  };

  const loadRecentWorkspaces = async () => {
    try {
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(6);

      if (error) throw error;
      setRecentWorkspaces(data || []);
    } catch (error) {
      console.error('Error loading recent workspaces:', error);
    }
  };

  const handleImport = async () => {
    if (!city.trim()) {
      setError('Please enter a city name');
      return;
    }

    try {
      setImporting(true);
      setError(null);
      setSuccess(null);

      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('You must be logged in to import places');
      }

      const response = await fetch('/api/fetch-places', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ city: city.trim() })
      });

      if (!response.ok) {
        throw new Error(`Failed to import places: ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setSuccess(data.message);
      await Promise.all([
        loadImportSessions(),
        loadRecentWorkspaces()
      ]);
      
      if (data.session) {
        setProgress({
          processed: data.session.processed,
          total: data.session.totalProcessed,
          percentage: data.session.progress.percentage,
          currentType: data.session.currentType,
          costEstimate: data.session.costEstimate
        });
      }
    } catch (error) {
      console.error('Error importing places:', error);
      setError(error.message);
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Import Workspaces</h1>
        <p className="mt-1 text-gray-600 dark:text-gray-400">
          Import workspaces from Google Places API for a specific city
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Import Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
            <div className="max-w-xl">
              <div className="mb-4">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    id="city"
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="Enter city name"
                    className="pl-10 pr-4 py-2 w-full border border-gray-300 dark:border-dark-border rounded-lg bg-white dark:bg-dark-input text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>

              {error && (
                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-lg flex items-start">
                  <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}

              {success && (
                <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-lg flex items-start">
                  <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                  <p>{success}</p>
                </div>
              )}

              {progress && (
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      Importing {progress.currentType}...
                    </span>
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      {progress.percentage}%
                    </span>
                  </div>
                  <div className="w-full h-2 bg-gray-200 dark:bg-dark-border rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary-600 rounded-full transition-all duration-300"
                      style={{ width: `${progress.percentage}%` }}
                    ></div>
                  </div>
                  <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                    {progress.processed} of {progress.total} places processed
                  </div>
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={importing}
                className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                    Importing...
                  </>
                ) : (
                  <>
                    <MapPin className="h-5 w-5 mr-2" />
                    Import Places
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Cost Estimate Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Cost Estimate</h2>
            {progress?.costEstimate ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Place Search</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${progress.costEstimate.searchCost.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Place Details</span>
                  <span className="font-medium text-gray-900 dark:text-white">
                    ${progress.costEstimate.detailsCost.toFixed(2)}
                  </span>
                </div>
                <div className="pt-4 border-t border-gray-200 dark:border-dark-border">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-gray-900 dark:text-white">Total Cost</span>
                    <span className="text-lg font-bold text-primary-600 dark:text-primary-400">
                      ${progress.costEstimate.total.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-gray-600 dark:text-gray-400 text-sm">
                Cost estimates will appear here when you start importing places.
              </div>
            )}

            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Cost-Saving Tips</h3>
              <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Start with a specific neighborhood instead of an entire city
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Use filters to focus on high-quality workspaces
                </li>
                <li className="flex items-start">
                  <Check className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
                  Import during off-peak hours for better performance
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Imports Grid */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recently Imported</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {recentWorkspaces.map((workspace) => (
            <div key={workspace.id} className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
              <div className="aspect-video relative">
                {workspace.photos && workspace.photos[0] ? (
                  <img
                    src={workspace.photos[0]}
                    alt={workspace.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 dark:bg-dark-hover flex items-center justify-center">
                    <MapPin className="h-8 w-8 text-gray-400" />
                  </div>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-medium text-gray-900 dark:text-white">{workspace.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{workspace.address}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Import History */}
      <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Import History</h2>
          <button
            onClick={loadImportSessions}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-dark-hover transition-colors duration-200"
          >
            <RefreshCw className="h-5 w-5" />
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-dark-card-hover">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">City</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Processed</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Last Updated</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-dark-border">
              {sessions.map((session) => (
                <tr key={session.id} className="hover:bg-gray-50 dark:hover:bg-dark-input">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{session.city}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      session.status === 'completed'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                        : session.status === 'failed'
                        ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
                    }`}>
                      {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-white">{session.processed_count} places</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(session.last_processed_at).toLocaleString()}
                    </div>
                  </td>
                </tr>
              ))}
              {sessions.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                    No import sessions found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default ImportWorkspaces;