"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Map, {
    Marker,
    NavigationControl,
    Source,
    Layer,
    type MapRef,
    type ViewStateChangeEvent,
    type MapLayerMouseEvent,
    MapMouseEvent,
} from "react-map-gl"
import "mapbox-gl/dist/mapbox-gl.css"
import { Button } from "~/components/shadcn/ui/button"
import { Card } from "~/components/shadcn/ui/card"
import {
    ArrowLeft,
    CrosshairIcon as Crosshairs,
    MapPin,
    Clock,
    Ruler,
    RefreshCw,
    Bike,
    Car,
    FootprintsIcon as Walk,
} from "lucide-react"
import Image from "next/image"
import { useDestinationStore } from "~/components/hooks/use-destination-store"
import { useModal } from "~/lib/state/play/useModal"

// Constants for route deviation detection
const ROUTE_DEVIATION_THRESHOLD = 50 // meters
const RECALCULATION_COOLDOWN = 10000 // 10 seconds

// Route profiles
const routeProfiles = [
    { id: "walking", label: "Walking", icon: <Walk className="mr-2" size={18} /> },
    { id: "cycling", label: "Cycling", icon: <Bike className="mr-2" size={18} /> },
    { id: "driving", label: "Driving", icon: <Car className="mr-2" size={18} /> },
]

type LocationType = {
    latitude: number
    longitude: number
}

