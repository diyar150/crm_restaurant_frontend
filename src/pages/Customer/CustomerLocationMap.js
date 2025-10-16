import React, { useState, useEffect } from 'react';
import { Modal, Button } from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import LoadingSpinner from '../../components/common/LoadingSpinner';

// Custom icon for current location (blue marker)
const currentLocationIcon = new L.Icon({
  iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const SULAIMANY_CENTER = [35.5646, 45.4322];
const ERBIL_CENTER = [36.1900, 44.0090];
const DEFAULT_CENTER = SULAIMANY_CENTER; 

const CustomerLocationMap = ({ open, onClose, onLocationSelect }) => {
  const [position, setPosition] = useState(null);
  const [mapCenter, setMapCenter] = useState(DEFAULT_CENTER);
  const [currentLocation, setCurrentLocation] = useState(null);
    const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const coords = [pos.coords.latitude, pos.coords.longitude];
          const isErbil = (
            Math.abs(coords[0] - ERBIL_CENTER[0]) < 0.5 &&
            Math.abs(coords[1] - ERBIL_CENTER[1]) < 0.5
          );
          const isSulaimany = (
            Math.abs(coords[0] - SULAIMANY_CENTER[0]) < 0.5 &&
            Math.abs(coords[1] - SULAIMANY_CENTER[1]) < 0.5
          );
          if (isErbil) setMapCenter(ERBIL_CENTER);
          else if (isSulaimany) setMapCenter(SULAIMANY_CENTER);
          else setMapCenter(coords);

          setCurrentLocation({ lat: coords[0], lng: coords[1] });
          setPosition({ lat: coords[0], lng: coords[1] });
          setLoading(false);
        },
        () => {
          setMapCenter(DEFAULT_CENTER);
          setLoading(false);
        }
      );
    }
    if (!open) {
      setPosition(null);
      setMapCenter(DEFAULT_CENTER);
      setCurrentLocation(null);
    }
  }, [open]);

  // Map click handler
  function MapClickHandler() {
    useMapEvents({
      click: (event) => {
        setPosition(event.latlng);
      },
    });
    return null;
  }

  const modalStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    background: '#fff',
    boxShadow: 24,
    padding: 16,
    outline: 'none',
    borderRadius: 8,
    maxHeight: '90vh',
    maxWidth: '90vw',
    overflow: 'auto',
  };

  const handleSelectLocation = () => {
    if (position) {
      onLocationSelect({ lat: position.lat, lng: position.lng });
      onClose();
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <div style={modalStyle}>
        {loading ? (
          <LoadingSpinner size={48} message="چاوەڕوان بن..." />
        ) : (
          <>
            <div style={{ height: '70vh', width: '70vw' }}>
              <MapContainer center={mapCenter} zoom={15} style={{ height: '100%', width: '100%' }}>
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                />
                <MapClickHandler />
                {currentLocation && (
                  <Marker
                    position={[currentLocation.lat, currentLocation.lng]}
                    icon={currentLocationIcon}
                  />
                )}
                {position && (
                  <Marker
                    position={[position.lat, position.lng]}
                  />
                )}
              </MapContainer>
            </div>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSelectLocation}
              style={{ marginTop: '16px', float: 'left' }}
              disabled={!position}
            >
              شوێن دیاری بکە
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              onClick={onClose}
              style={{ marginTop: '16px', marginLeft: '8px', float: 'left' }}
            >
              داخستن
            </Button>
          </>
        )}
      </div>
    </Modal>
  );
};

export default CustomerLocationMap;