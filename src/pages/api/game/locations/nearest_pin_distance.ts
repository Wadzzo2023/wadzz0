import { NextApiRequest, NextApiResponse } from "next";
import { getToken } from "next-auth/jwt";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";
import { z } from "zod";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await EnableCors(req, res);
    const session = await getToken({ req });

    if (!session) {
        res.status(401).json({ error: "User is not authenticated" });
        return;
    }

    const data = z.object({
        lat: z.string().transform(Number),
        lng: z.string().transform(Number),
    }).safeParse(req.body);

    if (!data.success) {
        res.status(400).json({ error: data.error });
        return;
    }

    const userLocation = { lat: data.data.lat, lng: data.data.lng };

    // Fetch all locations from the database
    const locations = await db.location.findMany({
        where: { autoCollect: true }, // Optional: Filter only auto-collect locations
        select: { id: true, latitude: true, longitude: true },
    });

    // Helper function to calculate the Haversine distance
    const haversineDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const toRad = (value: number) => (value * Math.PI) / 180;

        const R = 6371; // Earth's radius in km
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    // Find the nearest location
    let nearestLocation = null;
    let minDistance = Infinity;

    for (const location of locations) {
        const distance = haversineDistance(
            userLocation.lat,
            userLocation.lng,
            location.latitude,
            location.longitude
        );

        if (distance < minDistance) {
            minDistance = distance;
            nearestLocation = location;
        }
    }

    if (!nearestLocation) {
        res.status(404).json({ error: "No locations found" });
        return;
    }

    return res.status(200).json({
        nearestLocation,
        distance: minDistance, // Distance in km
        arrowDirection: {
            latitude: nearestLocation.latitude - userLocation.lat,
            longitude: nearestLocation.longitude - userLocation.lng,
        },
    });
}
