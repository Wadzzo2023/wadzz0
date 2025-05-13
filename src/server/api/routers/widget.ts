/* eslint-disable  */
import { ItemPrivacy } from "@prisma/client";
import OpenAI from "openai";
import { z } from "zod";
import { env } from "~/env";
import {
  createTRPCRouter,
  publicProcedure,
  protectedProcedure,
} from "~/server/api/trpc";
import { Location } from "~/types/game/location";
import { findNearestLocation } from "~/utils/geo";

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

export const widgetRouter = createTRPCRouter({
  generateDescriptions: protectedProcedure
    .input(
      z.object({
        pinId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // First, find the location to get its coordinates
      const location = await ctx.db.location.findUnique({
        where: {
          id: input.pinId,
        },
      });

      if (!location) {
        throw new Error("Location not found");
      }

      // Check if user is authorized to generate descriptions for this pin
      const locationGroup = await ctx.db.locationGroup.findFirst({
        where: {
          locations: {
            some: {
              id: input.pinId,
            },
          },
          creatorId: ctx.session.user.id,
        },
      });

      if (!locationGroup) {
        throw new Error(
          "You are not authorized to generate descriptions for this location",
        );
      }

      // Get the URL from the location group or create a Google Maps URL if not available
      const locationUrl = locationGroup.link;

      if (!locationUrl) {
        throw new Error("Location URL not found");
      }

      try {
        // Use OpenAI to generate descriptions
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: `You are a creative assistant specializing in location-based marketing. 
                        Your task is to:
                        1. Crawl and analyze the content from this URL: ${locationUrl}
                        2. Create a comprehensive 2-3 line summary of what you find at this location (business, attraction, etc.)
                        3. Based on this summary, generate 5 engaging and varied descriptions (under 100 characters each)
                        
                        Each description should highlight different aspects such as:
                        - The atmosphere and vibe of the place
                        - Notable landmarks or surroundings
                        - Unique selling points or features
                        - Customer experience or benefits
                        - Special offerings or promotions
                        
                        Format your response as a JSON object with:
                        - A "summary" field containing your 2-3 line detailed summary
                        - A "descriptions" array with your 5 short marketing-friendly descriptions
                        
                        Example: { 
                          "summary": "A detailed 2-3 line summary about the location based on the URL content...",
                          "descriptions": ["Description 1", "Description 2", "Description 3", "Description 4", "Description 5"] 
                        }`,
            },
          ],
          temperature: 0.8,
          response_format: { type: "json_object" },
        });

        const content = response.choices[0]?.message?.content;
        const parsedContent = content
          ? JSON.parse(content)
          : { summary: "", descriptions: [] };

        // Store the AI-generated descriptions and summary in the database
        if (
          parsedContent.descriptions &&
          parsedContent.descriptions.length > 0
        ) {
          await ctx.db.locationGroup.update({
            where: { id: locationGroup.id },
            data: {
              aiUrlDescriptions: parsedContent.descriptions,
              description: parsedContent.summary || locationGroup.description, // Update description with summary if available
            },
          });
        }

        return {
          success: true,
          descriptions: parsedContent.descriptions || [],
          summary: parsedContent.summary || "",
        };
      } catch (error) {
        console.error("Error generating descriptions:", error);
        throw new Error("Failed to generate descriptions");
      }
    }),

  getPublicLocations: publicProcedure
    .input(
      z
        .object({
          creatorIds: z.array(z.string()).optional(),
        })
        .optional(),
    )
    .query(async ({ ctx, input }) => {
      // Base query conditions
      const baseConditions = {
        approved: { equals: true },
        endDate: { gte: new Date() },
        subscriptionId: { equals: null },
        remaining: { gt: 0 },
      };

      // Add creator filter if creatorIds are provided
      const whereCondition = {
        ...baseConditions,
        ...(input?.creatorIds && input.creatorIds.length > 0
          ? {
              privacy: {
                in: [ItemPrivacy.PUBLIC, ItemPrivacy.PRIVATE, ItemPrivacy.TIER],
              },
              creatorId: { in: input.creatorIds },
            }
          : { privacy: { in: [ItemPrivacy.PUBLIC] } }),
      };

      const locationGroup = await ctx.db.locationGroup.findMany({
        where: whereCondition,
        include: {
          locations: true,
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

      const pins = locationGroup
        .flatMap((group) => {
          const multiPin = group.multiPin;

          if (multiPin) {
            return group.locations.map((location) => ({
              ...location,
              ...group,
              id: location.id,
              collected: false,
            }));
          } else {
            return group.locations.map((location) => ({
              ...location,
              ...group,
              id: location.id,
              collected: false,
            }));
          }
        })
        .filter((location) => location !== undefined);

      const WadzzoIconURL = "https://app.wadzzo.com/images/loading.png";
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
          collected: false,
          collection_limit_remaining: location.remaining,
          auto_collect: location.autoCollect,
          brand_image_url: location.creator.profileUrl ?? WadzzoIconURL,
          brand_id: location.creatorId,
          public: true,
          aiUrlDescriptions: location.aiUrlDescriptions,
        };
      });

      return { locations };
    }),

  answerQuestion: publicProcedure
    .input(
      z.object({
        question: z.string(),
        userLocation: z
          .object({
            latitude: z.number(),
            longitude: z.number(),
          })
          .optional()
          .nullable(),
        creatorIds: z.array(z.string()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Fetch all creators and locations to build context for OpenAI
      const locationGroups = await ctx.db.locationGroup.findMany({
        where: {
          approved: { equals: true },
          endDate: { gte: new Date() },
          ...(input.creatorIds && input.creatorIds.length > 0
            ? {
                privacy: {
                  in: [
                    ItemPrivacy.PUBLIC,
                    ItemPrivacy.PRIVATE,
                    ItemPrivacy.TIER,
                  ],
                },
                creatorId: { in: input.creatorIds },
              }
            : { privacy: { in: [ItemPrivacy.PUBLIC] } }),
          remaining: { gt: 0 },
        },
        include: {
          locations: true,
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

      // Find nearest location if user location is provided
      let nearestLocation = null;
      if (input.userLocation?.latitude && input.userLocation?.longitude) {
        const allLocations = locationGroups.flatMap((group) =>
          group.locations.map((loc) => ({
            ...loc,
            groupTitle: group.title,
            groupDescription: group.description,
            brandName: group.creator.name,
            brandId: group.creatorId,
          })),
        );

        nearestLocation = findNearestLocation(
          input.userLocation.latitude,
          input.userLocation.longitude,
          allLocations,
        );
      }

      // Format the data to create a context for OpenAI
      const context = locationGroups.map((group) => {
        const locations = group.locations.map((loc) => ({
          id: loc.id,
          latitude: loc.latitude,
          longitude: loc.longitude,
        }));

        return {
          brand: {
            id: group.creatorId,
            name: group.creator.name,
            profileUrl: group.creator.profileUrl,
          },
          locations,
          title: group.title,
          description: group.description,
          remaining: group.remaining,
        };
      });

      // Create a system prompt with the context
      const systemPrompt = `
You are Wadzzo's assistant for a location-based deal discovery platform. 
You have access to information about brands/creators and their locations.

${
  input.creatorIds && input.creatorIds.length > 0
    ? `You're specifically providing information about ${locationGroups.length} creators that the user has selected to view on the map.`
    : "You have information about all public brand locations currently available."
}

Here's the information about available brands and their locations:

${JSON.stringify(context, null, 2)}

${
  input.userLocation?.latitude && input.userLocation?.longitude
    ? `The user's current location is: Latitude ${input.userLocation.latitude}, Longitude ${input.userLocation.longitude}`
    : "Note: The user has not shared their current location."
}

${
  nearestLocation
    ? `Based on the user's location, the nearest location is "${nearestLocation.location.groupTitle}" by ${nearestLocation.location.brandName}, which is approximately ${nearestLocation.distance.toFixed(2)} kilometers away.`
    : ""
}

Use this information to answer the user's questions about brands, locations, and deals.
If asked about the nearest location or distance, use the provided nearest location information if available.
If you don't have enough information to answer a specific question, be honest and suggest they contact the brand directly.
Keep your answers helpful, friendly, and concise.
`;

      try {
        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.question },
          ],
          temperature: 0.7,
          max_tokens: 500,
        });

        return {
          answer:
            response.choices[0]?.message?.content ??
            "Sorry, I couldn't generate a response.",
        };
      } catch (error) {
        console.error("OpenAI API error:", error);
        return {
          answer:
            "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
        };
      }
    }),
});
