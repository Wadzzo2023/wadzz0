import { useRouter } from "next/router";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";

export function CoverChange() {
  const router = useRouter();
  const coverChangeMutation =
    api.fan.creator.changeCreatorCoverPicture.useMutation();

  if (router.pathname == "/settings/creator")
    return (
      <div className="">
        <UploadButton
          endpoint="imageUploader"
          appearance={{
            allowedContent(arg) {
              return {
                display: "none",
              };
            },
          }}
          content={{
            button: "Change Cover",
          }}
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
