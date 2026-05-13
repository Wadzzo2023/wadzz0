import { Wallet } from "lucide-react";
import { useSession } from "next-auth/react";
import { addrShort } from "~/utils/utils";
import { useModernDialogStore } from "~/lib/state/modern-dialog-store";

export default function ModernConnectWalletButton() {
  const session = useSession();
  const setDialog = useModernDialogStore();

  return (
    <button
      onClick={() => setDialog.setIsOpen(true)}
      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground transition-colors duration-150 hover:bg-muted"
    >
      <Wallet className="h-4 w-4 text-primary" />
      <span className="flex-1 text-left">
        {session.status === "authenticated"
          ? addrShort(session.data?.user?.id ?? "")
          : "Login / Sign Up"}
      </span>
    </button>
  );
}
