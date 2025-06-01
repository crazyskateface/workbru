// Update the import form section in the Workspaces admin page
// Add this inside the component before the search and filters section
import { useState } from 'react';

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

// Add this to the imports section
const handleImport = async () => {
  if (!city.trim()) {
    setFetchStatus({ error: 'Please enter a city name' });
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

// Add this JSX in the import section
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

export default handleImport