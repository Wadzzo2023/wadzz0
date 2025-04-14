"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import Map, { Marker } from "react-map-gl";
import {
  ArrowLeft,
  ExternalLink,
  MapPin,
  Hash,
  HandIcon,
  ViewIcon,
} from "lucide-react";

import { Button } from "~/components/shadcn/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import { Avatar, AvatarImage } from "~/components/shadcn/ui/avatar";
import { Badge } from "~/components/shadcn/ui/badge";
import { useCollection } from "~/lib/state/play/useCollection";
import { useNearByPin } from "~/lib/state/play/useNearbyPin";
import { useModal } from "~/lib/state/play/useModal";
import { BASE_URL } from "~/lib/common";

const SingleCollectionItem = () => {
  const { data } = useCollection();
  const { setData } = useNearByPin();
  const { onOpen } = useModal();
  const router = useRouter();

  if (!data.collections) return null;

  return (
    <div className="flex h-screen flex-col overflow-y-auto  p-2  pb-16">
      <div className="mb-4 flex items-center rounded-b-2xl bg-[#38C02B] p-4">
        <Button variant="ghost" onClick={() => router.back()} className="mr-2">
          <ArrowLeft className="h-6 w-6" />
        </Button>
        <h1 className="text-2xl font-bold">{data.collections.title}</h1>
      </div>

      <Card className="mb-8">
        <CardHeader className="p-0">
          <div className="relative h-64 w-full">
            <Image
              src={data.collections.image_url}
              alt={data.collections.title}
              layout="fill"
              objectFit="cover"
              className="rounded-t-lg"
            />
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="mb-4 flex items-center">
            <Avatar className="mr-4 h-12 w-12">
              <AvatarImage
                src={data.collections.brand_image_url}
                alt={data.collections.brand_name}
              />
            </Avatar>
            <CardTitle>{data.collections.brand_name}</CardTitle>
          </div>

          <p className="mb-4 text-gray-600">{data.collections.description}</p>

          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="secondary" className="flex items-center">
              <MapPin className="mr-1 h-4 w-4" />
              {data.collections.lat.toFixed(4)},{" "}
              {data.collections.lng.toFixed(4)}
            </Badge>
            <Badge variant="secondary" className="flex items-center">
              <Hash className="mr-1 h-4 w-4" />
              ID: {data.collections.id}
            </Badge>
          </div>

          <div className="mb-4 h-48">
            <Map
              mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_API}
              initialViewState={{
                latitude: data.collections.lat,
                longitude: data.collections.lng,
                zoom: 14,
              }}
              style={{ width: "100%", height: "100%" }}
              mapStyle="mapbox://styles/mapbox/streets-v9"
            >
              <Marker
                latitude={data.collections.lat}
                longitude={data.collections.lng}
                onClick={() =>
                  onOpen("LocationInformation", {
                    Collection: data.collections,
                  })
                }
              >
                <Image
                  src={data.collections.brand_image_url}
                  alt="Marker"
                  width={30}
                  height={30}
                  className="rounded-full"
                />
              </Marker>
            </Map>
          </div>

          <div className="flex justify-between">
            <Button asChild>
              <Link
                href={data?.collections?.url ?? "https://www.app.wadzoo.com"}
                target="_blank"
                rel="noopener noreferrer"
              >
                <ExternalLink className="mr-2 h-4 w-4" />
                Visit Website
              </Link>
            </Button>
            <Button
              onClick={() => {
                setData({
                  nearbyPins: data.collections ? [data.collections] : [],
                  singleAR: true,
                });
                // router.push("/ARScreen")
              }}
            >
              <ViewIcon className="mr-2 h-4 w-4" />
              View in AR
            </Button>
          </div>
          <CardFooter className="items-center justify-center p-2">
            <Button
              className="flex w-1/3 items-center justify-center"
              onClick={() =>
                window.open(new URL("maps/pins/my", BASE_URL).href, "_blank")
              }
            >
              <HandIcon className="mr-2 h-4 w-4" />
              Claim
            </Button>
          </CardFooter>
        </CardContent>
      </Card>
    </div>
  );
};

export default SingleCollectionItem;
