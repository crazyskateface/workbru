import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Coffee, Power, Users, Clock, Search, List, MapIcon, Filter, Star, MapPin, ChevronRight, Crosshair, AlertCircle } from 'lucide-react';
import GoogleMapReact from 'google-map-react';
import { getNearbyWorkspaces } from '../lib/workspaces';
import { Workspace, FilterOptions, MapPosition } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';

// ... (previous code remains the same until loadWorkspaces function)

const loadWorkspaces = useCallback(async (lat: number, lng: number, force: boolean = false) => {
  if (loadingRef.current) return;
  
  try {
    loadingRef.current = true;
    setLoading(true);
    setMapError(null); // Clear any previous errors
    
    const spaces = await getNearbyWorkspaces(lat, lng, 5, force);
    setWorkspaces(spaces);
    
    // Show a message if no workspaces found
    if (spaces.length === 0) {
      setMapError('No workspaces found in this area. Try searching in a different location or adjusting your filters.');
    }
    
    trackEvent('load_workspaces', {
      latitude: lat,
      longitude: lng,
      count: spaces.length
    });
  } catch (error) {
    console.error('Error fetching workspaces:', error);
    setMapError('Failed to load workspaces. Please try again.');
  } finally {
    setLoading(false);
    loadingRef.current = false;
  }
}, [trackEvent]);

// ... (rest of the code remains the same until the return statement)

return (
  <div className="h-screen flex flex-col relative">
    {/* ... (previous code remains the same) ... */}
    
    {view === 'map' ? (
      <div className="flex-1 relative">
        {loading && (
          <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
            <div className="bg-white dark:bg-dark-card rounded-lg p-4 shadow-lg">
              <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          </div>
        )}
        {mapError ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-100 dark:bg-dark-input">
            <AlertCircle className="h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-center max-w-md px-4">{mapError}</p>
            {userLocation && (
              <button
                onClick={handleGoToUserLocation}
                className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
              >
                <Crosshair className="h-5 w-5" />
                Try near my location
              </button>
            )}
          </div>
        ) : (
          <div className="absolute inset-0">
            {renderMap()}
          </div>
        )}
      </div>
    ) : (
      <div className="flex-1 overflow-auto">
        <div className="container mx-auto py-6 px-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
            </div>
          ) : workspaces.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="h-12 w-12 text-primary-600 dark:text-primary-400 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center max-w-md">
                No workspaces found in this area. Try searching in a different location or adjusting your filters.
              </p>
              {userLocation && (
                <button
                  onClick={handleGoToUserLocation}
                  className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2"
                >
                  <Crosshair className="h-5 w-5" />
                  Try near my location
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* ... (existing workspace cards code) ... */}
            </div>
          )}
        </div>
      </div>
    )}
  </div>
);

// ... (rest of the code remains the same)

export default loadWorkspaces