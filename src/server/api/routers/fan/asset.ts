import { ItemPrivacy } from "@prisma/client";
import { Horizon } from "@stellar/stellar-sdk";
import { TRPCError } from "@trpc/server";
import { storage } from "firebase-admin";
import { z } from "zod";
import { updateAssetFormShema } from "~/components/fan/shop/asset_view_modal";
import { NftFormSchema, SellPageAssetSchema } from "~/components/marketplace/nft_create";
import { STELLAR_URL } from "~/lib/stellar/constant";
import { StellarAccount } from "~/lib/stellar/marketplace/test/Account";
import { GetPageAssetBuyXDRInPlatform, GetPageAssetBuyXDRInXLM } from "~/lib/stellar/marketplace/trx/page-asset-sell";

import {
  createTRPCRouter,
  creatorProcedure,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";

export const shopRouter = createTRPCRouter({
  createAsset: protectedProcedure
    .input(NftFormSchema)
    .mutation(async ({ ctx, input }) => {
      const {
        code,
        coverImgUrl,
        description,

        mediaType,
        mediaUrl,
        name,
        price,
        issuer,
        limit,
        tier,
        priceUSD,
        isAdmin,
      } = input;

      if (issuer) {
        const userId = ctx.session.user.id;
        const creatorId = isAdmin ? undefined : userId; // for admin creator and placer id is undefined
        const nftType = isAdmin ? "ADMIN" : "FAN";

        let tierId: number | undefined;
        let privacy: ItemPrivacy = ItemPrivacy.PUBLIC;

        if (!tier) {
          privacy = ItemPrivacy.PUBLIC;
        } else if (tier == "public") {
          privacy = ItemPrivacy.PUBLIC;
        } else if (tier == "private") {
          privacy = ItemPrivacy.PRIVATE;
        } else {
          tierId = Number(tier);
          privacy = ItemPrivacy.TIER;
        }

        // console.log("mediaType", mediaType, mediaUrl);

        return await ctx.db.asset.create({
          data: {
            code,
            issuer: issuer.publicKey,
            issuerPrivate: issuer.secretKey,
            name,
            mediaType,
            mediaUrl,
            marketItems: {
              create: {
                price,
                priceUSD,
                placerId: creatorId,
                type: nftType,
                privacy: privacy,
              },
            },
            description,
            thumbnail: coverImgUrl,
            creatorId,
            limit,
            tierId,
            privacy: privacy,
          },
        });
      }
    }),

  updateAsset: protectedProcedure
    .input(updateAssetFormShema)
    .mutation(async ({ ctx, input }) => {
      const { assetId, price, priceUSD } = input;
      return await ctx.db.marketAsset.update({
        where: { id: assetId },
        data: { price, priceUSD },
      });
    }),

  deleteAsset: protectedProcedure // fix the logic
    .input(z.number())
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.asset.delete({
        where: { id: input },
      });
    }),

  // search: publicProcedure
  //   .input(
  //     z.object({
  //       limit: z.number(),
  //       // cursor is a reference to the last item in the previous batch
  //       // it's used to fetch the next batch
  //       cursor: z.number().nullish(),
  //       skip: z.number().optional(),
  //       searchInput: z.string(),
  //     }),
  //   )
  //   .query(async ({ input, ctx }) => {
  //     const { limit, skip, cursor, searchInput } = input;
  //     const items = await ctx.db.shopAsset.findMany({
  //       take: limit + 1,
  //       skip: skip,
  //       cursor: cursor ? { id: cursor } : undefined,
  //       where: {
  //         OR: [
  //           {
  //             name: {
  //               contains: searchInput,
  //               mode: "insensitive",
  //             },
  //           },
  //           {
  //             description: {
  //               contains: searchInput,
  //               mode: "insensitive",
  //             },
  //           },
  //           {
  //             asset: {
  //               code: {
  //                 contains: searchInput,
  //                 mode: "insensitive",
  //               },
  //               issuer: {
  //                 contains: searchInput,
  //                 mode: "insensitive",
  //               },
  //             },
  //           },
  //         ],
  //       },
  //       include: { asset: { select: { code: true, issuer: true } } },
  //     });

  //     let nextCursor: typeof cursor | undefined = undefined;
  //     if (items.length > limit) {
  //       const nextItem = items.pop(); // return the last item from the array
  //       nextCursor = nextItem?.id;
  //     }

  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),

  buyAsset: protectedProcedure
    .input(z.object({ shopAssetId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { shopAssetId } = input;
      // return await ctx.db..create({
      //   data: {
      //     userId: ctx.session.user.id,
      //     shopAssetId: shopAssetId,
      //   },
      // });
    }),

  // getAllPopularAsset: publicProcedure
  //   .input(
  //     z.object({
  //       limit: z.number(),
  //       // cursor is a reference to the last item in the previous batch
  //       // it's used to fetch the next batch
  //       cursor: z.number().nullish(),
  //       skip: z.number().optional(),
  //     }),
  //   )
  //   .query(async ({ input, ctx }) => {
  //     const { limit, skip, cursor } = input;
  //     const items = await ctx.db.shopAsset.findMany({
  //       take: limit + 1,
  //       skip: skip,
  //       cursor: cursor ? { id: cursor } : undefined,
  //       orderBy: { UserShopAsset: { _count: "desc" } },
  //       include: { asset: { select: { code: true, issuer: true } } },
  //     });

  //     let nextCursor: typeof cursor | undefined = undefined;
  //     if (items.length > limit) {
  //       const nextItem = items.pop(); // return the last item from the array
  //       nextCursor = nextItem?.id;
  //     }

  //     return {
  //       items,
  //       nextCursor,
  //     };
  //   }),

  // getUserShopAsset: protectedProcedure.query(async ({ ctx }) => {
  //   return await ctx.db.userShopAsset.findMany({
  //     where: { userId: ctx.session.user.id },
  //     include: {
  //       shopAsset: {
  //         include: { asset: { select: { code: true, issuer: true } } },
  //       },
  //     },
  //   });
  // }),

  myAssets: creatorProcedure.query(async ({ ctx }) => {
    const shopAsset = await ctx.db.asset.findMany({
      where: { creatorId: ctx.session.user.id },
      select: { code: true, issuer: true, thumbnail: true, id: true },
    });

    const pageAsset = await ctx.db.creatorPageAsset.findUnique({
      where: { creatorId: ctx.session.user.id },
      select: { code: true, issuer: true, creatorId: true, thumbnail: true },
    });

    let customPageAsset = {
      code: "",
      issuer: "",
      creatorId: ctx.session.user.id,
      thumbnail: "",
    };


    if (!pageAsset) {
      const customPageAssetCodeIssuer = await ctx.db.creator.findUnique({
        where: { id: ctx.session.user.id },
        select: { customPageAssetCodeIssuer: true },
      });
      if (customPageAssetCodeIssuer) {
        if (customPageAssetCodeIssuer.customPageAssetCodeIssuer) {
          const [code, issuer] = customPageAssetCodeIssuer.customPageAssetCodeIssuer.split("-");
          if (code && issuer) {
            customPageAsset = {
              code,
              issuer,
              creatorId: ctx.session.user.id,
              thumbnail: "",
            };
          }
        }
      }

    }

    return { shopAsset, pageAsset: pageAsset ?? customPageAsset };

  }),
  getCreatorPageAsset: creatorProcedure.input(z.object({
    creatorId: z.string(),

  })).query(async ({ ctx, input }) => {
    const { creatorId } = input;
    const creator = await ctx.db.creator.findUnique({
      where: { id: creatorId },
      select: { customPageAssetCodeIssuer: true },
    });
    if (!creator) {
      return null;
    }
    const shopAsset = await ctx.db.asset.findMany({
      where: { creatorId: creatorId },
      select: { code: true, issuer: true, thumbnail: true, id: true },
    });

    const pageAsset = await ctx.db.creatorPageAsset.findUnique({
      where: { creatorId: creatorId },
      select: { code: true, issuer: true, creatorId: true, thumbnail: true },
    });

    let customPageAsset = {
      code: "",
      issuer: "",
      creatorId: creatorId,
      thumbnail: "",
    };


    if (!pageAsset) {
      const customPageAssetCodeIssuer = await ctx.db.creator.findUnique({
        where: { id: creatorId },
        select: { customPageAssetCodeIssuer: true },
      });
      if (customPageAssetCodeIssuer) {
        if (customPageAssetCodeIssuer.customPageAssetCodeIssuer) {
          const [code, issuer] = customPageAssetCodeIssuer.customPageAssetCodeIssuer.split("-");
          if (code && issuer) {
            customPageAsset = {
              code,
              issuer,
              creatorId: creatorId,
              thumbnail: "",
            };
          }
        }
      }

    }

    return { shopAsset, pageAsset: pageAsset ?? customPageAsset };

  }),
  getCreatorAsset: protectedProcedure
    .input(z.object({ creatorId: z.string() }))
    .query(async ({ input, ctx }) => {
      const { creatorId } = input;
      return await ctx.db.creatorPageAsset.findUnique({
        where: { creatorId: creatorId },
        select: { code: true, issuer: true },
      });
    }),

  getAssetBalance: protectedProcedure
    .input(z.object({
      code: z.string(), issuer: z.string(),
      creatorId: z.string()
    }))
    .mutation(async ({ input, ctx }) => {
      const { code, issuer } = input;
      const creator = await ctx.db.creator.findUnique({
        where: { id: input.creatorId },
        select: { storagePub: true },
      });

      if (!creator) {
        return 0;
      }

      console.log("creator", creator);
      const server = new Horizon.Server(STELLAR_URL);
      const account = await server.loadAccount(creator.storagePub);
      console.log("Code, issuer", code, issuer);
      const tokens = (await StellarAccount.create(creator.storagePub)).getTokenBalance(code, issuer);
      console.log("Balances.............:", tokens);

      if (tokens) {
        return tokens;
      }
      return 0;


    }),
  sellPageAsset: creatorProcedure
    .input(SellPageAssetSchema).mutation(async ({ ctx, input }) => {
      const { title, description, amountToSell, price, priceUSD, priceXLM } = input;
      const creatorId = ctx.session.user.id;

      return await ctx.db.sellPageAsset.create({
        data: {
          title: title ?? "",
          description,
          amountToSell,
          price,
          priceUSD,
          priceXLM,
          placerId: creatorId,
        },
      });
    }
    ),
  getMyAssets: creatorProcedure.query(async ({ ctx }) => {
    const creatorId = ctx.session.user.id;
    return await ctx.db.sellPageAsset.findMany({
      where: { placerId: creatorId },
    });
  }),
  deleteSoldPageAsset: creatorProcedure.input(z.object({
    id: z.number({
      required_error: "Sell Pageasset id must be needed"
    })
  })).mutation(async ({ ctx, input }) => {
    const findSoldPageAsset = await ctx.db.sellPageAsset.findFirst({
      where: {
        id: input.id
      }
    })
    if (!findSoldPageAsset) {
      throw new Error("Sell Pageasset not found");
    }
    return await ctx.db.sellPageAsset.delete({
      where: {
        id: input.id
      }
    })
  }),
  updateSellPageAsset: creatorProcedure
    .input(z.object({
      id: z.number(),
      title: z.string().optional(),
      description: z.string().optional(),
      amountToSell: z.number().optional(),
      price: z.number().optional(),
      priceUSD: z.number().optional(),
      priceXLM: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const { title, description, amountToSell, price, priceUSD, priceXLM } = input;
      const creatorId = ctx.session.user.id;

      return await ctx.db.sellPageAsset.update({
        where: { id: input.id },
        data: {
          title,
          description,
          amountToSell,
          price,
          priceUSD,
          priceXLM,
          placerId: creatorId,
        },
      });
    }),
  getAllAvailable: protectedProcedure
    .query(async ({ ctx }) => {
      return ctx.db.sellPageAsset.findMany({
        where: {
          isSold: false,
        },
        include: {
          placer: {
            select: {
              id: true,
              name: true,
              profileUrl: true,
              customPageAssetCodeIssuer: true,
              pageAsset: {
                select: {
                  code: true,
                  issuer: true,
                  thumbnail: true,
                },
              }
            },
          },
        },
        orderBy: {
          placedAt: 'desc',
        },
      });
    }),

  buyWithWadzzo: protectedProcedure
    .input(z.object({
      assetId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.sellPageAsset.findUnique({
        where: { id: input.assetId },
        include: { placer: true },
      });

      if (!asset || asset.isSold) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Asset not found or already sold',
        });
      }

      if (asset.placerId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot buy your own asset',
        });
      }

      // Add your payment logic here
      // Check user balance, process payment, transfer asset, etc.

      // Update asset as sold
      await ctx.db.sellPageAsset.update({
        where: { id: input.assetId },
        data: {
          isSold: true,
          soldAt: new Date(),
        },
      });

      return { success: true };
    }),

  buyWithXLM: protectedProcedure
    .input(z.object({
      assetId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const asset = await ctx.db.sellPageAsset.findUnique({
        where: { id: input.assetId },
        include: { placer: true },
      });

      if (!asset || asset.isSold) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Asset not found or already sold',
        });
      }

      if (asset.priceXLM <= 0) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'XLM payment not available for this asset',
        });
      }

      if (asset.placerId === ctx.session.user.id) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'Cannot buy your own asset',
        });
      }

      // Add your XLM payment logic here
      // Process Stellar transaction, verify payment, transfer asset, etc.

      // Update asset as sold
      await ctx.db.sellPageAsset.update({
        where: { id: input.assetId },
        data: {
          isSold: true,
          soldAt: new Date(),
        },
      });

      return { success: true };
    }),
  getXDR: protectedProcedure.input(z.object({
    assetId: z.number(),
    paymentOption: z.enum(['wadzzo', 'xlm']),
  })).mutation(async ({ ctx, input }) => {
    const asset = await ctx.db.sellPageAsset.findUnique({
      where: { id: input.assetId },
      include: {
        placer: {
          select: {
            customPageAssetCodeIssuer: true,
            pageAsset: true,
            storageSecret: true,
          }
        }
      },
    });

    if (!asset || asset.isSold) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Asset not found or already sold',
      });
    }

    if (!asset.placer) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Placer does not have a  page asset code issuer',
      });
    }
    let code = "";
    let issuer = "";
    if (asset.placer.customPageAssetCodeIssuer) {
      const [assetCode, assetIssuer] = asset.placer.customPageAssetCodeIssuer.split("-");
      if (assetCode && assetIssuer) {
        code = assetCode;
        issuer = assetIssuer;
      }
    }
    if (asset.placer.pageAsset) {
      if (asset.placer.pageAsset.code && asset.placer.pageAsset.issuer) {
        code = asset.placer.pageAsset.code;
        issuer = asset.placer.pageAsset.issuer;
      }
    }

    if (!code || !issuer) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid custom page asset code issuer format',
      });
    }

    // Generate XDR for the asset transfer
    if (input.paymentOption === 'wadzzo') {

      return await GetPageAssetBuyXDRInPlatform({
        code,
        issuer,
        amountToSell: asset.amountToSell,
        price: asset.price,
        storageSecret: asset.placer.storageSecret,
        userId: ctx.session.user.id,
      });
    }
    else if (input.paymentOption === 'xlm') {

      return await GetPageAssetBuyXDRInXLM({
        code,
        issuer,
        amountToSell: asset.amountToSell,
        priceXLM: asset.priceXLM,
        storageSecret: asset.placer.storageSecret,
        userId: ctx.session.user.id,
      });
    } else {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Invalid payment option',
      });
    }
  }),

}); 
