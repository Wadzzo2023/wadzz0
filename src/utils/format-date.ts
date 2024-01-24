import { formatDistanceToNow } from "date-fns";

export const formatPostCreatedAt = (createdAt: Date): string => {
  const distance = formatDistanceToNow(createdAt, {
    addSuffix: true,
  });
  return distance;
};
