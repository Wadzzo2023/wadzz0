"use client";

import { memo } from "react";
import { MapPin, Users, Clock } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Badge } from "~/components/shadcn/ui/badge";
import { Avatar } from "~/components/shadcn/ui/avatar";
import { useNearbyPinsStore } from "~/lib/state/nearby-pin-store";
import { format } from "date-fns";
import type { Location, LocationGroup } from "@prisma/client";

type Pin = Location & {
  locationGroup:
    | (LocationGroup & {
        creator: { profileUrl: string | null };
      })
    | null;
  _count: {
    consumers: number;
  };
};

interface NearbyLocationsPanelProps {
  onSelectPlace: (coords: { lat: number; lng: number }) => void;
}

export const NearbyLocationsPanel = memo(function NearbyLocationsPanel({
  onSelectPlace,
}: NearbyLocationsPanelProps) {
  const { nearbyPins } = useNearbyPinsStore();

  return (
    <div className="pointer-events-none  absolute right-6 top-64 hidden max-h-[500px] w-80 items-start justify-center md:flex">
      <Card className="pointer-events-auto max-h-full w-full overflow-hidden rounded-3xl border border-white/30 bg-white/95 shadow-2xl backdrop-blur-md">
        <CardHeader className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 pb-4">
          <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <MapPin className="h-5 w-5 text-blue-600" />
            Nearby Locations
            <Badge variant="secondary" className="ml-auto">
              {nearbyPins.length}
            </Badge>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0">
          <div className="max-h-[300px] overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-gray-300">
            {nearbyPins.length <= 0 ? (
              <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <MapPin className="h-8 w-8 text-gray-400" />
                </div>
                <p className="font-medium text-gray-500">No nearby locations</p>
                <p className="mt-1 text-sm text-gray-400">
                  Try zooming out or moving the map
                </p>
              </div>
            ) : (
              <div className="space-y-1 p-4">
                {nearbyPins?.map((pin, index) => (
                  <div
                    onClick={() => {
                      onSelectPlace({
                        lat: pin.latitude,
                        lng: pin.longitude,
                      });
                    }}
                    key={pin.id}
                    className="group flex transform cursor-pointer items-start gap-3 rounded-2xl border border-gray-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm transition-all duration-300 hover:scale-[1.02] hover:bg-white hover:shadow-lg"
                    style={{
                      animationDelay: `${index * 50}ms`,
                      animation: "slideInRight 0.3s ease-out forwards",
                    }}
                  >
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg transition-transform duration-200 group-hover:scale-110">
                      <MapPin className="h-5 w-5 text-white" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <h3 className="truncate font-semibold text-gray-900 transition-colors duration-200 group-hover:text-blue-600">
                        {pin.locationGroup?.title ?? "Untitled Location"}
                      </h3>

                      <div className="mt-2 flex items-center gap-2">
                        <Avatar className="h-6 w-6 shadow-sm ring-2 ring-white">
                          <img
                            width={24}
                            height={24}
                            src={
                              pin.locationGroup?.image ??
                              pin.locationGroup?.creator.profileUrl ??
                              "/default-avatar.png"
                            }
                            alt="Creator"
                            className="rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.src = "/images/logo.png";
                            }}
                          />
                        </Avatar>
                        <Badge
                          variant="secondary"
                          className="border-blue-200 bg-blue-50 text-xs text-blue-700"
                        >
                          <Users className="mr-1 h-3 w-3" />
                          {pin._count.consumers}
                        </Badge>
                      </div>

                      {pin.locationGroup?.endDate && (
                        <div className="mt-2 flex items-center gap-1 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          <span>
                            Ends{" "}
                            {format(
                              new Date(pin.locationGroup.endDate),
                              "MMM dd, hh:mm a",
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
});
