import { SiteShell } from "~/components/shell/site-shell";
import { NotFoundView } from "~/components/static/not-found-view";

/** Unmatched URLs outside the (site) group still get the header and nav. */
export default function NotFound() {
  return (
    <SiteShell>
      <NotFoundView />
    </SiteShell>
  );
}
