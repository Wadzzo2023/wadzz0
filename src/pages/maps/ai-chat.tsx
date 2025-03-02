import { AtomIcon, ClipboardList } from "lucide-react";
import Link from "next/link";

export function AIPinCreation() {
  return (
    <Link href="/maps/report" className="absolute bottom-36 right-2">
      <div className="btn">
        <ClipboardList /> AI CHAT Report
      </div>
    </Link>
  );
}
