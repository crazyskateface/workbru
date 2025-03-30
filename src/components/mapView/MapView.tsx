import {useEffect, useState, useRef, useCallback} from 'react';
import {
    Pin, 
    AdvancedMarker, 
    APIProvider, 
    Map, 
    MapCameraChangedEvent, 
    useMap
    } from '@vis.gl/react-google-maps';
import {MarkerClusterer} from '@googlemaps/markerclusterer';
import type {Marker} from '@googlemaps/markerclusterer';
import MarkerWithInfoWindow from '../card/MarkerWithInfoWindow';
import {Place, PlaceSchema} from '../../models/place.ts';
import placeLibrary from '../../models/placeLibrary.ts';
import locations from '../../data.ts';
import {getWorkbruData} from '../../services/workbru-backend.ts'
import { useQuery } from '@tanstack/react-query'

type mapViewProps = {
    poiViewing: (space:Place) => {};
}


export default function MapView(props:mapViewProps) {
    // const workspaces = loadWorkspaceLibrary();
    const { isPending, isError, data, error } = useQuery({
        queryKey: ["placesNearby"],
        queryFn: loadWorkspaceLibrary
    })
    const mapContainerStyle = { width: '100%', height: '100%' }; // Ensure the map occupies visible space

    return (
        <APIProvider 
            apiKey={process.env.GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_MAPS_API_KEY} 
            onLoad={() => console.log('Maps API has loaded.')}
            onError={(error) => console.error('Failed to load Maps API:', error)} // Add error handling
        >
            <Map
                defaultZoom={13}
                defaultCenter={{lat: 39.2028426, lng: -84.5577283}}
                mapId='4991ba7a280d184e'
                style={mapContainerStyle} // Apply styles to the map container
                onCameraChanged={(ev: MapCameraChangedEvent) => 
                    console.log('camera changed:', ev.detail.center, 'zoom: ', ev.detail.zoom)
                }
                reuseMaps={true} // Reuse the map instance when the component unmounts
            >
                {!isPending && !isError && data != null &&
                    <PoiMarkers spaces={data.spaces} poiViewing={props.poiViewing}/>
                }
            </Map>
        </APIProvider>
    );
}

const PoiMarkers = (props: {spaces: Place[], poiViewing:(space:Place)=> {}}) => {
    const map = useMap();
    // const [markers, setMarkers] = useState<{[key: string]: Marker}>({});
    // const clusterer = useRef<MarkerClusterer | null>(null);

    // useEffect(() => {
    //     if (!map) return;
    //     if (!clusterer.current) {
    //         clusterer.current = new MarkerClusterer({map});
    //     }
    // }, [map])

    // useEffect(() => {
    //     clusterer.current?.clearMarkers();
    //     clusterer.current?.addMarkers(Object.values(markers));
    // }, [markers])
    
    // const setMarkerRef = (marker: Marker | null, key: string) => {
    //     if (marker && markers[key]) return;
    //     if (!marker && !markers[key]) return;

    //     setMarkers(prev => {
    //         if(marker) {
    //             return {...prev, [key]: marker};
    //         } else {
    //             const newMarkers = {...prev};
    //             delete newMarkers[key];
    //             return newMarkers;
    //         }
    //     });
    // };

    const handleClick = useCallback((ev: google.maps.MapMouseEvent, space:Place) => {
        
        if (!map) return;
        if (!ev.latLng) return;
        console.log('clicked:', ev.latLng.toJSON());
        
        map.panTo(ev.latLng);
        props.poiViewing(space);
    }, [map]);
    

    return (
        <>
            {props.spaces.map( (space: Place) => {
                console.log(space)
                const latLngLiteral = {lat:space.location.latitude,lng: space.location.longitude} as google.maps.LatLngLiteral
                return (
                    <MarkerWithInfoWindow 
                        key={space.id}
                        position={latLngLiteral}
                        name={space.name}
                        address={space.address}
                        handleClick={(ev:google.maps.MapMouseEvent) => handleClick(ev,space)}
                        // onOpen={handleOnOpen}
                        // onClose={handleOnClose}
                        poi={{key: space.id, location: latLngLiteral} as Poi}
                        // anchorElement={document.getElementById('anchor')!}
                        // onClose={() => console.log('close')}

                    />
                // <AdvancedMarker
                //     key={space.name}
                //     position={space.location}
                //     // ref={marker => setMarkerRef(marker, poi.key)}
                //     onClick={handleClick}
                //     >

                //     <Pin background={'#FBBC04'} glyphColor={'#000'} borderColor={'#000'} />
                // </AdvancedMarker>
                )
                
            })}
            
        </>
    )
}

async function loadWorkspaceLibrary():Promise<typeof placeLibrary> {
    const spaces = placeLibrary;
    const data = await getWorkbruData();
    const jsonData = JSON.parse(data)
    spaces.setPlaces(jsonData);
    return spaces;
}