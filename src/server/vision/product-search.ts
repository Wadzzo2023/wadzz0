import { env } from "~/env.js";

export async function indexMural(args: {
  locationGroupId: string;
  creatorId: string;
  gcsUris: string[];
}): Promise<string> {
  const { WarehouseClient } = await import("@google-cloud/visionai");
  const client = new WarehouseClient();
  
  const corpusName = `projects/${env.GOOGLE_CLOUD_PROJECT_NUMBER}/locations/${env.VISION_LOCATION}/corpora/${env.VISION_PRODUCT_SET_ID}`;
  const assetId = args.locationGroupId;
  
  try {
    // Attempt to create the Asset container in Vision AI Warehouse
    await client.createAsset({
      parent: corpusName,
      assetId: assetId,
      asset: { }
    });
  } catch (err: any) {
    // If it already exists (gRPC code 6 = ALREADY_EXISTS), that's fine
    if (err.code !== 6) {
      console.warn("Vision Warehouse CreateAsset Warning:", err.message);
    }
  }

  // Upload each mirrored GCS image to the Asset so Vision Warehouse generates embeddings
  for (const gcsUri of args.gcsUris) {
    try {
      const [operation] = await client.uploadAsset({
        name: `${corpusName}/assets/${assetId}`,
        assetSource: {
          assetGcsSource: {
            gcsUri
          }
        }
      });
      await operation.promise();
    } catch (err: any) {
      console.warn(`Vision Warehouse UploadAsset Warning for ${gcsUri}:`, err?.message || err);
    }
  }

  // Returns the fully-qualified asset name (to map to muralProductId in DB)
  return `${corpusName}/assets/${assetId}`;
}
