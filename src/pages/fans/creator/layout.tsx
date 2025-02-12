import { useRouter } from "next/router";
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

  return <>{children}</>;
}
