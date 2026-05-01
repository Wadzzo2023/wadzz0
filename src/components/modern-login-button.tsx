import { Wallet } from "lucide-react";
import { useModernDialogStore } from "~/lib/state/modern-dialog-store";

export default function ModernLoginButton() {
  const setDialog = useModernDialogStore();

  return (
    <button
      onClick={() => setDialog.setIsOpen(true)}
      className="flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
    >
      <Wallet className="h-4 w-4" />
      <span>Login</span>
    </button>
  );
}
