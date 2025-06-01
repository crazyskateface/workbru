import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Wifi, Coffee, Power, Users, Clock, Search, List, MapIcon, Filter, Star, MapPin, ChevronRight, Crosshair, AlertCircle, Target } from 'lucide-react';
import GoogleMapReact from 'google-map-react';
import { getNearbyWorkspaces } from '../lib/workspaces';
import { Workspace, FilterOptions, MapPosition } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';
import Marker from '../components/map/Marker';

const SearchButton: React.FC<{ onClick: () => void, loading: boolean }> = ({ onClick, loading }) => (
  <button
    onClick={onClick}
    disabled={loading}
    className="absolute top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 bg-primary-600 text-white rounded-full shadow-lg hover:bg-primary-700 transition-colors duration-200 flex items-center gap-2 z-10"
  >
    {loading ? (
      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
    ) : (
      <Target className="h-4 w-4" />
    )}
    Search this area
  </button>
);

const HomePage: React.FC = () => {
  const [view, setView] = useState<'list' | 'map'>('map');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [selectedWorkspace, setSelectedWorkspace] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<MapPosition | null>(null);
  const [mapCenter, setMapCenter] = useState<MapPosition>({
    center: {
      lat: 40.7128,
      lng: -74.0060
    },
    zoom: 13
  });
  const [showSearchButton, setShowSearchButton] = useState(false);
  const [filters, setFilters] = useState<FilterOptions>({
    wifi: false,
    coffee: false,
    power: false,
    seating: false,
    meetingRooms: false
  });
  const [initialLocationSet, setInitialLocationSet] = useState(false);
  
  const loadingRef = useRef(false);
  const mapInstanceRef = useRef<any>(null);
  const mapsRef = useRef<any>(null);
  const { trackEvent } = useAnalytics();

  const loadWorkspaces = useCallback(async (lat: number, lng: number, force: boolean = false) => {
    if (loadingRef.current && !force) return;
    
    try {
      loadingRef.current = true;
      setLoading(true);
      setMapError(null);
      setShowSearchButton(false);
      
      const spaces = await getNearbyWorkspaces(lat, lng, 160, force);
      setWorkspaces(spaces);
      
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

  const handleMapChange = useCallback(({ center, bounds, zoom }: any) => {
    if (initialLocationSet) {
      setMapCenter({ center, zoom });
      setShowSearchButton(true);
    }
  }, [initialLocationSet]);

  const handleSearchArea = useCallback(() => {
    if (mapCenter.center) {
      loadWorkspaces(mapCenter.center.lat, mapCenter.center.lng, true);
    }
  }, [mapCenter, loadWorkspaces]);

  const handleMarkerClick = useCallback((workspaceId: string) => {
    setSelectedWorkspace(workspaceId);
    
    const workspace = workspaces.find(w => w.id === workspaceId);
    if (workspace && mapInstanceRef.current && mapsRef.current) {
      // Calculate the pixel coordinates of the marker
      const markerPos = new mapsRef.current.LatLng(
        workspace.location.latitude,
        workspace.location.longitude
      );
      
      // Get the map's current bounds
      const bounds = mapInstanceRef.current.getBounds();
      const ne = bounds.getNorthEast();
      const sw = bounds.getSouthWest();
      
      // Calculate the vertical center point about 1/3 from the bottom of the viewport
      const targetLat = sw.lat() + ((ne.lat() - sw.lat()) * 0.4);
      
      // Create the new center point
      const newCenter = new mapsRef.current.LatLng(
        targetLat,
        workspace.location.longitude
      );
      
      // Smoothly pan to the new position
      mapInstanceRef.current.panTo(newCenter);
      mapInstanceRef.current.setZoom(16);
    }
    
    trackEvent('select_workspace', { workspace_id: workspaceId });
  }, [workspaces, trackEvent]);

  const handleGoToUserLocation = useCallback(() => {
    if (userLocation) {
      setMapCenter({
        center: { lat: userLocation.lat, lng: userLocation.lng },
        zoom: 13
      });
      loadWorkspaces(userLocation.lat, userLocation.lng, true);
    }
  }, [userLocation, loadWorkspaces]);

  useEffect(() => {
    if (!initialLocationSet && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            lat: position.coords.latitude,
            lng: position.coords.longitude
          };
          setUserLocation(location);
          setMapCenter({
            center: location,
            zoom: 13
          });
          loadWorkspaces(location.lat, location.lng);
          setInitialLocationSet(true);
        },
        (error) => {
          console.error('Error getting location:', error);
          loadWorkspaces(mapCenter.center.lat, mapCenter.center.lng);
          setInitialLocationSet(true);
        }
      );
    } else if (!initialLocationSet) {
      loadWorkspaces(mapCenter.center.lat, mapCenter.center.lng);
      setInitialLocationSet(true);
    }
  }, [loadWorkspaces, initialLocationSet, mapCenter.center.lat, mapCenter.center.lng]);

  const handleApiLoaded = ({ map, maps }: { map: any; maps: any }) => {
    mapInstanceRef.current = map;
    mapsRef.current = maps;
  };

  const renderMap = () => (
    <GoogleMapReact
      bootstrapURLKeys={{ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY }}
      center={mapCenter.center}
      zoom={mapCenter.zoom}
      onChange={handleMapChange}
      yesIWantToUseGoogleMapApiInternals
      onGoogleApiLoaded={handleApiLoaded}
      options={{
        fullscreenControl: false,
        zoomControl: true,
        clickableIcons: false,
        styles: [
          {
            featureType: 'poi',
            elementType: 'labels',
            stylers: [{ visibility: 'off' }]
          }
        ]
      }}
    >
      {workspaces.map((workspace) => (
        <Marker
          key={workspace.id}
          lat={workspace.location.latitude}
          lng={workspace.location.longitude}
          workspace={workspace}
          isSelected={workspace.id === selectedWorkspace}
          onClick={() => handleMarkerClick(workspace.id!)}
        />
      ))}
    </GoogleMapReact>
  );

  return (
    <div className="h-screen flex flex-col relative">
      <div className="bg-white dark:bg-dark-card shadow-sm z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search workspaces..."
                className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 dark:border-dark-border focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-dark-input dark:text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('list')}
                className={`p-2 rounded-lg ${view === 'list' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover'}`}
              >
                <List className="h-5 w-5" />
              </button>
              <button
                onClick={() => setView('map')}
                className={`p-2 rounded-lg ${view === 'map' ? 'bg-primary-100 text-primary-600 dark:bg-primary-900 dark:text-primary-400' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover'}`}
              >
                <MapIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => {/* Toggle filters */}}
                className="p-2 rounded-lg text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-dark-hover"
              >
                <Filter className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {view === 'map' ? (
        <div className="flex-1 relative">
          <div className="absolute inset-0">
            {renderMap()}
            {showSearchButton && !loading && (
              <SearchButton onClick={handleSearchArea} loading={loading} />
            )}
          </div>
          {loading && (
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-10 flex items-center justify-center">
              <div className="bg-white dark:bg-dark-card rounded-lg p-4 shadow-lg">
                <div className="w-8 h-8 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
              </div>
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
                {workspaces.map((workspace) => (
                  <Link
                    key={workspace.id}
                    to={`/workspace/${workspace.id}`}
                    className="bg-white dark:bg-dark-card rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                  >
                    <div className="aspect-video relative rounded-t-lg overflow-hidden">
                      {workspace.photos && workspace.photos[0] ? (
                        <img
                          src={workspace.photos[0]}
                          alt={workspace.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-dark-hover flex items-center justify-center">
                          <Coffee className="h-12 w-12 text-gray-400 dark:text-gray-600" />
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                          {workspace.name}
                        </h3>
                        {workspace.attributes.rating && (
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-400 fill-current" />
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {workspace.attributes.rating}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        {workspace.address}
                      </p>
                      <div className="mt-4 flex items-center gap-2">
                        {workspace.amenities.wifi && (
                          <span className="p-1 bg-primary-100 dark:bg-primary-900 rounded">
                            <Wifi className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </span>
                        )}
                        {workspace.amenities.coffee && (
                          <span className="p-1 bg-primary-100 dark:bg-primary-900 rounded">
                            <Coffee className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </span>
                        )}
                        {workspace.amenities.outlets && (
                          <span className="p-1 bg-primary-100 dark:bg-primary-900 rounded">
                            <Power className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </span>
                        )}
                        {workspace.amenities.seating && (
                          <span className="p-1 bg-primary-100 dark:bg-primary-900 rounded">
                            <Users className="h-4 w-4 text-primary-600 dark:text-primary-400" />
                          </span>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <Clock className="h-4 w-4" />
                          <span>{workspace.attributes.openLate ? 'Open Late' : 'Regular Hours'}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default HomePage;