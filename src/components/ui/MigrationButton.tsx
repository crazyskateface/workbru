import React, { useState } from 'react';
import { Database, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const MigrationButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const runMigration = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      const { data, error } = await supabase.rpc('run_migrations');

      if (error) throw error;

      setSuccess('Migration completed successfully!');
      setTimeout(() => setSuccess(null), 5000);
    } catch (err: any) {
      setError(err.message || 'Failed to run migration');
      setTimeout(() => setError(null), 5000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={runMigration}
        disabled={loading}
        className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Running Migration...
          </>
        ) : (
          <>
            <Database className="h-5 w-5 mr-2" />
            Run Migration
          </>
        )}
      </button>

      {error && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400 text-sm rounded-lg whitespace-nowrap">
          {error}
        </div>
      )}

      {success && (
        <div className="absolute top-full left-0 mt-2 p-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 text-sm rounded-lg whitespace-nowrap">
          {success}
        </div>
      )}
    </div>
  );
};

export default MigrationButton;