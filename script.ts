import { db } from "~/server/db";
import { s3Client } from "~/server/s3";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

import crypto from "crypto";
import axios from "axios";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

async function downloadImage(
  url: string,
): Promise<{ buffer: Buffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const contentType = response.headers.get("content-type") || "image/jpeg";
  const arrayBuffer = await response.arrayBuffer();
  return {
    buffer: Buffer.from(arrayBuffer),
    contentType,
  };
}

async function uploadToS3WithProgress(
  fileBuffer: Buffer,
  fileName: string,
  contentType: string,
  onProgress?: (progress: number) => void,
) {
  const command = new PutObjectCommand({
    Bucket: process.env.NEXT_AWS_BUCKET_NAME,
    Key: fileName,
    ContentType: contentType,
  });

  const uploadUrl = await getSignedUrl(s3Client, command, { expiresIn: 1000 });

  const response = await axios.put(uploadUrl, fileBuffer, {
    headers: {
      "Content-Type": contentType,
    },
    onUploadProgress: (progressEvent) => {
      if (progressEvent.total) {
        const percentage = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total,
        );
        onProgress?.(percentage);
      }
    },
  });

  if (response.status === 200) {
    return `https://${process.env.NEXT_AWS_BUCKET_NAME}.s3.amazonaws.com/${fileName}`;
  }

  throw new Error("Upload failed");
}

async function getNewUrl(imageUrl: string | undefined | null) {
  if (!imageUrl) {
    return undefined;
  }
  const fileName = imageUrl.split("/").pop();
  if (!fileName) {
    return undefined;
  }

  //console.log(`Downloading from ${imageUrl}`);
  const { buffer, contentType } = await downloadImage(imageUrl);

  //console.log(`Uploading to S3: ${fileName} (${contentType})`);
  const newImageUrl = await uploadToS3WithProgress(
    buffer,
    fileName, // Using original filename with extension
    contentType,
    (progress) => {
      //console.log(`Upload progress: ${progress}%`);
    },
  );

  //console.log(`New URL: ${newImageUrl}`);
  return newImageUrl;
}

async function updateUserTable() {
  const users = await db.user.findMany({
    where: {
      image: {
        contains: "https://utfs.io",
      },
    },
  });

  // In your main loop:
  for (const user of users) {
    const newImageUrl = await getNewUrl(user.image);
    if (newImageUrl) {
      await db.user.update({
        where: { id: user.id },
        data: {
          image: newImageUrl,
        },
      });
    }
  }

  const newUsers = await db.user.findMany({
    where: {
      image: {
        contains: "https://utfs.io",
      },
    },
  });

  //console.log(`remaning utfs.io`, newUsers.length);
}

async function updateCreatorTable() {
  const creators = await db.creator.findMany({
    where: {
      OR: [
        {
          profileUrl: {
            contains: "https://utfs.io",
          },
        },
        {
          coverUrl: {
            contains: "https://utfs.io",
          },
        },
      ],
    },
  });

  // In your main loop:
  for (const creator of creators) {
    const newProfileUrl = await getNewUrl(creator.profileUrl);
    const newCoverUrl = await getNewUrl(creator.coverUrl);

    if (newCoverUrl) {
      await db.creator.update({
        where: { id: creator.id },
        data: {
          coverUrl: newCoverUrl,
        },
      });
    }

    if (newProfileUrl) {
      await db.creator.update({
        where: { id: creator.id },
        data: {
          profileUrl: newProfileUrl,
        },
      });
    }
  }

  const newCreators = await db.creator.findMany({
    where: {
      OR: [
        {
          profileUrl: {
            contains: "https://utfs.io",
          },
        },
        {
          coverUrl: {
            contains: "https://utfs.io",
          },
        },
      ],
    },
  });

  //console.log(`remaning utfs.io`, newCreators.length);
}

async function updateCreatorPageAsset() {
  const creatorPageAsests = await db.creatorPageAsset.findMany({
    where: {
      OR: [
        {
          thumbnail: {
            contains: "https://utfs.io",
          },
        },
      ],
    },
  });

  for (const creatorPageAsset of creatorPageAsests) {
    const thumbnail = await getNewUrl(creatorPageAsset.thumbnail);

    if (thumbnail) {
      await db.creatorPageAsset.update({
        where: { creatorId: creatorPageAsset.creatorId },
        data: {
          thumbnail,
        },
      });
    }
  }
}

async function updateAlbumTable() {
  const albums = await db.album.findMany({
    where: {
      coverImgUrl: {
        contains: "https://utfs.io",
      },
    },
  });

  // In your main loop:
  for (const album of albums) {
    const newCoverUrl = await getNewUrl(album.coverImgUrl);

    if (newCoverUrl) {
      await db.album.update({
        where: { id: album.id },
        data: {
          coverImgUrl: newCoverUrl,
        },
      });
    }
  }

  const newAlbumss = await db.album.findMany({
    where: {
      coverImgUrl: {
        contains: "https://utfs.io",
      },
    },
  });

  //console.log(`remaning utfs.io`, newAlbumss.length);
}

