import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";
import { useModal } from "../../lib/state/play/use-modal-store";
import {
  FacebookShareButton,
  FacebookIcon,
  TwitterShareButton,
  WhatsappShareButton,
  TelegramShareButton,
} from "next-share";
import { FaXTwitter } from "react-icons/fa6";

const ShareModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const { postUrl } = data;
  const isModalOpen = isOpen && type === "share";
  const handleClose = () => {
    onClose();
  };
  return (
    <Dialog open={isModalOpen} onOpenChange={handleClose}>
      <DialogContent className="w-full rounded-xl bg-gray-100  ">
        <DialogHeader className="items center flex justify-between border-b border-gray-200 ">
          <div className="flex items-center justify-center">
            <DialogTitle className="text-xl font-bold text-gray-800">
              Share on Social Media
            </DialogTitle>
          </div>
        </DialogHeader>

        <div className="my-4">
          <p className="text-sm">Share this link via</p>

          <div className="my-4 flex justify-around">
            <FacebookShareButton
              url={`${process.env.NEXT_PUBLIC_URL}${postUrl}`}
              quote={"Checkout my post on Wadzzo"}
              hashtag={"#Wadzzo"}
            >
              <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-blue-200 fill-[#1877f2] shadow-xl hover:bg-[#1877f2] hover:fill-white hover:shadow-blue-500/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="M13.397 20.997v-8.196h2.765l.411-3.209h-3.176V7.548c0-.926.258-1.56 1.587-1.56h1.684V3.127A22.336 22.336 0 0 0 14.201 3c-2.444 0-4.122 1.492-4.122 4.231v2.355H7.332v3.209h2.753v8.202h3.312z"></path>
                </svg>
              </div>
            </FacebookShareButton>
            <TwitterShareButton
              url={`${process.env.NEXT_PUBLIC_URL}${postUrl}`}
              title={"Checkout my post on Wadzzo"}
            >
              <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-blue-200 fill-[#1d9bf0] shadow-xl hover:bg-[#1d9bf0] hover:fill-white hover:shadow-sky-500/50">
                <FaXTwitter />
              </div>
            </TwitterShareButton>
            <WhatsappShareButton
              url={`${process.env.NEXT_PUBLIC_URL}${postUrl}`}
              title={"Checkout my post on Wadzzo"}
              separator=":: "
            >
              <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-green-200 fill-[#25D366] shadow-xl hover:bg-[#25D366] hover:fill-white hover:shadow-green-500/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M18.403 5.633A8.919 8.919 0 0 0 12.053 3c-4.948 0-8.976 4.027-8.978 8.977 0 1.582.413 3.126 1.198 4.488L3 21.116l4.759-1.249a8.981 8.981 0 0 0 4.29 1.093h.004c4.947 0 8.975-4.027 8.977-8.977a8.926 8.926 0 0 0-2.627-6.35m-6.35 13.812h-.003a7.446 7.446 0 0 1-3.798-1.041l-.272-.162-2.824.741.753-2.753-.177-.282a7.448 7.448 0 0 1-1.141-3.971c.002-4.114 3.349-7.461 7.465-7.461a7.413 7.413 0 0 1 5.275 2.188 7.42 7.42 0 0 1 2.183 5.279c-.002 4.114-3.349 7.462-7.461 7.462m4.093-5.589c-.225-.113-1.327-.655-1.533-.73-.205-.075-.354-.112-.504.112s-.58.729-.711.879-.262.168-.486.056-.947-.349-1.804-1.113c-.667-.595-1.117-1.329-1.248-1.554s-.014-.346.099-.458c.101-.1.224-.262.336-.393.112-.131.149-.224.224-.374s.038-.281-.019-.393c-.056-.113-.505-1.217-.692-1.666-.181-.435-.366-.377-.504-.383a9.65 9.65 0 0 0-.429-.008.826.826 0 0 0-.599.28c-.206.225-.785.767-.785 1.871s.804 2.171.916 2.321c.112.15 1.582 2.415 3.832 3.387.536.231.954.369 1.279.473.537.171 1.026.146 1.413.089.431-.064 1.327-.542 1.514-1.066.187-.524.187-.973.131-1.067-.056-.094-.207-.151-.43-.263"
                  ></path>
                </svg>
              </div>
            </WhatsappShareButton>
            <TelegramShareButton
              url={`${process.env.NEXT_PUBLIC_URL}${postUrl}`}
              title={"Checkout my post on Wadzzo"}
            >
              <div className="flex h-12 w-12 cursor-pointer items-center justify-center rounded-full border border-sky-200 fill-[#229ED9] shadow-xl hover:bg-[#229ED9] hover:fill-white hover:shadow-sky-500/50">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                >
                  <path d="m20.665 3.717-17.73 6.837c-1.21.486-1.203 1.161-.222 1.462l4.552 1.42 10.532-6.645c.498-.303.953-.14.579.192l-8.533 7.701h-.002l.002.001-.314 4.692c.46 0 .663-.211.921-.46l2.211-2.15 4.599 3.397c.848.467 1.457.227 1.668-.785l3.019-14.228c.309-1.239-.473-1.8-1.282-1.434z"></path>
                </svg>
              </div>
            </TelegramShareButton>
          </div>

          <p className="text-sm">Or copy link</p>

          <div className="mt-4 flex items-center justify-between border-2 border-gray-200 py-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 24 24"
              className="ml-2 fill-gray-500"
            >
              <path d="M8.465 11.293c1.133-1.133 3.109-1.133 4.242 0l.707.707 1.414-1.414-.707-.707c-.943-.944-2.199-1.465-3.535-1.465s-2.592.521-3.535 1.465L4.929 12a5.008 5.008 0 0 0 0 7.071 4.983 4.983 0 0 0 3.535 1.462A4.982 4.982 0 0 0 12 19.071l.707-.707-1.414-1.414-.707.707a3.007 3.007 0 0 1-4.243 0 3.005 3.005 0 0 1 0-4.243l2.122-2.121z"></path>
              <path d="m12 4.929-.707.707 1.414 1.414.707-.707a3.007 3.007 0 0 1 4.243 0 3.005 3.005 0 0 1 0 4.243l-2.122 2.121c-1.133 1.133-3.109 1.133-4.242 0L10.586 12l-1.414 1.414.707.707c.943.944 2.199 1.465 3.535 1.465s2.592-.521 3.535-1.465L19.071 12a5.008 5.008 0 0 0 0-7.071 5.006 5.006 0 0 0-7.071 0z"></path>
            </svg>

            <input
              className="w-full bg-transparent outline-none"
              type="text"
              placeholder="link"
              value={`${process.env.NEXT_PUBLIC_URL}${postUrl}`}
            />

            <button className="mr-2 rounded bg-indigo-500 px-5 py-2 text-sm text-white hover:bg-indigo-600">
              Copy
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
export default ShareModal;
