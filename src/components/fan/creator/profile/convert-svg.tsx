import toast from "react-hot-toast";
import { api } from "~/utils/api";
import { UploadButton } from "~/utils/uploadthing";

export default function PadSVG() {
  const updateSVg = api.fan.creator.changeCreatorBackgroundSVG.useMutation({
    onSuccess: () => {
      toast.success("SVG changes successfully");
    },
  });

  const addExtraSpaceToSvg = (svgContent: string) => {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(svgContent, "image/svg+xml");
    const svgElement = xmlDoc.getElementsByTagName("svg")[0];
    if (svgElement) {
      // Original viewBox
      const originalViewBox =
        svgElement.getAttribute("viewBox") ?? "0 0 100 100";
      const [minX, minY, width, height] = originalViewBox
        .split(" ")
        .map(parseFloat);
      // Add extra space

      if (minX && minY && width && height) {
        const extraSpace = 20;
        const newViewBox = `${minX - extraSpace} ${minY - extraSpace} ${width + extraSpace * 2} ${height + extraSpace * 2}`;
        svgElement.setAttribute("viewBox", newViewBox);
        svgElement.setAttribute("preserveAspectRatio", "xMinYMin meet");
        const serializer = new XMLSerializer();
        return serializer.serializeToString(svgElement);
      } else {
        throw new Error("Invalid viewBox");
      }
    } else {
      throw new Error("SVG element not found");
    }
  };

  return (
    <div className="text-center">
      <span className="text-xs">SVG Dimension 200 x 200 pixels</span>
      <UploadButton
        className="w-full "
        endpoint="imageUploader"
        onBeforeUploadBegin={(files) => {
          const filePromises = files.map((file) => {
            return new Promise<File>((resolve) => {
              if (file.type === "image/svg+xml") {
                const reader = new FileReader();
                reader.onload = (event: ProgressEvent<FileReader>) => {
                  const content = event.target?.result as string;
                  const modifiedContent = addExtraSpaceToSvg(content);

                  const blob = new Blob([modifiedContent], {
                    type: "image/svg+xml",
                  });
                  const modifiedFile = new File([blob], file.name, {
                    type: "image/svg+xml",
                  });

                  // Resolve the promise with the modified file
                  resolve(modifiedFile);
                };
                reader.readAsText(file);
              } else {
                // For non-SVG files, resolve the promise immediately with the original file
                resolve(file);
              }
            });
          });

          // Use Promise.all to wait for all file processing to complete
          return Promise.all(filePromises);
        }}
        appearance={{
          button:
            " text-white bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 hover:bg-gradient-to-br focus:ring-4 focus:outline-none focus:ring-blue-300 dark:focus:ring-blue-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center ",
          container:
            "p-1 w-max flex-row rounded-md border-cyan-300 bg-slate-800",
          allowedContent:
            "flex h-8 flex-col items-center justify-center px-2 text-white",
        }}
        content={{ button: "Change SVG" }}
        onClientUploadComplete={(res) => {
          // Do something with the response
          // alert("Upload Completed");
          const data = res[0];

          if (data?.url) {
            updateSVg.mutate(data.url);
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
