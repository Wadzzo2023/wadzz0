import { useRouter } from "next/router";
import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";

export function CoverChange() {
  const router = useRouter();
  const coverChangeMutation =
    api.fan.creator.changeCreatorCoverPicture.useMutation({
      onSuccess: () => {
        toast.success("Cover Changed Successfully");
      },
    });
  // coverChangeMutation.isLoading && toast.loading("Uploading Cover");

  if (router.pathname == "/fans/creator/settings")
    return (
      <div className="text-center">
        <span className="text-xs">Cover Dimension of 851 x 315 pixels</span>
        <UploadButton
          className="w-full "
          endpoint="imageUploader"
          appearance={{
            button:
              "text-white bg-green-700 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-green-300 font-medium rounded-full text-sm px-5 py-2.5 text-center dark:bg-green-600 dark:hover:bg-green-700 dark:focus:ring-green-800text-white bg-gradient-to-r from-green-400 via-green-500 to-green-600 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-green-300 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center",
            container:
              "p-1 w-max flex-row rounded-md border-cyan-300 bg-slate-800",
            allowedContent:
              "flex h-8 flex-col items-center justify-center px-2 text-white",
          }}
          content={{ button: "Change Cover" }}
          onClientUploadComplete={(res) => {
            // Do something with the response
            // alert("Upload Completed");
            const data = res[0];
            if (data?.url) {
              coverChangeMutation.mutate(data.url);
            }

            // updateProfileMutation.mutate(res);
          }}
          onUploadError={(error: Error) => {
            // Do something with the error.
            alert(`ERROR! ${error.message}`);
          }}
        />
      </div>
    );
}
