"use client"

import { useState } from "react"

export function useMapState() {
    const [mapZoom, setMapZoom] = useState<number>(3)
    const [mapCenter, setMapCenter] = useState<google.maps.LatLngLiteral>({
        lat: 22.54992,
        lng: 0,
    })
    const [centerChanged, setCenterChanged] = useState<google.maps.LatLngBoundsLiteral | null>(null)
    const [isCordsSearch, setIsCordsSearch] = useState<boolean>(false)
    const [searchCoordinates, setSearchCoordinates] = useState<google.maps.LatLngLiteral | undefined>()
    const [cordSearchCords, setCordSearchCords] = useState<google.maps.LatLngLiteral | undefined>()

    return {
        mapZoom,
        setMapZoom,
        mapCenter,
        setMapCenter,
        centerChanged,
        setCenterChanged,
        isCordsSearch,
        setIsCordsSearch,
        searchCoordinates,
        setSearchCoordinates,
        cordSearchCords,
        setCordSearchCords,
    }
}
