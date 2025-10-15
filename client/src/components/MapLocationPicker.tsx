
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import { Button } from '@/components/ui/button';
import { MapPin, Navigation } from 'lucide-react';
import { useLanguage } from '@/components/LanguageProvider';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapLocationPickerProps {
  latitude?: number;
  longitude?: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

function LocationMarker({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  const [position, setPosition] = useState<[number, number] | null>(null);

  const map = useMapEvents({
    click(e) {
      setPosition([e.latlng.lat, e.latlng.lng]);
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return position === null ? null : <Marker position={position} />;
}

export function MapLocationPicker({ latitude, longitude, onLocationSelect }: MapLocationPickerProps) {
  const { language } = useLanguage();
  const [center, setCenter] = useState<[number, number]>([24.7136, 46.6753]); // Default: Riyadh
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  useEffect(() => {
    if (latitude && longitude) {
      setCenter([latitude, longitude]);
      setMarkerPosition([latitude, longitude]);
    }
  }, [latitude, longitude]);

  const handleLocationSelect = (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    onLocationSelect(lat, lng);
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert(language === 'ar' ? 'المتصفح لا يدعم تحديد الموقع' : 'Geolocation is not supported by your browser');
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setCenter([lat, lng]);
        setMarkerPosition([lat, lng]);
        onLocationSelect(lat, lng);
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error('Error getting location:', error);
        alert(language === 'ar' ? 'فشل في الحصول على الموقع الحالي' : 'Failed to get current location');
        setIsLoadingLocation(false);
      }
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={getCurrentLocation}
          disabled={isLoadingLocation}
          className="flex-1"
          data-testid="button-current-location"
        >
          <Navigation className="h-4 w-4 mr-2" />
          {isLoadingLocation 
            ? (language === 'ar' ? 'جاري التحميل...' : 'Loading...')
            : (language === 'ar' ? 'الموقع الحالي' : 'Current Location')
          }
        </Button>
        {markerPosition && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground px-3 border rounded-md">
            <MapPin className="h-4 w-4" />
            <span>{markerPosition[0].toFixed(6)}, {markerPosition[1].toFixed(6)}</span>
          </div>
        )}
      </div>
      
      <div className="h-[400px] rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          data-testid="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markerPosition && <Marker position={markerPosition} />}
          <LocationMarker onLocationSelect={handleLocationSelect} />
        </MapContainer>
      </div>
      
      <p className="text-sm text-muted-foreground">
        {language === 'ar' 
          ? 'انقر على الخريطة لتحديد الموقع أو استخدم زر الموقع الحالي'
          : 'Click on the map to select a location or use the current location button'
        }
      </p>
    </div>
  );
}
