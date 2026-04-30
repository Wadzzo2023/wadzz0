import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { Dialog, DialogContent } from "~/components/shadcn/ui/dialog";
import { Button } from "~/components/shadcn/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/shadcn/ui/tabs";
import { Input } from "~/components/shadcn/ui/input";
import { WalletType } from "package/connect_wallet/src/lib/enums";
import { appleLogin } from "package/connect_wallet/src/lib/stellar/wallet_clients/apple_login";
import { googleLogin } from "package/connect_wallet/src/lib/stellar/wallet_clients/google_login";
import { freighterLogin } from "package/connect_wallet/src/lib/stellar/wallet_clients/freighter_login";
import { rabetLogin } from "package/connect_wallet/src/lib/stellar/wallet_clients/rabe_login";
import { albedoLogin } from "package/connect_wallet/src/lib/stellar/wallet_clients/albedo_login";
import { checkStellarAccountActivity } from "package/connect_wallet/src/lib/stellar/utils";
import { useModernDialogStore } from "~/lib/state/modern-dialog-store";
import { useRouter } from "next/router";
import { addrShort } from "~/utils/utils";
import { toast } from "react-hot-toast";
import { signIn } from "next-auth/react";
import {
  Wallet,
  LogOut,
  RefreshCw,
  Copy,
  CheckCircle2,
  XCircle,
  Mail,
  Loader2,
} from "lucide-react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

