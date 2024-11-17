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
import Image from "next/image";
import { api } from "~/utils/api";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import toast from "react-hot-toast";
import React, { useRef, useState } from "react";
import ReactPlayer from "react-player/lazy";
import { Pause, Play } from "lucide-react";

const ViewAttachmentModal = () => {
  const { isOpen, onClose, type, data } = useModal();
  const isModalOpen = isOpen && type === "view attachment";

  const handleClose = () => {
    onClose();
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault(); // Prevent the default context menu from appearing
  };

  return (
    <>
      <Dialog open={isModalOpen} onOpenChange={handleClose}>
        <DialogContent
          onContextMenu={handleContextMenu}
          className="max-h-[600px] min-h-[600px] overflow-y-auto p-4 md:min-w-[700px] md:max-w-[700px]"
          // Prevent right-click
        >
          <DialogHeader className="px-6 pt-8">
            <DialogTitle className="text-center text-2xl font-bold">
              Attach Your File
            </DialogTitle>
          </DialogHeader>
          <div>
            {data.attachment &&
              data.attachment.filter((attachment) =>
                attachment.type.startsWith("audio/"),
              ).length > 0 && (
                <div className="flex w-full flex-col  overflow-y-auto border-t-2">
                  <h1 className="text-center text-2xl">Music Section</h1>
                  {data.attachment &&
                    data.attachment.filter((attachment) =>
                      attachment.type.startsWith("audio/"),
                    ).length === 0 && (
                      <p className="text-center">No music file attached</p>
                    )}
                  {data.attachment
                    ?.filter((attachment) =>
                      attachment.type.startsWith("audio/"),
                    )
                    .map((attachment, idx) => (
                      <div key={idx} className="p-4">
                        <div>
                          <span className="">File Name: {attachment.name}</span>
                          <AudioPlayer
                            src={attachment.url}
                            onError={(e) => toast.error("Error playing audio")}
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            {data.attachment &&
              data.attachment.filter((attachment) =>
                attachment.type.startsWith("video/"),
              ).length > 0 && (
                <div className="flex w-full flex-col overflow-y-auto">
                  <h1 className="border-t-2 text-center  text-2xl">
                    Video Section
                  </h1>
                  {data.attachment &&
                    data.attachment.filter((attachment) =>
                      attachment.type.startsWith("video/"),
                    ).length === 0 && (
                      <p className="text-center">No music file attached</p>
                    )}
                  {data.attachment
                    ?.filter((attachment) =>
                      attachment.type.startsWith("video/"),
                    )
                    .map((attachment, idx) => (
                      <div key={idx} className="p-4">
                        <div>
                          <span className="">File Name: {attachment.name}</span>
                          <CustomPlayer url={attachment.url} />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            {/* Music Files Row */}

            {/* Image Files Row */}

            {data.attachment &&
              data.attachment.filter((attachment) =>
                attachment.type.startsWith("image/"),
              ).length > 0 && (
                <div className="flex w-full flex-col  overflow-y-auto border-t-2">
                  <h1 className="border-t-2 text-center text-2xl">
                    Image Section
                  </h1>{" "}
                  {data.attachment
                    ?.filter((attachment) =>
                      attachment.type.startsWith("image/"),
                    )
                    .map((attachment, idx) => (
                      <div key={idx} className="p-4">
                        <div>
                          <span className="">File Name: {attachment.name}</span>
                          <Image
                            src={attachment.url}
                            alt={attachment.name}
                            width="500" // Set a fixed width for the image
                            height="500" // Adjust height as needed
                            className="object-cover"
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            {data.attachment &&
              data.attachment.filter((attachment) =>
                attachment.type.startsWith("application/"),
              ).length > 0 && (
                <div className="flex w-full flex-col  overflow-y-auto border-t-2">
                  <h1 className="text-center text-2xl">Docs/Doc Section</h1>{" "}
                  {data.attachment
                    ?.filter((attachment) =>
                      attachment.type.startsWith("application/"),
                    )
                    .map((attachment, idx) => (
                      <div key={idx} className="p-4">
                        <div>
                          <span className="">File Name: {attachment.name}</span>
                          <iframe
                            src={`https://docs.google.com/gview?url=${attachment.url}&embedded=true`}
                            width="100%"
                            height="500px"
                            style={{ border: "none" }}
                            sandbox="allow-same-origin allow-scripts" // adjust permissions as needed
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
            {data.attachment &&
              data.attachment.filter((attachment) =>
                attachment.type.startsWith("text/"),
              ).length > 0 && (
                <div className="flex w-full  flex-col overflow-y-auto border-t-2">
                  <h1 className="text-center text-2xl">Text Section</h1>{" "}
                  {data.attachment
                    ?.filter((attachment) =>
                      attachment.type.startsWith("text/"),
                    )
                    .map((attachment, idx) => (
                      <div key={idx} className="p-4">
                        <div>
                          <span className="">File Name: {attachment.name}</span>
                          <iframe
                            src={`https://docs.google.com/gview?url=${attachment.url}&embedded=true`}
                            width="100%"
                            height="500px"
                            style={{ border: "none" }}
                            sandbox="allow-same-origin allow-scripts" // adjust permissions as needed
                          />
                        </div>
                      </div>
                    ))}
                </div>
              )}
          </div>

          <DialogFooter className="flex justify-center">
            <Button className="w-full" onClick={handleClose}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ViewAttachmentModal;

const CustomPlayer = ({ url }: { url: string }) => {
  const [playing, setPlaying] = useState(false);
  const playerRef = useRef(null);

  const togglePlayPause = () => {
    setPlaying(!playing);
  };

  return (
    <div>
      <div className="relative">
        <ReactPlayer
          ref={playerRef}
          url={url}
          playing={playing}
          controls={false} // Disable built-in controls
          width="100%"
          height="100%"
        />
        <div className="absolute bottom-0 left-0 right-0 top-0 flex items-center justify-center">
          <button className=" text-red-600" onClick={togglePlayPause}>
            {playing ? <Pause size={40} /> : <Play size={40} />}
          </button>
          {/* Add more custom controls as needed */}
        </div>
      </div>
    </div>
  );
};
