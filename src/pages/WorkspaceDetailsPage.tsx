import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { MapPin, Wifi, Coffee, Power, Users, Clock, ChevronLeft, Star, Calendar, Clock8, MapIcon, Share2, Bookmark, BookmarkCheck } from 'lucide-react';
import GoogleMapReact from 'google-map-react';
import { getWorkspaceById } from '../lib/workspaces';
import { Workspace } from '../types';
import { useAnalytics } from '../hooks/useAnalytics';

interface MarkerProps {
  lat: number;
  lng: number;
  isCoffeeShop?: boolean;
}

const Marker: React.FC<MarkerProps> = ({ isCoffeeShop }) => (
  <div className="absolute -translate-x-1/2 -translate-y-full">
    {isCoffeeShop ? (
      <img 
        src="/marker-coffee.png" 
        alt="Coffee Shop"
        className="w-10 h-12"
      />
    ) : (
      <>
        <div className="flex items-center justify-center w-10 h-10 bg-primary-600 dark:bg-primary-500 rounded-full shadow-lg">
          <MapPin className="h-6 w-6 text-white" />
        </div>
        <div className="w-4 h-4 bg-primary-600 dark:bg-primary-500 rotate-45 absolute -bottom-1 left-1/2 -translate-x-1/2" />
      </>
    )}
  </div>
);

const WorkspaceDetailsPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(true);
  const { trackEvent } = useAnalytics();

  useEffect(() => {
    const loadWorkspace = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await getWorkspaceById(id);
        
        // Parse location from GeoJSON format
        if (data.location && typeof data.location === 'object') {
          const locationObj = JSON.parse(JSON.stringify(data.location));
          if (locationObj.coordinates) {
            data.location = {
              longitude: locationObj.coordinates[0],
              latitude: locationObj.coordinates[1]
            };
          }
        }
        
        setWorkspace(data);
        
        trackEvent('view_workspace', {
          workspace_id: id,
          workspace_name: data.name
        });
      } catch (error) {
        console.error('Error loading workspace:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWorkspace();
  }, [id, trackEvent]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!workspace) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg flex items-center justify-center">
        <p className="text-gray-600 dark:text-gray-400">Workspace not found</p>
      </div>
    );
  }

  // Validate location coordinates before rendering the map
  const hasValidLocation = workspace.location && 
    typeof workspace.location.latitude === 'number' && 
    typeof workspace.location.longitude === 'number' && 
    !isNaN(workspace.location.latitude) && 
    !isNaN(workspace.location.longitude);

  if (!hasValidLocation) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <Link to="/app" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
              <ChevronLeft className="w-5 h-5 mr-2" />
              Back to Search
            </Link>
          </div>
          <div className="bg-white dark:bg-dark-card rounded-lg shadow-md p-6">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{workspace.name}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Location information unavailable</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-dark-bg">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/app" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white">
            <ChevronLeft className="w-5 h-5 mr-2" />
            Back to Search
          </Link>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md">
              <div className="relative h-64 rounded-t-lg overflow-hidden">
                <img 
                  src={workspace.photos?.[0] || 'https://images.pexels.com/photos/1181671/pexels-photo-1181671.jpeg'} 
                  alt={workspace.name}
                  className="w-full h-full object-cover"
                />
                {workspace.attributes.rating && (
                  <div className="absolute top-4 right-4 bg-white dark:bg-dark-card rounded-full px-3 py-1.5 flex items-center shadow-lg">
                    <Star className="h-5 w-5 text-yellow-400 mr-1.5" />
                    <span className="text-lg font-semibold">{workspace.attributes.rating}</span>
                  </div>
                )}
              </div>
              
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{workspace.name}</h1>
                    <p className="text-gray-600 dark:text-gray-400 mt-2">{workspace.address}</p>
                  </div>
                  <div className="flex space-x-2">
                    <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-dark-input">
                      <Share2 className="h-6 w-6" />
                    </button>
                    <button 
                      onClick={() => setIsBookmarked(!isBookmarked)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white rounded-full hover:bg-gray-100 dark:hover:bg-dark-input"
                    >
                      {isBookmarked ? <BookmarkCheck className="h-6 w-6" /> : <Bookmark className="h-6 w-6" />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-dark-card rounded-lg shadow-md overflow-hidden">
              <div className="h-[400px] relative">
                <GoogleMapReact
                  bootstrapURLKeys={{ key: import.meta.env.VITE_GOOGLE_MAPS_API_KEY }}
                  defaultCenter={{
                    lat: workspace.location.latitude,
                    lng: workspace.location.longitude
                  }}
                  defaultZoom={15}
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
                  <Marker
                    lat={workspace.location.latitude}
                    lng={workspace.location.longitude}
                    isCoffeeShop={workspace.amenities.coffee}
                  />
                </GoogleMapReact>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WorkspaceDetailsPage;