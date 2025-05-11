import { useRef, useEffect, useState } from "react";
import mapboxgl from "mapbox-gl";
import { api } from "~/utils/api";
import { Location } from "~/types/game/location";
import { useRouter } from "next/router";
import ChatInterface from "~/components/ChatInterface";

import "mapbox-gl/dist/mapbox-gl.css";
import { env } from "~/env";

function App() {
  const router = useRouter();
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [userLocation, setUserLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);

  // Extract query parameters
  const creatorIds = router.query["creators[]"];
  const normalizedCreatorIds = Array.isArray(creatorIds)
    ? creatorIds
    : creatorIds
      ? [creatorIds]
      : undefined;

  // Extract initial map location from query params
  const initialLat = router.query.lat
    ? parseFloat(router.query.lat as string)
    : 40.7128;
  const initialLng = router.query.lng
    ? parseFloat(router.query.lng as string)
    : -74.006;
  const initialZoom = router.query.zoom
    ? parseFloat(router.query.zoom as string)
    : 9;

  // Fetch public locations from our tRPC API with optional creator filter
  const { data, isLoading, error } = api.widget.getPublicLocations.useQuery(
    {
      creatorIds: normalizedCreatorIds,
    },
    {
      // Only query when router is ready
      enabled: router.isReady,
    },
  );

  const locations = data?.locations ?? [];

  useEffect(() => {
    // Request user location if available
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          console.log("Unable to get user location");
        },
      );
    }

    mapboxgl.accessToken = env.NEXT_PUBLIC_MAPBOX_API;

    if (mapContainerRef.current) {
      mapRef.current = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: "mapbox://styles/wadzzo/cm1xtphyn01ci01pi20jhfbto", // Custom style
        center: [initialLng, initialLat], // Use initial location from params
        zoom: initialZoom, // Use initial zoom from params
      });

      // Add controls
      mapRef.current.addControl(
        new mapboxgl.NavigationControl(),
        "bottom-right",
      );

      // Add geolocate control once the map is loaded
      mapRef.current.on("load", () => {
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true,
          },
          trackUserLocation: true,
          showUserHeading: true,
        });

        mapRef.current?.addControl(geolocateControl, "bottom-right");
      });
    }

    return () => {
      // Clean up markers
      markersRef.current.forEach((marker) => marker.remove());

      // Clean up map
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, []);

  // Add location markers whenever the data loads or changes
  useEffect(() => {
    if (!mapRef.current || !locations.length) return;

    // Clear previous markers
    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    // Center map on user location if available, otherwise use first location
    if (userLocation && mapRef.current) {
      mapRef.current.setCenter([userLocation.longitude, userLocation.latitude]);
      mapRef.current.setZoom(13);
    } else if (locations.length > 0 && mapRef.current) {
      if (locations[0]) {
        mapRef.current.setCenter([locations[0].lng, locations[0].lat]);
      }
      mapRef.current.setZoom(10);
    }

    // Add markers for all locations
    locations.forEach((location: Location) => {
      // Create custom marker element
      const el = document.createElement("div");
      el.className = "location-marker";
      el.style.width = "30px";
      el.style.height = "30px";
      el.style.borderRadius = location.auto_collect ? "0" : "50%";
      el.style.backgroundImage = `url(${location.brand_image_url})`;
      el.style.backgroundSize = "cover";
      el.style.border = "2px solid #FF006E";
      el.style.cursor = "pointer";

      // Generate QR code URLs for Android and iOS apps
      const androidAppQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        `https://play.google.com/store/apps/details?id=com.wadzzo.app`,
      )}`;

      const iosAppQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(
        `https://apps.apple.com/app/wadzzo/id1234567890`,
      )}`;

      // Create a truncated description with max 100 characters
      const truncatedDescription =
        location.description.length > 100
          ? location.description.substring(0, 100) + "..."
          : location.description;

      // Create enhanced popup with dual QR codes
      const popup = new mapboxgl.Popup({
        offset: 25,
        maxWidth: "450px",
      }).setHTML(`
        <div style="display: flex; flex-direction: column; padding: 15px; max-width: 450px;">
          <div style="display: flex; align-items: center; margin-bottom: 10px;">
            <img src="${location.brand_image_url}" style="width: 30px; height: 30px; border-radius: 50%; margin-right: 10px;">
            <h3 style="margin: 0; font-size: 18px; font-weight: 600;">${location.title}</h3>
          </div>
          
          <!-- Content section with truncated description -->
          <div style="margin-bottom: 15px;">
            <p style="margin: 0 0 10px 0; font-size: 14px; color: #444; line-height: 1.5;" title="${location.description}">${truncatedDescription}</p>
            <div style="display: flex; align-items: center; margin-bottom: 8px;">
              <span style="font-size: 13px; color: #666; margin-right: 8px;">By:</span>
              <span style="font-size: 14px; font-weight: 500;">${location.brand_name}</span>
            </div>
            <div style="font-size: 13px; color: #666; margin-top: 10px;">
              Location: ${location.lat.toFixed(5)}, ${location.lng.toFixed(5)}
            </div>
          </div>
          
          <!-- QR code section - only Android and iOS -->
          <div style="display: flex; justify-content: space-around; border-top: 1px solid #eee; padding-top: 15px;">
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
              <img src="${androidAppQrCodeUrl}" style="width: 100px; height: 100px; margin-bottom: 5px;">
              <span style="font-size: 12px; color: #666; text-align: center;">Android App</span>
            </div>
            <div style="display: flex; flex-direction: column; align-items: center; flex: 1;">
              <img src="${iosAppQrCodeUrl}" style="width: 100px; height: 100px; margin-bottom: 5px;">
              <span style="font-size: 12px; color: #666; text-align: center;">iOS App</span>
            </div>
          </div>
        </div>
      `);

      // Create and add the marker
      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(mapRef.current!);

      markersRef.current.push(marker);
    });
  }, [locations, userLocation]);

  // Add custom CSS for improved popup styling
  useEffect(() => {
    // Add custom styles for the Mapbox popups
    const style = document.createElement("style");
    style.textContent = `
      .mapboxgl-popup-content {
        padding: 0;
        border-radius: 12px;
        box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
        overflow: hidden;
        max-width: 450px !important;
      }
      
      .mapboxgl-popup-close-button {
        font-size: 18px;
        color: #444;
        padding: 6px;
        right: 5px;
        top: 5px;
        background: white;
        border-radius: 50%;
        width: 24px;
        height: 24px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        z-index: 10;
      }
      
      .mapboxgl-popup-close-button:hover {
        background: #f5f5f5;
      }
      
      @media (max-width: 480px) {
        .mapboxgl-popup-content {
          max-width: 300px !important;
        }
        
        .location-popup {
          flex-direction: column;
        }
        
        .location-popup-details {
          border-right: none;
          border-bottom: 1px solid #eee;
          padding-bottom: 10px;
          margin-bottom: 10px;
        }
        
        .location-popup-qr {
          padding-left: 0;
          padding-top: 10px;
        }
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute left-0 right-0 top-0 z-10 bg-black bg-opacity-70 p-2 text-center text-white">
          Loading locations...
        </div>
      )}
      {error && (
        <div className="absolute left-0 right-0 top-0 z-10 bg-red-600 p-2 text-center text-white">
          Error loading locations
        </div>
      )}
      <div
        id="map-container"
        ref={mapContainerRef}
        style={{ width: "100%", height: "100vh" }}
      />

      {/* Include the ChatInterface component */}
      <ChatInterface
        userLocation={userLocation}
        creatorIds={normalizedCreatorIds}
      />
    </div>
  );
}

export default App;