export default function StoreLocation() {
    const router = useRouter()
    const searchParams = useSearchParams()

    // Mock data that would come from your store
    const { data: collectionData } = useDestinationStore()
    const { data } = useModal()

    const mapRef = useRef<MapRef>(null)
    const [destinationCoords, setDestinationCoords] = useState<[number, number]>([
        collectionData?.longitude ?? 0,
        collectionData?.latitude ?? 0,
    ])
    const [loading, setLoading] = useState(true)
    const [followUserMode, setFollowUserMode] = useState(true)
    const [touchOnMap, setTouchOnMap] = useState(false)
    const [handleRecenterPress, setHandleRecenterPress] = useState(false)
    const [selectedRouteProfile, setSelectedRouteProfile] = useState<string>("walking")
    const [userLocation, setUserLocation] = useState<LocationType | null>(null)
    const [distance, setDistance] = useState<string | null>(null)
    const [duration, setDuration] = useState<string | null>(null)
    const [routeCoordinates, setRouteCoordinates] = useState<[number, number][]>([])
    const [isOffRoute, setIsOffRoute] = useState(false)
    const [lastRecalculationTime, setLastRecalculationTime] = useState(0)
    const [showRecalculatingMessage, setShowRecalculatingMessage] = useState(false)
    const [viewState, setViewState] = useState({
        longitude: -74.006,
        latitude: 40.7128,
        zoom: 16,
        bearing: 0,
        pitch: 0,
    })
    const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection>({
        type: "FeatureCollection",
        features: [
            {
                type: "Feature",
                properties: {},
                geometry: {
                    type: "LineString",
                    coordinates: [],
                },
            },
        ],
    })

    // Get user location on component mount
    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation({ latitude, longitude })
                setViewState((prev) => ({
                    ...prev,
                    latitude,
                    longitude,
                }))
                setLoading(false)
            },
            (error) => {
                console.error("Error getting location:", error)
                setLoading(false)
            },
            { enableHighAccuracy: true },
        )
    }, [])

    // Watch user position
    useEffect(() => {
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                const { latitude, longitude } = position.coords
                setUserLocation({ latitude, longitude })

                if (followUserMode) {
                    setViewState((prev) => ({
                        ...prev,
                        latitude,
                        longitude,
                    }))
                }

                // Check if user is off route and handle recalculation
                if (routeCoordinates.length > 0) {
                    const isDeviated = checkRouteDeviation({ latitude, longitude }, routeCoordinates)
                    setIsOffRoute(isDeviated)

                    // Recalculate route if user is off route and cooldown period has passed
                    const currentTime = Date.now()
                    if (isDeviated && currentTime - lastRecalculationTime > RECALCULATION_COOLDOWN) {
                        createRouterLine([longitude, latitude], selectedRouteProfile)
                        setLastRecalculationTime(currentTime)

                        // Hide recalculating message after 3 seconds
                        setTimeout(() => {
                            setShowRecalculatingMessage(false)
                        }, 3000)
                    }
                }
            },
            (error) => {
                console.error("Error watching position:", error)
            },
            { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 },
        )

        return () => {
            navigator.geolocation.clearWatch(watchId)
        }
    }, [])

    // Create route when user location or profile changes
    useEffect(() => {
        if (userLocation && selectedRouteProfile) {
            createRouterLine([userLocation.longitude, userLocation.latitude], selectedRouteProfile)
        }
    }, [userLocation, selectedRouteProfile])

    // Calculate distance between two points in meters
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
        const R = 6371e3 // Earth's radius in meters
        const φ1 = (lat1 * Math.PI) / 180
        const φ2 = (lat2 * Math.PI) / 180
        const Δφ = ((lat2 - lat1) * Math.PI) / 180
        const Δλ = ((lon2 - lon1) * Math.PI) / 180

        const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return R * c
    }

    // Check if user has deviated from the route
    const checkRouteDeviation = (userLocation: LocationType, routeCoords: [number, number][]): boolean => {
        // Find the closest point on the route to the user
        let minDistance = Number.POSITIVE_INFINITY

        for (const coord of routeCoords) {
            const distance = calculateDistance(
                userLocation.latitude,
                userLocation.longitude,
                coord[1], // Mapbox coordinates are [longitude, latitude]
                coord[0],
            )

            if (distance < minDistance) {
                minDistance = distance
            }
        }

        // If the minimum distance is greater than the threshold, user is off route
        return minDistance > ROUTE_DEVIATION_THRESHOLD
    }

    // Create route line
    async function createRouterLine(coords: [number, number], routeProfile: string): Promise<void> {
        if (!coords[0] || !coords[1]) return

        const startCoords = `${coords[0]},${coords[1]}`
        const endCoords = String([destinationCoords[0], destinationCoords[1]]);

        const geometries = "geojson"
        const url = `https://api.mapbox.com/directions/v5/mapbox/${routeProfile}/${startCoords};${endCoords}?alternatives=true&geometries=${geometries}&steps=true&banner_instructions=true&overview=full&voice_instructions=true&access_token=${process.env.NEXT_PUBLIC_MAPBOX_API}`

        try {
            const response = await fetch(url)
            const json = (await response.json()) as {
                routes: {
                    distance: number;
                    duration: number;
                    geometry: {
                        coordinates: [number, number][];
                    };
                }[];
            }

            if (json.routes && json.routes.length > 0) {
                const route = json.routes[0];
                if (!route) {
                    throw new Error("No route found");
                }
                setDistance((route.distance / 1000).toFixed(2));

                // Update distance and duration
                setDistance((route.distance / 1000).toFixed(2))
                const hours = Math.floor(route.duration / 3600)
                const minutes = Math.floor((route.duration % 3600) / 60)
                setDuration(`${hours.toString().padStart(2, "0")}H:${minutes.toString().padStart(2, "0")}M`)

                // Get coordinates
                const coordinates = route.geometry.coordinates

                // Store route coordinates for deviation detection
                setRouteCoordinates(coordinates)

                // Update the route GeoJSON
                setRouteGeoJson({
                    type: "FeatureCollection",
                    features: [
                        {
                            type: "Feature",
                            properties: {},
                            geometry: {
                                type: "LineString",
                                coordinates: coordinates,
                            },
                        },
                    ],
                })
            }

            setLoading(false)
        } catch (e) {
            console.error("Error fetching directions:", e)
            setLoading(false)
        }
    }

    // Handle recenter button click
    const handleRecenter = () => {
        if (!userLocation) return

        setHandleRecenterPress(true)
        setViewState({
            longitude: userLocation.longitude,
            latitude: userLocation.latitude,
            zoom: 14,
            bearing: 0,
            pitch: 0,
        })

        setTimeout(() => {
            setHandleRecenterPress(false)
        }, 8000)

        setFollowUserMode(true)
        setTouchOnMap(false)
    }

    // Handle map interaction


    // Handle view state change
    const handleViewStateChange = (e: ViewStateChangeEvent) => {
        setViewState(e.viewState)

    }

    return (
        <div className="relative h-screen w-full">
            <Map
                {...viewState}
                onMove={handleViewStateChange}
                mapStyle="mapbox://styles/mapbox/navigation-day-v1"
                mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API}
                ref={mapRef}
                attributionControl={false}
                initialViewState={{

                    zoom: 14,

                }}
                style={{ width: "100%", height: "100%" }}
            >


                {/* Route line */}
                <Source id="route" type="geojson" data={routeGeoJson}>
                    <Layer
                        id="route-line"
                        type="line"
                        paint={{
                            "line-color": "#493D9E",
                            "line-width": 4,

                        }}
                    />
                </Source>

                {/* Destination marker */}
                <Marker longitude={destinationCoords[0]} latitude={destinationCoords[1]} anchor="bottom">
                    <div className="relative">
                        {data.Collection?.brand_image_url ? (
                            <div
                                className={`w-8 h-8 border-2 border-primary ${!data.Collection?.auto_collect ? "rounded-full" : ""} ${data.Collection?.auto_collect ? "opacity-40" : ""}`}
                            >
                                <Image
                                    src={data.Collection?.brand_image_url ?? data.Collection?.image_url}
                                    alt={data.Collection?.title}
                                    width={30}
                                    height={30}
                                    className="object-cover h-full w-full rounded-full"
                                />
                            </div>
                        ) : (
                            <MapPin className="h-8 w-8 text-primary" />
                        )}
                    </div>
                </Marker>

                {/* User location marker */}
                {userLocation && (
                    <Marker longitude={userLocation.longitude} latitude={userLocation.latitude} anchor="center">
                        <div className="relative">
                            <div className="w-6 h-6 bg-blue-500 rounded-full border-2 border-white flex items-center justify-center">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                            <div className="absolute -inset-1 bg-blue-500/30 rounded-full animate-pulse"></div>
                        </div>
                    </Marker>
                )}
            </Map>

            {/* Back button */}
            <Button
                className="absolute top-4 left-4 z-10 bg-primary hover:bg-primary/90 p-2 rounded-md"
                onClick={() => router.back()}
            >
                <ArrowLeft className="h-5 w-5" />
            </Button>


            {/* Recalculating message */}
            {showRecalculatingMessage && (
                <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-white p-3 rounded-full shadow-md z-10 flex items-center">
                    <RefreshCw className="h-5 w-5 text-primary animate-spin mr-2" />
                    <span className="text-sm font-medium">Recalculating route...</span>
                </div>
            )}

            {/* Route profile selector */}
            <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-10 flex space-x-2">
                {routeProfiles.map((profile) => (
                    <Button
                        key={profile.id}
                        variant={selectedRouteProfile === profile.id ? "default" : "outline"}
                        className={`flex items-center ${selectedRouteProfile === profile.id ? "bg-primary text-primary-foreground" : "bg-background"}`}
                        onClick={() => setSelectedRouteProfile(profile.id)}
                    >
                        {profile.icon}
                        {profile.label}
                    </Button>
                ))}
            </div>

            {/* Location card */}
            {!loading && distance && duration && (
                <div className="absolute top-4 right-4 z-10">
                    <CustomLocationCard
                        title={data.Collection?.title ?? "Unknown"}
                        duration={duration}
                        distance={distance}
                        brandImageUrl={data.Collection?.brand_image_url}
                    />
                </div>
            )}

            {/* Loading indicator */}
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-20">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
                </div>
            )}
        </div>
    )
}

