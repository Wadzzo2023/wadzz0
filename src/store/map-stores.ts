import { create } from "zustand"
import type { Location, LocationGroup, PinType } from "@prisma/client"

/// Define Pin type for clarity and consistency with Prisma schema
type Pin = {
    locationGroup:
    | (LocationGroup & {
        creator: { profileUrl: string | null }
    })
    | null
    _count: {
        consumers: number
    }
} & Location

// Re-defining ModalData here as use-modal-store.ts is being removed
export type ModalData = {
    long: number
    lat: number
    pinId: string
    mapTitle: string
    image: string
    mapDescription: string
    endDate: Date
    startDate: Date
    pinCollectionLimit: number
    pinRemainingLimit: number
    multiPin: boolean
    subscriptionId: string
    autoCollect: boolean
    pageAsset: boolean
    privacy: string
    pinNumber: number
    link: string
    assetId: number
    type?: PinType // Added type to ModalData
}

interface NearbyPinsState {
    nearbyPins: Pin[]
    // Separate pin states for different contexts
    myPins: Pin[] // Creator's own pins
    adminPins: Pin[] // Admin-selected creator's pins
    allPins: Pin[] // Legacy - for nearby panel filtering

    setMyPins: (pins: Pin[]) => void
    setAdminPins: (pins: Pin[]) => void
    setAllPins: (pins: Pin[]) => void
    setNearbyPins: (pins: Pin[]) => void
    filterNearbyPins: (center: google.maps.LatLngBoundsLiteral, source?: "my" | "admin") => void
    clearAdminPins: () => void
}

export const useNearbyPinsStore = create<NearbyPinsState>((set, get) => ({
    nearbyPins: [],
    myPins: [],
    adminPins: [],
    allPins: [], // Keep for backward compatibility

    setNearbyPins: (pins: Pin[]) => set({ nearbyPins: pins }),

    setMyPins: (pins: Pin[]) => {
        const currentPins = get().myPins
        if (
            pins.length !== currentPins.length ||
            pins.map((pin) => pin.id).join(",") !== currentPins.map((pin) => pin.id).join(",")
        ) {
            set({ myPins: pins, allPins: pins })
        }
    },

    setAdminPins: (pins: Pin[]) => {
        const currentPins = get().adminPins
        if (
            pins.length !== currentPins.length ||
            pins.map((pin) => pin.id).join(",") !== currentPins.map((pin) => pin.id).join(",")
        ) {
            set({ adminPins: pins, allPins: pins })
        }
    },

    setAllPins: (pins: Pin[]) => {
        const currentPins = get().allPins
        if (
            pins.length !== currentPins.length ||
            pins.map((pin) => pin.id).join(",") !== currentPins.map((pin) => pin.id).join(",")
        ) {
            set({ allPins: pins })
        }
    },

    filterNearbyPins: (center: google.maps.LatLngBoundsLiteral, source?: "my" | "admin") => {
        const { myPins, adminPins, allPins, nearbyPins } = get()
        // Use the appropriate source pins for filtering
        const sourcePins = source === "my" ? myPins : source === "admin" ? adminPins : allPins
        const filtered = sourcePins.filter(
            (pin) =>
                pin.latitude >= center.south &&
                pin.latitude <= center.north &&
                pin.longitude >= center.west &&
                pin.longitude <= center.east,
        )
        if (
            filtered.length !== nearbyPins.length ||
            filtered.map((pin) => pin.id).join(",") !== nearbyPins.map((pin) => pin.id).join(",")
        ) {
            set({ nearbyPins: filtered })
        }
    },

    clearAdminPins: () => set({ adminPins: [], nearbyPins: [] }),
}))

export type IPin = {
    title?: string
    lat: number
    lng: number
    description?: string | undefined
    startDate?: Date
    endDate?: Date
    autoCollect: boolean
    pinCollectionLimit?: number
    tier: number | undefined | null
    url?: string | undefined | null
    image?: string | undefined | null
    token?: number
    type?: PinType
    multiPin?: boolean
    pinNumber?: number
    radius?: number
}

interface IMapInteractionStore {
    // Create Pin Modal State
    isOpenCreatePin: boolean
    openCreatePinModal: () => void
    closeCreatePinModal: () => void
    manual: boolean
    setManual: (value: boolean) => void
    position: google.maps.LatLngLiteral | undefined
    setPosition: (pos: google.maps.LatLngLiteral | undefined) => void
    prevData?: IPin
    setPrevData: (value?: IPin) => void
    duplicate: boolean
    setDuplicate: (value: boolean) => void

    // Pin Detail Modal State
    selectedPinForDetail: Pin | null
    openPinDetailModal: (pin: Pin) => void
    closePinDetailModal: () => void

    // Pin Copy/Cut State (moved from useModal)
    isPinCopied: boolean
    isPinCut: boolean
    setPinCopied: (value: boolean, pin?: Pin) => void // Add optional pin parameter
    setPinCut: (value: boolean, pin?: Pin) => void // Add optional pin parameter
    setIsAutoCollect: (value: boolean) => void // This was on useModal, but seems map-specific
    copiedPinData: Pin | null // Renamed from modalData to be more specific
}

export const useMapInteractionStore = create<IMapInteractionStore>((set) => ({
    // Create Pin Modal
    isOpenCreatePin: false,
    openCreatePinModal: () => set({ isOpenCreatePin: true }),
    closeCreatePinModal: () => set({ isOpenCreatePin: false, prevData: undefined, manual: false, duplicate: false }),
    manual: false,
    setManual: (value) => set({ manual: value }),
    position: undefined,
    setPosition: (pos) => set({ position: pos }),
    prevData: undefined,
    setPrevData: (value) => set({ prevData: value }),
    duplicate: false,
    setDuplicate: (value) => set({ duplicate: value }),

    // Pin Detail Modal
    selectedPinForDetail: null,
    openPinDetailModal: (pin) => set({ selectedPinForDetail: pin }),
    closePinDetailModal: () =>
        set((state) => ({
            selectedPinForDetail: state.isPinCut || state.isPinCopied ? state.selectedPinForDetail : null,
        })),
    // Pin Copy/Cut State
    isPinCopied: false,
    isPinCut: false,
    setPinCopied: (value, pin) => set({ isPinCopied: value, copiedPinData: value ? pin : null }),
    setPinCut: (value, pin) => set({ isPinCut: value, copiedPinData: value ? pin : null }),
    setIsAutoCollect: (value) =>
        set((state) => ({
            copiedPinData: state.copiedPinData ? { ...state.copiedPinData, autoCollect: value } : null,
        })),
    copiedPinData: null, // Initialize copiedPinData
}))
