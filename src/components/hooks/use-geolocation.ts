"use client"

import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"

type SetMapCenter = (center: google.maps.LatLngLiteral) => void
type SetMapZoom = (zoom: number) => void

export function useGeolocation(setMapCenter: SetMapCenter, setMapZoom: SetMapZoom) {
    const hasRequestedLocation = useRef(false)

    useEffect(() => {
        // Only request location once
        if (hasRequestedLocation.current) return

        if (!navigator.geolocation) {
            toast.error("Geolocation is not supported by your browser.")
            return
        }

        hasRequestedLocation.current = true

        const handleSuccess = (position: GeolocationPosition) => {
            setMapCenter({
                lat: position.coords.latitude,
                lng: position.coords.longitude,
            })
            setMapZoom(13)
        }

        const handleError = (error: GeolocationPositionError) => {
            console.error("Geolocation error:", error)

            if (error.code === error.PERMISSION_DENIED) {
                toast.error("Permission to access location was denied.")
            } else if (error.code === error.TIMEOUT) {
                // Try again with lower accuracy as fallback
                console.log("High accuracy timeout, trying with lower accuracy...")
                navigator.geolocation.getCurrentPosition(
                    handleSuccess,
                    (fallbackError) => {
                        console.error("Fallback geolocation error:", fallbackError)
                        toast.error("Unable to retrieve your location. Using default view.")
                    },
                    {
                        enableHighAccuracy: false, // Use network-based location
                        timeout: 15000,
                        maximumAge: 60000, // Accept cached position up to 1 minute old
                    }
                )
            } else {
                toast.error("Unable to retrieve your location.")
            }
        }

        // First attempt with high accuracy
        navigator.geolocation.getCurrentPosition(handleSuccess, handleError, {
            enableHighAccuracy: true,
            timeout: 15000, // Increased from 10s to 15s
            maximumAge: 0,
        })
    }, [])
}

export function useReverseGeolocation(lat: number, lng: number) {
    const [address, setAddress] = useState<string>('Loading address...')
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchAddress = async () => {
            setLoading(true)
            const result = await reverseGeocode(lat, lng)
            setAddress(result)
            setLoading(false)
        }

        fetchAddress()
    }, [lat, lng])

    return { address, loading }
}

export async function reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
        const response = await fetch(
            `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_API}`
        )

        if (!response.ok) {
            throw new Error('Mapbox API error')
        }

        const data = await response.json() as {
            features: { place_name: string }[];
        }
        const address = data.features?.[0]?.place_name ?? 'Address not found'

        return address
    } catch (error) {
        console.error('Error fetching address:', error)
        return 'Address unavailable'
    }
}