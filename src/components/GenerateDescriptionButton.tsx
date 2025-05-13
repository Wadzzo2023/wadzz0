/* eslint-disable  */
import { useState } from "react";
import { Wand2 } from "lucide-react";
import { api } from "~/utils/api";
import toast from "react-hot-toast";
import { Button } from "./shadcn/ui/button";

interface GenerateDescriptionButtonProps {
  pinId: string;
  onDescriptionsGenerated?: (descriptions: string[], summary?: string) => void;
}

const GenerateDescriptionButton = ({
  pinId,
  onDescriptionsGenerated,
}: GenerateDescriptionButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);

  const generateDescriptionMutation =
    api.widget.generateDescriptions.useMutation({
      onSuccess: (data) => {
        setIsLoading(false);
        setHasGenerated(true);
        toast.success("Descriptions generated successfully!");
        if (onDescriptionsGenerated && data.descriptions) {
          onDescriptionsGenerated(data.descriptions, data.summary);
        }
      },
      onError: (error) => {
        setIsLoading(false);
        toast.error(`Failed to generate descriptions: ${error.message}`);
      },
    });

  const handleGenerateClick = () => {
    if (!pinId) {
      toast.error("Missing pin ID");
      return;
    }

    setIsLoading(true);
    generateDescriptionMutation.mutate({
      pinId,
    });
  };

  return (
    <Button
      className={`relative m-1 w-1/2 overflow-hidden border-0 bg-gradient-to-r from-blue-500 to-green-500 font-medium text-white shadow-md transition-all duration-300 hover:from-blue-600 hover:to-green-600 hover:shadow-lg ${hasGenerated ? "sparkle-button" : ""}`}
      onClick={handleGenerateClick}
      disabled={isLoading}
      style={{
        backgroundSize: "200% 100%",
        animation: hasGenerated ? "gradientShift 2s ease forwards" : "none",
      }}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent shadow-sm"></span>
          <span className="font-medium text-white">Generating magic...</span>
        </div>
      ) : (
        <div className="flex items-center justify-center transition-all duration-300">
          <Wand2
            size={15}
            className={`mr-2 ${hasGenerated ? "animate-pulse" : ""}`}
          />
          <span className="whitespace-nowrap">
            {hasGenerated ? "Descriptions Ready!" : "Generate AI Description"}
          </span>
        </div>
      )}
      <span className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-green-400/20 opacity-0 transition-opacity duration-300 hover:opacity-100"></span>
      {hasGenerated && (
        <style jsx>{`
          @keyframes gradientShift {
            0% {
              background-position: 0% 50%;
            }
            100% {
              background-position: 100% 50%;
            }
          }
          .sparkle-button::before {
            content: "✨";
            position: absolute;
            top: -10px;
            left: 10px;
            font-size: 14px;
            animation: float 2s ease infinite;
          }
          .sparkle-button::after {
            content: "✨";
            position: absolute;
            bottom: -10px;
            right: 10px;
            font-size: 14px;
            animation: float 2s ease infinite 0.5s;
          }
          @keyframes float {
            0%,
            100% {
              transform: translateY(0) rotate(0deg);
            }
            50% {
              transform: translateY(-5px) rotate(15deg);
            }
          }
        `}</style>
      )}
    </Button>
  );
};

export default GenerateDescriptionButton;
