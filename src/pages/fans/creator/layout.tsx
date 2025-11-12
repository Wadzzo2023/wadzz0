import { useRouter } from "next/router";
import { CreatorNavigation } from "~/components/fan/nav/creator-mode";
import { creatorExtraFiledsSchema } from "~/types/creator";
import { api } from "~/utils/api";

export default function CreatorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const creator = api.fan.creator.meCreator.useQuery();
  if (creator.isLoading) return <p>Loading...</p>;

  if (!creator.data?.approved) {
    router.push("/");
  }

  // Check navigation permissions
  const extraFields = creatorExtraFiledsSchema.parse(creator.data?.extraFields);
  const currentPath = router.pathname;
  const navEntry = Object.values(CreatorNavigation).find((nav) =>
    currentPath.startsWith(nav.path),
  );

  if (navEntry?.needAproval && !extraFields?.navPermission) {
    router.push("/fans/creator/settings");
    // return null;
  }

  return <>{children}</>;
}
