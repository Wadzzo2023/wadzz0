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
      // Choose a random AI-generated description if available
      const getRandomAIDescription = (
        descriptions?: string[],
      ): string | undefined => {
        if (
          !descriptions ||
          !Array.isArray(descriptions) ||
          descriptions.length === 0
        ) {
          return undefined;
        }
        return descriptions[Math.floor(Math.random() * descriptions.length)];
      };

      const aiGeneratedDescription = getRandomAIDescription(
        location.aiUrlDescriptions,
      );
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

      // Create a truncated description for the first two lines
      // Split the description into lines and get the first two lines
      const descriptionLines = location.description.split("\n");
      const firstTwoLines = descriptionLines.slice(0, 2).join("\n");

      // If there are more than two lines, truncate, otherwise use the full description
      const twoLineDescription =
        descriptionLines.length > 2 ? firstTwoLines : location.description;

      // Also create a version that shows first two lines and truncates if a line is too long
      const truncatedDescription =
        twoLineDescription.length > 150
          ? twoLineDescription.substring(0, 150) + "..."
          : twoLineDescription;

      // Generate a unique ID for this location's description elements
      const descriptionId = `desc-${location.id}`;

      // Create enhanced popup with redesigned layout based on mockup
      const popup = new mapboxgl.Popup({
        offset: 25,
        maxWidth: "500px",
      }).setHTML(`
        <div style="display: flex; padding: 0; max-width: 500px; border-radius: 8px; overflow: hidden;">
          <!-- Left Side: All Info Sections -->
          <div style="flex: 2; min-width:250px; display: flex; flex-direction: column; border-right: 1px solid #e5e5e5;">
            <!-- Header section with name/brand - redesigned layout -->
            <div style="display: flex; flex-direction: column; padding: 10px; border-bottom: 1px solid #e5e5e5; background-color: #f9f9f9;">
              <div style="display: flex; align-items: flex-start; margin-bottom: 5px;">
                <img src="${location.brand_image_url}" style="width: 32px; height: 32px; border-radius: 50%; margin-right: 10px; object-fit: cover;">
                <div style="display: flex; flex-direction: column; flex: 1;">
                  <h3 style="margin: 0; font-size: 16px; font-weight: 600;">${location.title}</h3>
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 3px;">
                    <div style="font-size: 11px; color: #666;">By: ${location.brand_name}</div>
                    <div style="font-size: 11px; color: #666;">Loc: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}</div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Pin Image - if available -->
            ${
              location.image_url
                ? `<div style="padding: 0; border-bottom: 1px solid #e5e5e5; text-align: center; overflow: hidden; height: 180px; position: relative;" class="pin-image-container">
              <img src="${location.image_url}" style="width: 100%; height: 100%; object-fit: cover;" class="pin-image">
              <div style="position: absolute; bottom: 0; right: 0; background-color: rgba(0,0,0,0.5); color: white; font-size: 10px; padding: 2px 5px; border-top-left-radius: 3px;">
                ${location.brand_name}
              </div>
            </div>`
                : ""
            }
            
            <!-- Description section with Show More functionality -->
            <div style="padding: 10px; border-bottom: 1px solid #e5e5e5;">
              <div style="font-weight: 500; margin-bottom: 5px; font-size: 13px;">Description</div>
              <div id="short-desc-${descriptionId}" style="margin: 0; font-size: 13px; color: #444; line-height: 1.4;">
                ${truncatedDescription}
                ${
                  descriptionLines.length > 2 || twoLineDescription.length > 150
                    ? `<button 
                    onclick="document.getElementById('short-desc-${descriptionId}').style.display='none'; 
                            document.getElementById('full-desc-${descriptionId}').style.display='block';" 
                    style="display: inline-block; background: none; border: none; padding: 0; margin-left: 5px; color: #3b82f6; cursor: pointer; font-size: 12px; font-weight: 500;">
                    Show more
                  </button>`
                    : ""
                }
              </div>
              <div id="full-desc-${descriptionId}" style="display: none; margin: 0; font-size: 13px; color: #444; line-height: 1.4;">
                ${location.description}
                <button 
                  onclick="document.getElementById('short-desc-${descriptionId}').style.display='block'; 
                           document.getElementById('full-desc-${descriptionId}').style.display='none';" 
                  style="display: inline-block; background: none; border: none; padding: 0; margin-left: 5px; color: #3b82f6; cursor: pointer; font-size: 12px; font-weight: 500;">
                  Show less
                </button>
              </div>
            </div>
            
            <!-- AI Generated Info section - no border-bottom to remove the line -->
            ${
              location.aiUrlDescriptions &&
              location.aiUrlDescriptions.length > 0 &&
              aiGeneratedDescription
                ? `
            <div class="ai-gradient-box">
              <div class="ai-badge">AI</div>
              <div style="font-weight: 600; margin-bottom: 8px; display: flex; align-items: center; background: linear-gradient(90deg, #4285f4, #0f9d58); -webkit-background-clip: text; background-clip: text; color: transparent; text-shadow: 0px 0px 1px rgba(66,133,244,0.2);">
                <span style="margin-right: 5px;">✨</span> AI Generated Insight
              </div>
              <div style="font-size: 13px; color: #333; line-height: 1.5; padding: 0; position: relative; font-style: italic; text-shadow: 0 0 1px rgba(0,0,0,0.05);">
                "${aiGeneratedDescription}"
              </div>
            </div>
            `
                : ``
            }
          </div>
          
          <!-- Right Side: QR Codes -->
          <div style="flex: 1; display: flex; flex-direction: column;">
            <!-- QR Codes -->
            <div style="flex: 1; display: flex; flex-direction: column; justify-content: center;">
              <div style="display: flex; flex-direction: column; align-items: center; padding: 10px; border-bottom: 1px solid #eee;">
                <img src="${androidAppQrCodeUrl}" style="width: 80px; height: 80px; margin-bottom: 5px;">
                <span style="font-size: 11px; color: #666; text-align: center;">Android App</span>
              </div>
              <div style="display: flex; flex-direction: column; align-items: center; padding: 10px;">
                <img src="${iosAppQrCodeUrl}" style="width: 80px; height: 80px; margin-bottom: 5px;">
                <span style="font-size: 11px; color: #666; text-align: center;">iOS App</span>
              </div>
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

  // Add custom CSS for improved popup styling based on mockup
  useEffect(() => {
    // Add custom styles for the Mapbox popups
    const style = document.createElement("style");
    style.textContent = `
      .mapboxgl-popup-content {
        padding: 0;
        border-radius: 8px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.15);
        overflow: hidden;
        max-width: 450px !important;
      }
      
      .mapboxgl-popup-close-button {
        font-size: 16px;
        color: #333;
        padding: 4px;
        right: 3px;
        top: 3px;
        background: white;
        border-radius: 50%;
        width: 20px;
        height: 20px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        z-index: 10;
      }
      
      .mapboxgl-popup-close-button:hover {
        background: #f0f0f0;
      }
      
      .mapboxgl-popup-tip {
        border-top-color: #f9f9f9 !important;
      }
      
      .pin-image-container {
        overflow: hidden;
      }
      
      .pin-image {
        transition: transform 0.3s ease;
      }
      
      .pin-image:hover {
        transform: scale(1.05);
      }
      
      .ai-gradient-box {
        position: relative;
        overflow: hidden;
        border-radius: 8px;
        background: linear-gradient(135deg, #fcfdff 0%, #f0f7ff 100%);
        padding: 12px;
        margin: 10px;
        box-shadow: 0 2px 10px rgba(66, 133, 244, 0.1);
        animation: pulseGlow 3s ease-in-out infinite alternate;
      }
      
      @keyframes pulseGlow {
        0% {
          box-shadow: 0 2px 10px rgba(66, 133, 244, 0.1);
        }
        100% {
          box-shadow: 0 2px 15px rgba(66, 133, 244, 0.2);
        }
      }
      
      .ai-gradient-box::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        border-radius: 8px;
        padding: 2px;
        background: linear-gradient(45deg, #4285f4, #0f9d58, #f4b400, #db4437);
        background-size: 300% 300%;
        animation: gradientBorder 6s ease infinite;
        -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
        -webkit-mask-composite: xor;
        mask-composite: exclude;
        pointer-events: none;
      }
      
      @keyframes gradientBorder {
        0% {
            background-position: 0% 50%;
            box-shadow: 0 0 5px rgba(66, 133, 244, 0.3);
        }
        50% {
            background-position: 100% 50%;
            box-shadow: 0 0 10px rgba(66, 133, 244, 0.5);
        }
        100% {
            background-position: 0% 50%;
            box-shadow: 0 0 5px rgba(66, 133, 244, 0.3);
        }
      }
      
      .ai-badge {
        position: absolute;
        top: -2px;
        right: -2px;
        background: linear-gradient(135deg, #4285f4 0%, #34a853 100%);
        color: white;
        font-size: 8px;
        font-weight: bold;
        padding: 3px 6px;
        border-radius: 0 0 0 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        box-shadow: 0 1px 2px rgba(0,0,0,0.2);
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
          padding-bottom: 8px;
          margin-bottom: 8px;
        }
        
        .location-popup-qr {
          padding-left: 0;
          padding-top: 8px;
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
