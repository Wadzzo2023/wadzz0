import toast from "react-hot-toast";
import { UploadS3Button } from "~/pages/test";
import { api } from "~/utils/api";

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
    <div className="space-y-4   w-1/2 text-center">
      <span className="text-xs">SVG Dimension 200 x 200 pixels</span>

      <UploadS3Button
        endpoint="svgUploader"
        onClientUploadComplete={(res) => {
          // Do something with the response
          // alert("Upload Completed");
          const data = res;

          if (data?.url) {
            updateSVg.mutate(data.url);
          }
        }}
        onUploadError={(error: Error) => {
          // Do something with the error.
          toast.error(`ERROR! ${error.message}`);
        }}
      />
    </div>
  );
}
