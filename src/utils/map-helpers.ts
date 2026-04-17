import { Target, Calendar, Star, MapPin } from "lucide-react"
import { PinType } from "@prisma/client" // Import PinType enum

// Helper to get the appropriate icon for a pin type
export const getPinIcon = (type: PinType) => {
    // Use PinType enum
    switch (type) {
        case PinType.BOUNTY:
            return Target
        case PinType.EVENT:
            return Calendar
        case PinType.EXPERIENCE:
            return Star
        case PinType.LAUNCH:
            return MapPin // Assuming 'launch' uses MapPin or another specific icon
        case PinType.OTHER:
        default:
            return MapPin
    }
}

// Helper to get status color (if needed for badges, etc.)
export const getStatusColor = (status: string) => {
    switch (status) {
        case "live":
            return "bg-red-500"
        case "trending":
            return "bg-purple-500"
        case "hot":
            return "bg-orange-500"
        case "new":
            return "bg-green-500"
        default:
            return "bg-gray-500"
    }
}

// Helper to get status label (if needed for badges, etc.)
export const getStatusLabel = (status: string) => {
    switch (status) {
        case "ending_soon":
            return "Ending Soon"
        default:
            return status.charAt(0).toUpperCase() + status.slice(1)
    }
}

// Helper to calculate days left (if needed for bounties, etc.)
export const getDaysLeft = (deadline: string) => {
    const today = new Date()
    const deadlineDate = new Date(deadline)
    const diffTime = deadlineDate.getTime() - today.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
}