export default function ModernConnectDialog() {
  const [isAccountActivate, setAccountActivate] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState(WalletType.none);
  const session = useSession();
  const router = useRouter();
  const dialogModalState = useModernDialogStore();

  const checkAccountActivity = useCallback(async (publicKey: string) => {
    setIsLoading(true);
    const isActive = await checkStellarAccountActivity(publicKey);
    setAccountActivate(isActive);
    setIsLoading(false);
  }, []);

  const checkStatus = useCallback(async () => {
    const user = session.data?.user;
    if (user) {
      await checkAccountActivity(user.id);
    }
  }, [checkAccountActivity, session.data?.user]);

  useEffect(() => {
    if (dialogModalState.isOpen && session.status === "authenticated") {
      checkStatus();
      const w = session.data?.user.walletType;
      setSelectedWallet(w ?? WalletType.none);
    }
  }, [dialogModalState.isOpen, session.status, checkStatus, session.data?.user.walletType]);

  const handleClose = () => {
    dialogModalState.setIsOpen(false);
  };

  const disconnectWallet = async () => {
    await signOut({ redirect: false });
    router.reload();
  };

  if (!dialogModalState.isOpen) return null;

  // Not authenticated - show login dialog
  if (session.status !== "authenticated") {
    return (
      <Dialog open={dialogModalState.isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md gap-0 p-0 overflow-hidden !rounded-3xl">
          <div className="p-6">
            <div className="mb-6 text-center">
              <h2 className="text-xl font-medium">Action Auth System</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Sign in to access your account
              </p>
            </div>

            <Tabs defaultValue="action" className="w-full ">
              <div className="relative w-fit mx-auto overflow-hidden rounded-[0.9rem] border border-transparent bg-[#f3f1ea]/80 shadow-[0_8px_24px_rgba(0,0,0,0.05)] p-0.5 mb-4">
                <TabsList className="inline-flex items-center gap-0.5">
                  <TabsTrigger
                    value="action"
                    className="relative inline-flex items-center justify-center rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[state=active]:border-white/60 data-[state=active]:bg-white/55 data-[state=active]:text-black data-[state=active]:shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] data-[state=active]:backdrop-blur-[6px] data-[state=inactive]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:text-black/65 data-[state=inactive]:hover:bg-white/35 data-[state=inactive]:hover:text-black"
                  >
                    Action
                  </TabsTrigger>
                  <TabsTrigger
                    value="stellar"
                    className="relative inline-flex items-center justify-center rounded-[0.7rem] border px-3 py-1.5 text-sm font-normal transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 data-[state=active]:border-white/60 data-[state=active]:bg-white/55 data-[state=active]:text-black data-[state=active]:shadow-[inset_1px_1px_1px_0_rgba(255,255,255,0.92),_inset_-1px_-1px_1px_1px_rgba(255,255,255,0.72),_0_8px_20px_rgba(255,255,255,0.24)] data-[state=active]:backdrop-blur-[6px] data-[state=inactive]:border-transparent data-[state=inactive]:bg-transparent data-[state=inactive]:text-black/65 data-[state=inactive]:hover:bg-white/35 data-[state=inactive]:hover:text-black"
                  >
                    Stellar
                  </TabsTrigger>
                </TabsList>
              </div>

              <TabsContent value="action" className="space-y-3">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const form = e.target as HTMLFormElement;
                    const formData = new FormData(form);
                    const email = formData.get("email") as string;
                    const password = formData.get("password") as string;
                    if (email && password) {
                      signIn("credentials", {
                        redirect: false,
                        email,
                        password,
                        walletType: WalletType.emailPass,
                      });
                    }
                  }}
                  className="space-y-3"
                >
                  <Input
                    name="email"
                    type="email"
                    placeholder="Email"
                    required
                    className="w-full h-12 rounded-xl bg-secondary"
                  />
                  <Input
                    name="password"
                    type="password"
                    placeholder="Password"
                    required
                    className="w-full h-12 rounded-xl bg-secondary"
                  />
                  <Button type="submit" className="w-full h-12 rounded-xl bg-blue-600">
                    Login
                  </Button>
                </form>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-background px-2 text-muted-foreground">Or continue with</span>
                  </div>
                </div>

                <Button
                  variant="secondary"
                  className="w-full justify-center gap-2 h-12 rounded-xl"
                  onClick={() => void appleLogin()}
                >
                  <svg xmlSpace="preserve" viewBox="0 0 814 1000">
                    <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105.6-57-155.5-127C46.7 790.7 0 663 0 541.8c0-194.4 126.4-297.5 250.8-297.5 66.1 0 121.2 43.4 162.7 43.4 39.5 0 101.1-46 176.3-46 28.5 0 130.9 2.6 198.3 99.2zm-234-181.5c31.1-36.9 53.1-88.1 53.1-139.3 0-7.1-.6-14.3-1.9-20.1-50.6 1.9-110.8 33.7-147.1 75.8-28.5 32.4-55.1 83.6-55.1 135.5 0 7.8 1.3 15.6 1.9 18.1 3.2.6 8.4 1.3 13.6 1.3 45.4 0 102.5-30.4 135.5-71.3z" />
                  </svg>
                  Apple
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-center gap-2 h-12 rounded-xl"
                  onClick={() => void googleLogin()}
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  Google
                </Button>
              </TabsContent>

              <TabsContent value="stellar" className="space-y-3">
                <Button
                  variant="secondary"
                  className="w-full justify-center gap-2 h-12 rounded-xl"
                  onClick={() => void freighterLogin()}
                >
                  <Image src="/images/wallets/freighter.png" alt="Freighter" width={16} height={16} />
                  Freighter
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-center gap-2 h-12 rounded-xl"
                  onClick={() => void rabetLogin()}
                >
                  <Image src="/images/wallets/rabet.png" alt="Rabet" width={16} height={16} />
                  Rabet
                </Button>

                <Button
                  variant="secondary"
                  className="w-full justify-center gap-2 h-12 rounded-xl"
                  onClick={() => void albedoLogin()}
                >
                  <Image src="/images/wallets/albedo.svg" alt="Albedo" width={16} height={16} />
                  Albedo
                </Button>
              </TabsContent>
            </Tabs>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Authenticated - show account info
  if (isLoading) {
    return (
      <Dialog open={dialogModalState.isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const user = session.data.user;

  // Email not verified
  if (user && !user.emailVerified) {
    return (
      <Dialog open={dialogModalState.isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="space-y-4 p-4 text-center">
            <Mail className="mx-auto h-12 w-12 text-muted-foreground" />
            <div>
              <h3 className="font-semibold">Verify your email</h3>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Button variant="destructive" onClick={disconnectWallet} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Account not activated
  if (!isAccountActivate) {
    return (
      <Dialog open={dialogModalState.isOpen} onOpenChange={handleClose}>
        <DialogContent className="max-w-md">
          <div className="space-y-4 p-6">
            <div className="text-center">
              <XCircle className="mx-auto h-12 w-12 text-destructive" />
              <h3 className="mt-2 font-semibold">Account Not Activated</h3>
              <p className="text-sm text-muted-foreground">
                Please fund your account to activate it
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-lg bg-muted p-3">
              <code className="flex-1 text-xs font-mono">{user?.id}</code>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  navigator.clipboard.writeText(user?.id ?? "");
                  toast.success("Copied!");
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>
            <Button onClick={() => void checkStatus()} className="w-full">
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh Status
            </Button>
            <Button variant="destructive" onClick={disconnectWallet} className="w-full">
              <LogOut className="mr-2 h-4 w-4" />
              Disconnect
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // Account activated - show account info
  return (
    <Dialog open={dialogModalState.isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-md !rounded-3xl">
        <div className="space-y-4 p-6">
          <div className="text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
            <h3 className="mt-2 font-semibold">Wallet Connected</h3>
          </div>
          <div className="rounded-lg bg-muted p-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address</span>
              <button
                className="flex items-center gap-1 text-sm font-mono hover:text-primary"
                onClick={() => {
                  navigator.clipboard.writeText(user?.id ?? "");
                  toast.success("Address copied!");
                }}
              >
                {addrShort(user?.id ?? "", 10)}
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
          <Button variant="secondary" onClick={disconnectWallet} className="w-full rounded-xl text-destructive h-14">
            <LogOut className="mr-2 h-4 w-4" />
            Disconnect Wallet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
