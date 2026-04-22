import { Creator, Subscription } from "@prisma/client";
import clsx from "clsx";
import { SubscriptionType } from "~/pages/fans/creator/[id]";
import { Preview } from "~/components/preview";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/shadcn/ui/card";

export default function MemberShipCard({
  creator,
  subscription,
  className,
  children,
  priority,
  pageAsset,
}: {
  creator: Creator;
  subscription: SubscriptionType;
  className?: string;
  children?: React.ReactNode;
  priority?: number;
  pageAsset?: string;
}) {
  const tierColors: Record<number, string> = {
    1: "bg-blue-500",
    2: "bg-green-500",
    3: "bg-purple-500",
  };
  const colorClass = tierColors[priority ?? 1] ?? "bg-blue-500";

  return (
    <Card className={clsx(
      "relative overflow-hidden rounded-none hover:shadow-md transition-all duration-200",
      className,
    )}>
      <div className={clsx("h-2 w-full", colorClass)} />
      {priority === 1 && (
        <div className="absolute top-0 right-0">
          <div className={clsx("text-white text-xs font-bold px-3 py-1", colorClass)}>
            POPULAR
          </div>
        </div>
      )}
      <CardHeader className="pb-2 w-full">
        <div className="flex justify-between w-full">
          <div className="flex flex-col w-full">
            <CardTitle className="w-full">
              <div className="flex items-center gap-2 justify-between w-full">
                <span>{subscription.name}</span>
              </div>
            </CardTitle>
            <div className="flex items-baseline mt-2">
              <span className="text-3xl font-bold">{subscription.price}</span>
              <span className="text-muted-foreground ml-1">{pageAsset}</span>
            </div>
          </div>
        </div>
        <CardDescription className="mt-2">{subscription.description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 pb-2">
        <p className="font-medium text-gray-800">
          <Preview value={subscription.features} />
        </p>
      </CardContent>
      <CardFooter>
        <div className="flex items-center justify-between w-full">
          {children}
        </div>
      </CardFooter>
    </Card>
  );
}

export function getCardStyle(priority?: number) {
  if (!priority) return "bg-primary rounded-2xl";
  if (priority === 1) return "bg-primary rounded-e-2xl";
  if (priority === 2) return "bg-secondary rounded-2xl";
  if (priority === 3) return "bg-accent rounded-s-2xl";
}

export function getBageStyle(priority?: number) {
  if (!priority) return "badge-primary";
  if (priority === 1) return "badge-primary";
  if (priority === 2) return "badge-secondary";
  if (priority === 3) return "badge-accent";
}
export function getColor(priority?: number) {
  if (!priority) return "bg-primary";
  if (priority === 1) return "bg-primary";
  if (priority === 2) return "bg-secondary";
  if (priority === 3) return "bg-accent";
}