interface CustomLocationCardProps {
    title: string
    duration: string | null
    distance: string | null
    brandImageUrl?: string
}

function CustomLocationCard({ title, duration, distance, brandImageUrl }: CustomLocationCardProps) {
    return (
        <Card className="w-64 bg-primary text-primary-foreground p-3 rounded-lg shadow-lg">
            <div className="flex items-center mb-2">
                {brandImageUrl ? (
                    <div className="w-6 h-6 rounded-full overflow-hidden mr-2 border border-primary-foreground/30">
                        <Image
                            src={brandImageUrl || "/placeholder.svg"}
                            alt={title}
                            width={24}
                            height={24}
                            className="object-cover"
                        />
                    </div>
                ) : (
                    <div className="w-6 h-6 rounded-full bg-primary-foreground/20 flex items-center justify-center mr-2">
                        <MapPin className="h-4 w-4 text-primary-foreground" />
                    </div>
                )}
                <h3 className="font-semibold text-sm truncate flex-1">{title}</h3>
            </div>

            <div className="flex items-center justify-between">
                <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{duration}</span>
                </div>

                <div className="w-px h-5 bg-primary-foreground/30 mx-2"></div>

                <div className="flex items-center">
                    <Ruler className="h-4 w-4 mr-1" />
                    <span className="text-sm font-medium">{distance} km</span>
                </div>
            </div>
        </Card>
    )
}

