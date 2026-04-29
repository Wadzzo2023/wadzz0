import { useGeolocation, useReverseGeolocation } from "~/hooks/use-geolocation";
import { Badge } from "../shadcn/ui/badge";

interface LocationAddressDisplayProps {
    latitude: number;
    longitude: number;
}

export function LocationAddressDisplay({
    latitude,
    longitude,
}: LocationAddressDisplayProps) {
    const { address, loading } = useReverseGeolocation(latitude, longitude);
    return (
        <Badge>
            <div className="flex items-center justify-between">
                <span className="text-sm font-bold truncate">{loading ? "Loading..." : address}</span>
            </div>
        </Badge>
    )
}