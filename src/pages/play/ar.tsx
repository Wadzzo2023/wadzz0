/* eslint-disable */

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
// @ts-ignore
import {
  ClickHandler,
  DeviceOrientationControls,
  LocationBased,
  WebcamRenderer,
} from "~/lib/play/locar";

import { Coins, ShoppingBasket } from "lucide-react";
import ArCard from "~/components/play/ar-card";
import { BASE_URL } from "~/lib/common";
import { useNearByPin } from "~/lib/state/play/useNearbyPin";
import useWindowDimensions from "~/lib/state/play/useWindowWidth";
import { ConsumedLocation } from "~/types/game/location";

const ARPage = () => {
  const [selectedPin, setPin] = useState<ConsumedLocation>();
  const collectPinRes = useRef();
  const { data } = useNearByPin();
  const winDim = useWindowDimensions();

  const [infoBoxVisible, setInfoBoxVisible] = useState(false);
  const [infoBoxPosition, setInfoBoxPosition] = useState({ left: 0, top: 0 });
  const rendererRef = useRef();
  const previousIntersectedObject = useRef();

  const [showLoading, setShowLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const simulateApiCall = async () => {
    if (!selectedPin) return;
    try {
      setShowLoading(true);
      const response = await fetch(
        new URL("api/game/locations/consume", BASE_URL).toString(),
        {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ location_id: selectedPin.id.toString() }),
        },
      );

      if (!response.ok) {
        const code = response.status;
        if (code === 422) {
          const data = (await response.json()) as {
            success: boolean;
            data: string;
          };
          throw new Error(data.data);
        }
        throw new Error("Failed to consume location");
      }
      setShowSuccess(true);
    } catch (error) {
      console.error("Error consuming location", error);
      // if err type of Error
      if (error instanceof Error) {
        console.error("Error consuming location", error.message);
        alert(error.message);
      } else {
        alert("Failed to consume location");
      }
    } finally {
      setShowLoading(false);
    }
  };

  useEffect(() => {
    const camera = new THREE.PerspectiveCamera(
      80,
      window.innerWidth / window.innerHeight,
      0.001,
      1000,
    );

    const renderer = new THREE.WebGLRenderer({ alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    document.body.appendChild(renderer.domElement);

    // @ts-ignore
    rendererRef.current = renderer;

    const scene = new THREE.Scene();
    const locar = new LocationBased(scene, camera);
    const cam = new WebcamRenderer(renderer);
    const clickHandler = new ClickHandler(renderer);
    const deviceOrientationControls = new DeviceOrientationControls(camera);

    window.addEventListener("resize", () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    });

    let coins: THREE.Mesh[] = [];
    let firstLocation = true;

    // @ts-ignore
    locar.on("gpsupdate", (pos) => {
      if (firstLocation) {
        const { latitude, longitude } = pos.coords;

        alert(`GPS location found! ${latitude}, ${longitude}`);

        // Generate random box positions around initial location
        // const boxPositions = generateRandomBoxPositions(latitude, longitude);
        const coinsPositions = data.nearbyPins;

        if (!coinsPositions) return;

        // Create and add boxes to the scene
        // Create coin geometry
        const radius = 5;
        const thickness = 0.2;
        const segments = 64;
        const coinGeometry = new THREE.CylinderGeometry(
          radius,
          radius,
          thickness,
          segments,
        );
        coinGeometry.rotateX(Math.PI / 2);
        // coinGeometry.rotateY(Math.PI / 4);

        // Replace the entire coin creation section with this:
        const textureLoader = new THREE.TextureLoader();

        for (const coin of coinsPositions) {
          // Pre-load textures with proper error handling
          const brandImage =
            coin.brand_image_url ?? "https://picsum.photos/300/300";
          const headTexture = textureLoader.load(
            brandImage,
            undefined,
            undefined,
            (err) => console.error("Error loading head texture:", err),
          );

          headTexture.rotation = Math.PI / 2;
          headTexture.center = new THREE.Vector2(0.5, 0.5);

          const tailTexture = textureLoader.load(
            brandImage,
            undefined,
            undefined,
            (err) => console.error("Error loading tail texture:", err),
          );
          tailTexture.rotation = Math.PI / 2;
          tailTexture.center = new THREE.Vector2(0.5, 0.5);

          // Create materials after textures are loaded
          const materials = [
            new THREE.MeshStandardMaterial({ color: 0xd4af37, roughness: 0.3 }), // Edge
            new THREE.MeshBasicMaterial({ map: headTexture }), // Top - Using MeshBasicMaterial
            new THREE.MeshBasicMaterial({ map: tailTexture }), // Bottom - Using MeshBasicMaterial
          ];

          const coinObject = new THREE.Mesh(coinGeometry, materials);
          coinObject.userData = coin;
          locar.add(coinObject, coin.lng, coin.lat);
          coins.push(coinObject);
        }
        firstLocation = false;
      }
    });

    locar.startGps();

    function collectPin() {
      console.log("claim the pin");
    }

    // @ts-ignore
    collectPinRes.current = collectPin;

    renderer.setAnimationLoop(() => {
      cam.update();
      deviceOrientationControls.update();
      renderer.render(scene, camera);

      const [intersect] = clickHandler.raycast(camera, scene);

      // Handle any clicked objects
      if (intersect) {
        // if (previousIntersectedObject.current) {
        //   previousIntersectedObject.current.material.color.set(
        //     previousIntersectedObject.current.userData.color
        //   );
        // }

        const objectData = intersect.object.userData as ConsumedLocation;

        // Set the info box content and position
        setInfoBoxVisible(true);

        // Calculate screen position of the intersected object
        const vector = new THREE.Vector3();
        intersect.object.getWorldPosition(vector);
        vector.project(camera);

        const left = ((vector.x + 1) / 2) * window.innerWidth;
        const top = (-(vector.y - 1) / 2) * window.innerHeight;
        setInfoBoxPosition({ left, top });

        // Set color change on object
        // intersect.object.material.color.set(0xff0000);
        // @ts-ignore
        previousIntersectedObject.current = intersect.object;

        // Hide info box after 3 seconds
        setTimeout(() => setInfoBoxVisible(false), 3000);

        // Set pin to object's name
        setPin(objectData);
      }

      // animate coins
      // const time = Date.now() * 0.001;
      // coins.forEach((coin) => {
      //   coin.rotation.y = Math.sin(time) * Math.PI * 0.5; // Flipping animation
      // });
      const time = Date.now() * 0.001;
      coins.forEach((coin) => {
        // Check if this coin is the focused one (previousIntersectedObject)
        if (coin === previousIntersectedObject.current) {
          // Fast flipping for focused coin
          // coin.rotation.y = Math.sin(time * 3) * Math.PI * 0.7;
          // @ts-ignore
          coin.rotation.y = Math.PI / 2;
        } else {
          // Normal gentle flipping for other coins
          coin.rotation.y = Math.sin(time) * Math.PI * 0.3;
        }
      });
    });

    return () => {
      // Clean up
      renderer.dispose();
      document.body.removeChild(renderer.domElement);
    };
  }, []);

  // return <ArLoading pin={pin} />;
  return (
    <>
      {infoBoxVisible && selectedPin && (
        <ArCard
          pin={selectedPin}
          position={{
            left: winDim.width / 2 - 208 / 2,
            top: infoBoxPosition.top,
          }}
        />
      )}

      {selectedPin && (
        <div className="absolute bottom-0 left-0 right-0  w-full bg-gray-100">
          <div
            className="absolute bottom-0 left-0 right-0 flex items-stretch bg-gray-800 shadow-lg"
            style={{ width: winDim.width }}
          >
            <div className="flex flex-1 items-center space-x-1 px-1 py-4">
              <div className="relative">
                <ShoppingBasket className="h-12 w-12 text-yellow-500" />
                <div className="absolute bottom-1 right-1 rounded-full bg-yellow-400 p-1">
                  <Coins className="h-4 w-4 text-yellow-800" />
                </div>
              </div>
              <div className="text-white">
                <p className="text-sm font-semibold text-yellow-400">
                  {selectedPin.title}
                </p>
                <p className="text-lg font-bold">{selectedPin.brand_name}</p>
              </div>
            </div>

            <div
              className="my-2 w-px self-stretch bg-gray-700"
              aria-hidden="true"
            ></div>

            <div className="flex flex-1 flex-col items-center  justify-center px-2">
              <p className="line-clamp-2 overflow-hidden  text-sm leading-snug text-white">
                {selectedPin.description}
              </p>
              <p className="text-sm text-gray-400">
                Collection Limit: {selectedPin.collection_limit_remaining}
              </p>
              <a
                href={selectedPin.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-400 underline"
              >
                More Info
              </a>
            </div>

            <div
              className="my-2 w-px self-stretch bg-gray-700"
              aria-hidden="true"
            ></div>

            {!data.singleAR && (
              <>
                {selectedPin.collected ? (
                  <div className="flex items-center p-4">
                    <span className="text-sm text-gray-400">Collected</span>
                  </div>
                ) : (
                  <div className="flex items-center p-4">
                    <button
                      onClick={simulateApiCall}
                      className="rounded-lg bg-blue-500 px-6 py-2 font-semibold text-white transition-colors duration-200 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-opacity-50"
                    >
                      Capture
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      <>
        {/* Loading overlay */}
        {showLoading && (
          <div
            className="absolute inset-0  flex items-center justify-center bg-black bg-opacity-50"
            style={{
              width: winDim.width,
            }}
          >
            <div className="rounded-lg bg-white p-6 text-center">
              <div className="mx-auto mb-4 h-16 w-16 animate-spin rounded-full border-t-4 border-blue-500"></div>
              <p className="text-xl font-bold">Capturing the coin...</p>
            </div>
          </div>
        )}

        {/* Success animation */}
        {showSuccess && (
          <div
            className="absolute inset-0 flex items-center justify-center bg-green-500 bg-opacity-50"
            style={{ width: winDim.width }}
          >
            <div className="rounded-lg bg-white p-6 text-center">
              <div className="mb-4 text-6xl">🎉</div>
              <p className="mb-2 text-2xl font-bold">Coin Captured!</p>
              <p className="text-lg">{selectedPin?.brand_name}</p>
            </div>
          </div>
        )}
      </>
    </>
  );
};

export default ARPage;

interface ProgressButtonProps {
  onComplete: () => void;
  children: React.ReactNode;
  className?: string;
  duration?: number;
}

export function ProgressButton({
  onComplete,
  children,
  className = "",
  duration = 2000,
}: ProgressButtonProps) {
  const [progress, setProgress] = useState(0);
  const [isPressed, setIsPressed] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPressed) {
      intervalRef.current = setInterval(() => {
        setProgress((prevProgress) => {
          if (prevProgress >= 100) {
            clearInterval(intervalRef.current!);
            return 100;
          }
          return prevProgress + 1;
        });
      }, duration / 100);

      timeoutRef.current = setTimeout(() => {
        if (isPressed) {
          onComplete();
        }
      }, duration);
    } else {
      if (progress < 100) {
        setProgress(0);
      }
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isPressed, duration, onComplete, progress]);

  const handlePressStart = () => {
    setIsPressed(true);
  };

  const handlePressEnd = () => {
    setIsPressed(false);
  };

  return (
    <button
      className={`relative overflow-hidden ${className}`}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div className="relative z-10">{children}</div>
      <div
        className="absolute inset-0 origin-left bg-green-400 transition-all duration-100"
        style={{
          transform: `scaleX(${progress / 100})`,
          opacity: 0.3,
        }}
      />
    </button>
  );
}

// Example usage
export function Example() {
  const handleComplete = () => {};

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <ProgressButton
        onComplete={handleComplete}
        className="rounded-lg bg-blue-500 px-6 py-3 text-white focus:outline-none"
      >
        Hold to Capture
      </ProgressButton>
    </div>
  );
}
