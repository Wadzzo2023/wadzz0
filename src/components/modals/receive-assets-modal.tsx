import QRCode from "react-qr-code";
import { useModal } from "../../lib/state/play/use-modal-store";
import CopyToClip from "../wallete/copy_to_Clip";
import { Button } from "../shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { useSession } from "next-auth/react";
import { addrShort } from "~/utils/utils";
import { useRouter } from "next/router";
import { Copy } from "lucide-react";
import { getCookie } from "cookies-next";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";

const ReceiveAssetsModal = () => {
  const { isOpen, onClose, type } = useModal();
  const session = useSession();
  const isModalOpen = isOpen && type === "receive assets";
  const router = useRouter();
  const [layoutMode, setLayoutMode] = useState<"modern" | "legacy">("legacy");
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const isLegacyLayout = layoutMode === "legacy";

  useEffect(() => {
    const storedMode = getCookie("wadzzo-layout-mode");
    if (storedMode === "modern") {
      setLayoutMode("modern");
    } else {
      setLayoutMode("legacy");
    }
  }, []);

  const handleClose = () => {
    onClose();
  };
  const shortAddress = useMemo(
    () => addrShort(session?.data?.user?.id, 10),
    [session?.data?.user?.id],
  );

  if (!session?.data?.user?.id) {
    return <div>Public Key not found</div>;
  }
  const url = `https://app.wadzzo.com${router.pathname}?id=${session?.data?.user?.id}`;

  const onQrMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (isLegacyLayout || typeof window === "undefined") return;
    if (!window.matchMedia("(pointer:fine)").matches) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const px = (event.clientX - rect.left) / rect.width;
    const py = (event.clientY - rect.top) / rect.height;
    const rotateY = (px - 0.5) * 14;
    const rotateX = (0.5 - py) * 14;
    setTilt({ x: rotateX, y: rotateY });
  };

  const onQrMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const onCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(session?.data?.user?.id ?? "");
      toast.success("Address copied");
    } catch {
      toast.error("Could not copy address");
    }
  };

  if (isLegacyLayout) {
    return (
      <>
        <Dialog open={isModalOpen} onOpenChange={handleClose}>
          <DialogContent className="overflow-hidden p-0">
            <DialogHeader className="px-6 pt-8">
              <DialogTitle className="text-center text-2xl font-bold">
                RECEIVE ASSETS
              </DialogTitle>
            </DialogHeader>
            <div className="mt-4 flex flex-col items-center justify-center md:mt-0">
              <QRCode
                size={256}
                style={{
                  borderRadius: "10px",
                  backgroundColor: "white",
                  height: "150px",
                  width: "150px",
                }}
                value={url}
                viewBox={`0 0 256 256`}
              />
              <h6 className="p-1 text-[10px] md:text-xs ">{shortAddress}</h6>
              <CopyToClip text={session?.data?.user?.id} collapse={5} />
            </div>
            <DialogFooter className="px-6 py-4"></DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent className="overflow-hidden border-0 bg-transparent p-0 text-white shadow-none outline-none">
          <DialogHeader className="px-6 pb-2 pt-8">
            <DialogTitle className="text-center text-3xl font-semibold tracking-tight text-white">
              My Wallet
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 px-6 pb-7">
            <div className="text-center">
              <p className="text-sm text-white">{shortAddress}</p>
              <div className="mt-1 flex items-center justify-center gap-2 text-xs text-white">
                <span className="max-w-[92%] truncate">
                  {session?.data?.user?.id}
                </span>
                <button
                  onClick={onCopyAddress}
                  className="rounded-md p-1 text-white/60 transition hover:bg-white/10 hover:text-white"
                  aria-label="Copy full wallet address"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div
              className="flex justify-center"
              style={{ perspective: "1200px" }}
            >
              <div
                onMouseMove={onQrMouseMove}
                onMouseLeave={onQrMouseLeave}
                className="rounded-[36px] bg-white p-6 shadow-[0_24px_46px_-24px_rgba(255,255,255,0.35)] transition-transform duration-150 ease-out"
                style={{
                  transform: `rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
                  transformStyle: "preserve-3d",
                }}
              >
                <QRCode
                  size={320}
                  style={{
                    borderRadius: "0px",
                    backgroundColor: "white",
                    height: "min(74vw, 320px)",
                    width: "min(74vw, 320px)",
                  }}
                  value={url}
                  viewBox={`0 0 256 256`}
                />
              </div>
            </div>

            <div className="pt-1">
              <Button
                onClick={onCopyAddress}
                className="h-11 w-full rounded-full bg-white text-sm font-semibold text-[#0f172a] hover:bg-white/90"
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Address
              </Button>
            </div>

            <div className="hidden">
              <CopyToClip text={session?.data?.user?.id} collapse={5} />
            </div>
          </div>
          <DialogFooter className="px-6 pb-1 pt-0" />
        </DialogContent>
      </Dialog>
    </>
  );
};
export default ReceiveAssetsModal;