async function updateAssetTable() {
  const assets = await db.asset.findMany({
    where: {
      mediaUrl: {
        contains: "https://utfs.io",
      },
    },
  });

  // In your main loop:
  for (const asset of assets) {
    const mediaUrl = await getNewUrl(asset.mediaUrl);

    if (mediaUrl) {
      await db.asset.update({
        where: { id: asset.id },
        data: {
          mediaUrl,
        },
      });
    }
  }

  const newAssets = await db.asset.findMany({
    where: {
      mediaUrl: {
        contains: "https://utfs.io",
      },
    },
  });

  //console.log(`remaning utfs.io`, newAssets.length);
}

async function updateAdmin() {
  const admins = await db.admin.findMany({
    where: {
      OR: [
        {
          profileUrl: {
            contains: "https://utfs.io",
          },
        },
        {
          coverUrl: {
            contains: "https://utfs.io",
          },
        },
      ],
    },
  });

  // In your main loop:
  for (const admin of admins) {
    const profileUrl = await getNewUrl(admin.profileUrl);
    const coverUrl = await getNewUrl(admin.coverUrl);

    if (profileUrl) {
      await db.admin.update({
        where: { id: admin.id },
        data: {
          profileUrl,
        },
      });
    }

    if (coverUrl) {
      await db.admin.update({
        where: { id: admin.id },
        data: {
          coverUrl,
        },
      });
    }
  }

  const newAdmins = await db.admin.findMany({
    where: {
      OR: [
        {
          profileUrl: {
            contains: "https://utfs.io",
          },
        },
        {
          coverUrl: {
            contains: "https://utfs.io",
          },
        },
      ],
    },
  });

  //console.log(`remaning utfs.io`, newAdmins.length);

  const adminAssets = await db.adminAsset.findMany({
    where: {
      OR: [
        {
          logoUrl: {
            contains: "https://utfs.io",
          },
        },
      ],
    },
  });

  for (const adminAsset of adminAssets) {
    const logoUrl = await getNewUrl(adminAsset.logoUrl);

    if (logoUrl) {
      await db.adminAsset.update({
        where: { id: adminAsset.id },
        data: {
          logoUrl,
        },
      });
    }
  }
}

async function updateLocationGroup() {
  const locationGroups = await db.locationGroup.findMany({
    where: {
      image: {
        contains: "https://utfs.io",
      },
    },
  });

  for (const locationGroup of locationGroups) {
    const newImageUrl = await getNewUrl(locationGroup.image);
    if (newImageUrl) {
      await db.locationGroup.update({
        where: { id: locationGroup.id },
        data: {
          image: newImageUrl,
        },
      });
    }
  }
}

async function updateMedia() {
  const medias = await db.media.findMany({
    where: {
      url: {
        contains: "https://utfs.io",
      },
    },
  });

  for (const media of medias) {
    const newUrl = await getNewUrl(media.url);
    if (newUrl) {
      await db.media.update({
        where: { id: media.id },
        data: {
          url: newUrl,
        },
      });
    }
  }
}

//===

async function updateBounty() {
  const bounties = await db.bounty.findMany({});

  for (const bounty of bounties) {
    const imageUrls = bounty.imageUrls;
    if (imageUrls.some((url) => url.includes("https://utfs.io"))) {
      const newUrls = [];
      for (const url of imageUrls) {
        let newUrl = url;
        if (url.includes("https://utfs.io")) {
          const coverUrl = await getNewUrl(url);
          if (coverUrl) {
            newUrl = coverUrl;
          }
        }
        newUrls.push(newUrl);
      }

      await db.bounty.update({
        where: { id: bounty.id },
        data: {
          imageUrls: newUrls,
        },
      });
    }
  }
}

async function updateSubmissionAtachement() {
  const submissions = await db.submissionAttachment.findMany({
    where: {
      OR: [
        {
          url: {
            contains: "https://utfs.io",
          },
        },
      ],
    },
  });

  for (const submission of submissions) {
    const newUrl = await getNewUrl(submission.url);
    if (newUrl) {
      await db.submissionAttachment.update({
        where: { id: submission.id },
        data: {
          url: newUrl,
        },
      });
    }
  }
}

// await updateUserTable();
// await updateCreatorTable();
// await updateCreatorPageAsset();
// await updateAlbumTable();
// await updateAssetTable();
// await updateAdmin();
// await updateLocationGroup();
// await updateMedia();
// await updateBounty();
// await updateSubmissionAtachement();
