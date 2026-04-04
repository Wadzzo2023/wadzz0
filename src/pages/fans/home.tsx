import { useRouter } from "next/router";
import { useEffect } from "react";

export default function LegacyFansHomeRedirect() {
  const router = useRouter();

  useEffect(() => {
    void router.replace("/feed");
  }, [router]);

  return null;
}
