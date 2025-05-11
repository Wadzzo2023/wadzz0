import { addDays, differenceInDays, formatDistanceToNow } from "date-fns";

export const formatPostCreatedAt = (createdAt: Date): string => {
  const distance = formatDistanceToNow(createdAt, {
    addSuffix: true,
  });
  return distance;
};

export const formatSubscriptionEndDate = (endDate: Date): string => {
  const distance = formatDistanceToNow(endDate, {
    addSuffix: true,
  });
  return distance;
};

export const getEndDay = (startDate: Date, days: number): Date => {
  return addDays(startDate, days);
};

export const getDaysLeft = (endDate: Date): number => {
  return differenceInDays(endDate, new Date());
};
