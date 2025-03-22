import {useState } from 'react';
import {
    AdvancedMarker,
    InfoWindow,
    useAdvancedMarkerRef
  } from '@vis.gl/react-google-maps';

import coffee_icon from '../../assets/coffee_icon.png';
  
interface markerProps {
    position: google.maps.LatLngLiteral;
    name: string;
    address: string;
    poi: Poi,
    // anchorElement: Element;
    handleClick: (ev: google.maps.MapMouseEvent ) => void;
    // onClose: () => void;
    // onOpen: () => void;
}


  export default function MarkerWithInfoWindow (props:markerProps) {
    const [markerRef, marker] = useAdvancedMarkerRef();
    const [isOpen, setIsOpen] = useState(false);

    const handleMarkerClick = (ev: google.maps.MapMouseEvent ) => {
      setIsOpen(!isOpen);
      props.handleClick(ev);
    };
  
    return (
      <>
        <AdvancedMarker position={props.position} ref={markerRef} onClick={handleMarkerClick}>
          <img src={coffee_icon} alt="coffee icon" style={{width: '50px', height: '50px'}} />
        </AdvancedMarker>
        
        {isOpen &&
          <InfoWindow anchor={marker} style={{width: '200px', height: '200px'}}>
            <div className="card" style={{position: 'absolute' }}>
                <div className="card-header">
                    <h3>{props.name}</h3>
                    
                </div>
                <div className="card-body">
                    <p>{props.address}</p>
                    
                </div>
            </div>
        </InfoWindow>}
      </>
    );
  };
