import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { UploadS3Button } from "~/pages/test";
import { api } from "~/utils/api";

export function CoverChange() {
  const router = useRouter();
  const coverChangeMutation =
    api.fan.creator.changeCreatorCoverPicture.useMutation({
      onSuccess: () => {
        toast.success("Cover Changed Successfully");
      },
    });
  // coverChangeMutation.isLoading && toast.loading("Uploading Cover");

  if (router.pathname === "/fans/creator/settings")
    return (
      <div className="">
        <span className="text-xs">Cover Dimension of 851 x 315 pixels</span>
        <UploadS3Button
          endpoint="imageUploader"
          onClientUploadComplete={(res) => {
            const fileUrl = res.url;
            coverChangeMutation.mutate(fileUrl);
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            toast.error(`ERROR! ${error.message}`);

          }}
        />

      </div>
    );
}
