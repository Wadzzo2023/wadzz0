"use client"

import { useEffect } from "react"
import { useNearbyPinsStore } from "~/store/map-stores"
import { api } from "~/utils/api"

export function usePinsData(showExpired: boolean) {
    const { setAllPins } = useNearbyPinsStore()
    const pinsQuery = api.maps.pin.getMyPins.useQuery({ showExpired })

    useEffect(() => {
        if (pinsQuery.data) {
            setAllPins(pinsQuery.data)
        }
    }, [pinsQuery.data, setAllPins])

    return { pinsQuery }
}
