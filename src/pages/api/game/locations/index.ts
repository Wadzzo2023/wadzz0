import type { NextApiRequest, NextApiResponse } from "next";

import { ItemPrivacy } from "@prisma/client";
import { getToken } from "next-auth/jwt";
import { z } from "zod";
import { EnableCors } from "~/server/api-cors";
import { db } from "~/server/db";
import { Location } from "~/types/game/location";
import { avaterIconUrl as abaterIconUrl } from "../brands";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import { m } from "framer-motion";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  await EnableCors(req, res);
  const token = await getToken({ req });

  if (!token) {
    res.status(401).json({
      error: "User is not authenticated",
    });
    return;
  }
  const data = z.object({ filterId: z.string() }).safeParse(req.query); // Use req.query instead of req.body

  if (!data.success) {
    console.log("data.error", data.error);
    return res.status(400).json({
      error: data.error,
    });
  }

  const userId = token.sub;

  if (!userId) {
    return res.status(401).json({
      error: "User is not authenticated",
    });
  }

  const userAcc = await StellarAccount.create(userId);

  let creatorsId: string[] | undefined = undefined;
  if (data.data.filterId === "1") {
    const getAllFollowedBrand = await db.creator.findMany({
      where: {
        followers: {
          some: {
            userId: userId,
          },
        },
      },
      include: {
        pageAsset: true,
        subscriptions: true,
      },
    });

    // type Creator = {
    //   id: string;
    //   pageAsset: {
    //     code: string;
    //     issuer: string;
    //   };
    // };

    // const creators: Creator[] = getAllFollowedBrand
    //   .map((brand) => {
    //     if (brand.pageAsset) {
    //       const { code, issuer } = brand.pageAsset;

    //       return {
    //         id: brand.id,
    //         pageAsset: {
    //           code,
    //           issuer,
    //         },
    //       };
    //     }
    //     return null;
    //   })
    //   .filter((creator): creator is Creator => creator !== null);

    creatorsId = getAllFollowedBrand.map((brand) => brand.id);
  }

  // now i am extracting this brands pins

  async function pinsForCreators(creatorsId?: string[]) {
    const extraFilter = {
      privacy: { in: [ItemPrivacy.PUBLIC] },
    } as {
      creatorId?: { in: string[] };
      privacy: { in: ItemPrivacy[] };
    };

    if (creatorsId) {
      extraFilter.creatorId = { in: creatorsId };
      extraFilter.privacy = { in: [ItemPrivacy.PRIVATE, ItemPrivacy.TIER, ItemPrivacy.PUBLIC] };
    }

    const locationGroup = await db.locationGroup.findMany({
      where: {
        ...extraFilter,
        approved: { equals: true },
        endDate: { gte: new Date() },
        subscriptionId: { equals: null },
        remaining: { gt: 0 },
      },
      include: {
        locations: {
          include: {
            consumers: {
              select: {
                userId: true,
              },
            },
          },
        },
        Subscription: true,
        creator: {
          include: {
            pageAsset: {
              select: {
                code: true,
                issuer: true,
              },
            },
          },
        },
      },
    });
    console.log("locationGroup", locationGroup);
    const pins = locationGroup
      .flatMap((group) => {
        const multiPin = group.multiPin;
        const hasConsumedOne = group.locations.some((location) =>
          location.consumers.some((consumer) => consumer.userId === userId),
        );
        if (group.privacy === ItemPrivacy.TIER) {
          const creatorPageAsset = group.creator.pageAsset;
          const subscription = group.Subscription;

          if (creatorPageAsset && subscription) {
            const bal = userAcc.getTokenBalance(
              creatorPageAsset.code,
              creatorPageAsset.issuer,
            );
            if (bal >= subscription.price) {
              if (multiPin) {
                return group.locations.map((location) => ({
                  ...location,
                  ...group,
                  id: location.id,
                  collected: location.consumers.some(
                    (c) => c.userId === userId,
                  ),
                }));
              } else {
                return group.locations.map((location) => ({
                  ...location,
                  ...group,
                  id: location.id,
                  collected: hasConsumedOne,
                }));
              }
            }
          }
        } else {
          if (multiPin) {
            return group.locations.map((location) => ({
              ...location,
              ...group,
              id: location.id,
              collected: location.consumers.some((c) => c.userId === userId),
            }));
          } else {
            return group.locations.map((location) => ({
              ...location,
              ...group,
              id: location.id,
              collected: hasConsumedOne,
            }));
          }
        }
      })
      .filter((location) => location !== undefined);

    const locations: Location[] = pins.map((location) => {
      return {
        id: location.id,
        lat: location.latitude,
        lng: location.longitude,
        title: location.title,
        description: location.description ?? "No description provided",
        brand_name: location.creator.name,
        url: location.link ?? "https://wadzzo.com/",
        image_url:
          location.image ?? location.creator.profileUrl ?? WadzzoIconURL,
        collected: location.collected,
        collection_limit_remaining: location.remaining,
        auto_collect: location.autoCollect,
        brand_image_url: location.creator.profileUrl ?? abaterIconUrl,
        brand_id: location.creatorId,
        public: true,
      };
    });

    return locations;
  }

  const locations = await pinsForCreators(creatorsId);

  res.status(200).json({ locations });
}

export const WadzzoIconURL = "https://app.wadzzo.com/images/loading.png";
