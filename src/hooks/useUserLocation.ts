import { useState, useEffect } from "react";

interface UserLocation {
  latitude?: number;
  longitude?: number;
  error?: string;
  loading: boolean;
}

/**
 * A hook to get the user's current geolocation
 * @returns UserLocation object containing latitude, longitude, error state, and loading state
 */
const useUserLocation = (): UserLocation => {
  const [location, setLocation] = useState<UserLocation>({
    loading: true,
  });

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setLocation({
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    // Request location permission and get location
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";
        
        // Provide more specific error messages
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information is unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }
        
        setLocation({
          error: errorMessage,
          loading: false,
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000, // 10 seconds
        maximumAge: 0, // no cache
      }
    );
  }, []);

  return location;
};

export default useUserLocation;
