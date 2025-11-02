
import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
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
  onLocationSelect: (lat: number, lng: number, address?: { 
    addressEn: string; 
    city: string; 
    country: string; 
  }) => void;
}

interface LocationMarkerProps {
  onLocationSelect: (lat: number, lng: number) => void;
  markerPosition: [number, number] | null;
}

function MapCenterUpdater({ center }: { center: [number, number] }): null {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, map.getZoom());
  }, [map, center]);
  
  return null;
}

function LocationMarker({ onLocationSelect, markerPosition }: LocationMarkerProps): JSX.Element | null {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });

  return markerPosition === null ? null : <Marker position={markerPosition} />;
}

export function MapLocationPicker({ latitude, longitude, onLocationSelect }: MapLocationPickerProps) {
  const { language } = useLanguage();
  // Default: 31°53'29.2"N 35°12'35.5"E (Jerusalem area)
  // Precise coordinates: 31.8914444444, 35.2098611111
  const [center, setCenter] = useState<[number, number]>([31.8914444444, 35.2098611111]);
  const [markerPosition, setMarkerPosition] = useState<[number, number] | null>(
    latitude && longitude ? [latitude, longitude] : null
  );
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (latitude && longitude) {
      const newCenter: [number, number] = [latitude, longitude];
      setCenter(newCenter);
      setMarkerPosition(newCenter);
      setError(null);
    } else {
      // If no coordinates provided, use default address
      const defaultCenter: [number, number] = [31.8914444444, 35.2098611111];
      setCenter(defaultCenter);
    }
  }, [latitude, longitude]);

  const handleLocationSelect = async (lat: number, lng: number) => {
    setMarkerPosition([lat, lng]);
    setError(null);
    
    // Reverse geocode to get address
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
      );
      const data = await response.json();
      
      if (data.address) {
        const address = {
          addressEn: data.display_name || '',
          city: data.address.city || data.address.town || data.address.village || '',
          country: data.address.country || '',
        };
        onLocationSelect(lat, lng, address);
      } else {
        onLocationSelect(lat, lng);
      }
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      onLocationSelect(lat, lng);
    }
  };

  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      const message = language === 'ar' 
        ? 'المتصفح لا يدعم تحديد الموقع' 
        : 'Geolocation is not supported by your browser';
      setError(message);
      alert(message);
      return;
    }

    setIsLoadingLocation(true);
    setError(null);
    
    // Call getCurrentPosition directly - this will trigger the browser's native permission prompt
    // The browser will show its own permission dialog if permission hasn't been granted yet
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = position.coords.accuracy; // accuracy in meters
        
        setCenter([lat, lng]);
        setMarkerPosition([lat, lng]);
        setIsLoadingLocation(false);
        setError(null);
        
        // Log accuracy for debugging
        console.log(`Location acquired: ${lat}, ${lng} (accuracy: ±${Math.round(accuracy)}m)`);
        
        // Reverse geocode to get address
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`
          );
          const data = await response.json();
          
          if (data.address) {
            const address = {
              addressEn: data.display_name || '',
              city: data.address.city || data.address.town || data.address.village || '',
              country: data.address.country || '',
            };
            onLocationSelect(lat, lng, address);
          } else {
            onLocationSelect(lat, lng);
          }
        } catch (error) {
          console.error('Reverse geocoding error:', error);
          onLocationSelect(lat, lng);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsLoadingLocation(false);
        
        let errorMessage = '';
        let errorDetails = '';
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = language === 'ar' 
              ? 'تم رفض الوصول إلى الموقع'
              : 'Location access denied';
            errorDetails = language === 'ar'
              ? '\n\nلتفعيل الموقع:\n\n• Chrome/Edge: انقر على أيقونة القفل (🔒) أو (i) بجانب عنوان الموقع → الموقع → السماح\n• Firefox: انقر على (i) → الأذونات → الموقع → السماح\n• Safari: الإعدادات → الخصوصية → خدمات الموقع\n\nثم أعد تحميل الصفحة'
              : '\n\nTo enable:\n\n• Chrome/Edge: Click lock icon (🔒) or (i) next to site URL → Location → Allow\n• Firefox: Click (i) → Permissions → Location → Allow\n• Safari: Settings → Privacy → Location Services\n\nThen reload the page';
            
            // Check if it's a permissions policy violation
            if (error.message && error.message.includes('permissions policy')) {
              errorDetails += language === 'ar'
                ? '\n\nملاحظة: قد تحتاج إلى تحديث الصفحة بعد تغيير الإعدادات.'
                : '\n\nNote: You may need to refresh the page after changing settings.';
            }
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = language === 'ar'
              ? 'معلومات الموقع غير متاحة'
              : 'Location information unavailable';
            errorDetails = language === 'ar'
              ? '\n\nتأكد من:\n• تفعيل GPS على جهازك\n• الاتصال بالإنترنت'
              : '\n\nMake sure:\n• GPS is enabled on your device\n• You have internet connection';
            break;
          case error.TIMEOUT:
            errorMessage = language === 'ar'
              ? 'انتهت مهلة طلب الموقع'
              : 'Location request timed out';
            errorDetails = language === 'ar'
              ? '\n\nحاول مرة أخرى'
              : '\n\nPlease try again';
            break;
          default:
            errorMessage = language === 'ar'
              ? 'حدث خطأ في تحديد الموقع'
              : 'Error getting location';
        }
        
        const fullError = errorMessage + errorDetails;
        setError(errorMessage);
        alert(fullError);
      },
      {
        enableHighAccuracy: true, // Request high accuracy
        timeout: 20000, // Increased timeout for better accuracy
        maximumAge: 0 // Don't use cached position
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
            <span>{markerPosition[0].toFixed(8)}, {markerPosition[1].toFixed(8)}</span>
          </div>
        )}
      </div>
      
      {error && (
        <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
          {error}
        </div>
      )}
      
      <div className="h-[400px] rounded-lg overflow-hidden border">
        <MapContainer
          center={center}
          zoom={15}
          style={{ height: '100%', width: '100%' }}
          data-testid="map-container"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCenterUpdater center={center} />
          <LocationMarker onLocationSelect={handleLocationSelect} markerPosition={markerPosition} />
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
