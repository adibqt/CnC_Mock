import React, { useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker } from '@react-google-maps/api';

const containerStyle = {
  width: '100%',
  height: '450px',
  borderRadius: '8px'
};

// Custom map styles matching the original design
const mapStyles = [
  {
    "featureType": "road",
    "stylers": [
      { "color": "#ffffff" }
    ]
  },
  {
    "featureType": "water",
    "stylers": [
      { "color": "#bde5f6" }
    ]
  },
  {
    "featureType": "landscape",
    "stylers": [
      { "color": "#f2f2f2" }
    ]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [
      { "color": "#FF7550" }
    ]
  },
  {
    "featureType": "poi",
    "stylers": [
      { "color": "#e2f0cd" }
    ]
  },
  {
    "elementType": "labels.text",
    "stylers": [
      { "saturation": 2 },
      { "weight": 0.3 },
      { "color": "#a8a8a8" }
    ]
  }
];

const mapOptions = {
  styles: mapStyles,
  disableDefaultUI: false,
  zoomControl: false,
  mapTypeControl: false,
  scaleControl: false,
  streetViewControl: true,
  rotateControl: false,
  fullscreenControl: true,
  scrollwheel: false,
  clickableIcons: false
};

const GoogleMapComponent = ({ center, zoom = 15 }) => {
  const [useIframe, setUseIframe] = useState(false);
  
  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: "AIzaSyDGqTyqoPIvYxhn_Sa7ZrK5bENUWhpCo0w"
  });

  const [map, setMap] = React.useState(null);

  const onLoad = React.useCallback((map) => {
    setMap(map);
  }, []);

  const onUnmount = React.useCallback(() => {
    setMap(null);
  }, []);

  // Use effect to ensure map centers on the correct location when loaded
  React.useEffect(() => {
    if (map && center) {
      map.panTo(center);
    }
  }, [map, center]);

  // Fallback to iframe if there's an error
  if (loadError || useIframe) {
    const iframeSrc = `https://www.google.com/maps?q=${center.lat},${center.lng}&z=${zoom}&output=embed`;
    return (
      <div style={{ width: '100%', height: '450px', borderRadius: '8px', overflow: 'hidden' }}>
        <iframe
          src={iframeSrc}
          width="100%"
          height="100%"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        height: '450px', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        backgroundColor: '#f5f5f5',
        borderRadius: '8px'
      }}>
        <div>
          <div className="spinner-border text-primary" role="status">
            <span className="sr-only">Loading...</span>
          </div>
          <p style={{ marginTop: '10px' }}>Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={center}
      zoom={zoom}
      options={mapOptions}
      onLoad={onLoad}
      onUnmount={onUnmount}
    >
      {center && (
        <Marker
          position={center}
          animation={2} // DROP animation
        />
      )}
    </GoogleMap>
  );
};

export default GoogleMapComponent;
