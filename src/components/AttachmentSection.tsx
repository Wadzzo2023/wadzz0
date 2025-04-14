import React, { useState } from "react";
import Image from "next/image";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import CustomPlayer from "./CustomPlayer";
import { Button } from "./shadcn/ui/button";
import { Download } from "lucide-react";
import { downloadAttachment } from "~/utils/utils";

interface Attachment {
    name: string;
    url: string;
    type: string;
}

interface AttachmentSectionProps {
    title?: string;
    attachments?: Attachment[];
}

const AttachmentSection: React.FC<AttachmentSectionProps> = ({ title, attachments }) => {

    const [loading, setLoading] = useState(false);
    if (!attachments || attachments.length === 0) return null;
    const handleDownload = async (fileName: string, fileUrl: string) => {
        setLoading(true);
        await downloadAttachment(fileUrl, fileName);
        setLoading(false);
    };
    return (
        <div className="rounded-lg bg-secondary p-2">

            <h2 className="mb-4 text-2xl font-semibold text-primary">{title}</h2>


            <div className="space-y-4">
                {attachments.map((attachment, idx) => (
                    <div key={idx} className="rounded-md bg-background p-4 shadow-sm">
                        <div className="flex justify-between">
                            <h3 className="mb-2 text-lg font-medium">{attachment.name}</h3>
                            <Button variant="outline" onClick={() => handleDownload(attachment.name, attachment.url)}>
                                {loading ? <div role="status">
                                    <svg aria-hidden="true" className="inline w-4 h-4 text-gray-200 animate-spin dark:text-gray-600 fill-blue-600" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
                                        <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
                                    </svg>
                                    <span className="sr-only">Loading...</span>
                                </div> : <Download size={16} className="mr-1" />}   Download
                            </Button>
                        </div>
                        {attachment.type.startsWith("audio/") && (
                            <AudioPlayer
                                src={attachment.url}
                                className="rounded-md"
                                customAdditionalControls={[]}
                            />
                        )}
                        {attachment.type.startsWith("video/") && (
                            <CustomPlayer url={attachment.url} />
                        )}
                        {attachment.type.startsWith("image/") && (
                            <Image
                                src={attachment.url}
                                alt={attachment.name}
                                width={500}
                                height={300}
                                className="rounded-md object-cover"
                            />
                        )}
                        {(attachment.type.startsWith("application/") || attachment.type.startsWith("text/")) && (
                            <iframe
                                src={`https://docs.google.com/gview?url=${attachment.url}&embedded=true`}
                                className="h-[400px] w-full rounded-md border-none"
                                sandbox="allow-same-origin allow-scripts"
                            />
                        )}
                    </div>
                ))}
            </div>

        </div>
    );
};

export default AttachmentSection;

