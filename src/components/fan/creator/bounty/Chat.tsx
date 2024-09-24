"use client";

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "~/components/shadcn/ui/tabs";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";
import { MutableRefObject, useEffect, useRef, useState } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/shadcn/ui/card";
import { Input } from "~/components/shadcn/ui/input";
import { File, Paperclip, Plus, Send, Trash, Upload } from "lucide-react";
import { UserRole } from "@prisma/client";
import { cn } from "~/lib/utils";
import { Button } from "~/components/shadcn/ui/button";
import { UploadButton } from "~/utils/uploadthing";
import toast from "react-hot-toast";
import { z } from "zod";
import Link from "next/link";
import {
  Dialog,
  DialogHeader,
  DialogTrigger,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from "~/components/shadcn/ui/dialog";

type BountyDoubtListItem = {
  id: number;
  bountyId: number;
  userId: string;
  createdAt: Date;
  user: {
    name: string | null;
    id: string;
    image: string | null;
    email: string | null;
  };
};

const Chat = ({ bountyId }: { bountyId: number }) => {
  const { data: listBountyDoubt } = api.bounty.Bounty.listBountyDoubts.useQuery(
    {
      bountyId: Number(bountyId),
    },
  );
  const [selectedDoubt, setSelectedDoubt] =
    useState<BountyDoubtListItem | null>(null);

  console.log(listBountyDoubt);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleDialogSelect = (item: BountyDoubtListItem) => {
    setSelectedDoubt(item); // Set the selected item
    setIsDialogOpen(false); // Close the dialog
  };
  if (!listBountyDoubt) return null;
  return (
    <div className=" h-full w-full">
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogTrigger>
          <Button
            size="icon"
            variant="outline"
            className="ml-auto rounded-full md:hidden"
            onClick={() => setIsDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            <span className="sr-only">New message</span>
          </Button>
        </DialogTrigger>
        <DialogContent className="gap-0 p-0 outline-none">
          <DialogHeader className="px-4 pb-4 pt-5">
            <DialogTitle>New message</DialogTitle>
            <DialogDescription>
              Invite a user to this thread. This will create a new group
              message.
            </DialogDescription>
          </DialogHeader>

          <div className="overflow-hidden rounded-t-none border-t p-2 px-4">
            {listBountyDoubt.map((item) => (
              <div
                onClick={() => handleDialogSelect(item)}
                key={item.user.email}
                className="flex items-center border-b-2 p-2 "
              >
                <Avatar>
                  <AvatarImage src={item.user.image ?? ""} alt="Image" />
                  <AvatarFallback className="bg-red-300">
                    {item.user.id.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>
                <div className="ml-2">
                  <p className="text-sm font-medium leading-none">
                    {addrShort(item.user.id, 5)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {item.user.email ? item.user.email : "Default"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Tabs className="flex w-full">
        <TabsList className=" hidden max-h-[455px] min-h-[455px] w-60 flex-col  items-start     justify-start px-0    md:flex ">
          {listBountyDoubt.length === 0 && (
            <div className="flex h-full w-full items-center justify-center">
              <p className="w-full text-center  text-lg font-bold">
                No User Available
              </p>
            </div>
          )}

          {listBountyDoubt?.map((item: BountyDoubtListItem) => {
            return (
              <TabsTrigger
                key={item.id}
                value={item.id.toString()}
                onClick={() => setSelectedDoubt(item)} // Update selectedDoubt when tab is clicked
                className="flex w-full flex-row items-center justify-start gap-4 border-2  p-4  text-[#575759] hover:bg-[#dcdc2c]"
              >
                <Avatar>
                  <AvatarImage src={item.user.image ?? ""} alt="Image" />
                  <AvatarFallback className="bg-red-300">
                    {item.user.id.slice(0, 2)}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col items-start ">
                  <p className="text-sm font-bold">
                    {addrShort(item.user.id, 5)}
                  </p>
                  <p className="text-xs text-gray-500">
                    {item.createdAt.toLocaleString()}
                  </p>
                </div>
              </TabsTrigger>
            );
          })}
        </TabsList>{" "}
        <div className="w-full">
          {!selectedDoubt && (
            <div className="flex h-full w-full items-center justify-center">
              <p className="w-full text-center  text-lg font-bold">
                Select a user to start chat
              </p>
            </div>
          )}
          {listBountyDoubt?.map((item: BountyDoubtListItem) => (
            <TabsContent
              key={item.id}
              value={item.id.toString()}
              className="m-0 h-full p-0"
            >
              <ChatItem item={selectedDoubt ?? item} />
            </TabsContent>
          ))}
        </div>
      </Tabs>
    </div>
  );
};
export default Chat;

type Message = {
  role: UserRole;
  message: string;
};

export const SubmissionMediaInfo = z.object({
  url: z.string(),
  name: z.string(),
  size: z.number(),
  type: z.string(),
});
type SubmissionMediaInfoType = z.TypeOf<typeof SubmissionMediaInfo>;

const ChatItem = ({ item }: { item: BountyDoubtListItem }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesEndRef: MutableRefObject<HTMLDivElement | null> =
    useRef<HTMLDivElement | null>(null);
  const [media, setMedia] = useState<SubmissionMediaInfoType[]>([]);
  const [progress, setProgress] = useState<number>(0);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const inputLength = input.trim().length;
  const { data: oldMessage, isSuccess: oldMessageSucess } =
    api.bounty.Bounty.getBountyForUserCreator.useQuery({
      bountyId: Number(item.bountyId),
      userId: item.userId,
    });
  const removeMediaItem = (index: number) => {
    setMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
  };
  const addMediaItem = (
    url: string,
    name: string,
    size: number,
    type: string,
  ) => {
    setMedia((prevMedia) => [...prevMedia, { url, name, size, type }]);
  };
  const utils = api.useUtils();
  const NewMessageMutation =
    api.bounty.Bounty.createUpdateBountyDoubtForCreatorAndUser.useMutation({
      onSuccess: () => {
        utils.bounty.Bounty.getBountyForUserCreator.invalidate().catch((e) => {
          console.log(e);
        });
      },
    });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Ensure that there is either a message or media to send
    if (input.length === 0 && media.length === 0) return;

    try {
      // Construct the message payload
      const messagePayload = {
        chatUserId: item.userId,
        bountyId: Number(item.bountyId),
        content: input, // Text message
        role: UserRole.CREATOR,
        media: media.length > 0 ? media : undefined,
      };

      // Make the API call to submit the message along with media
      const newMessage = await NewMessageMutation.mutateAsync(messagePayload);

      // Update the local messages state to include the new message
      setMessages((prevMessages: Message[]) => [
        ...prevMessages,
        { role: UserRole.CREATOR, message: input },
      ]);

      // Clear input and media after submission
      setInput("");
      setMedia([]);
    } catch (error) {
      console.error("Error sending message with media:", error);
      toast.error("Failed to send message.");
    }
  };

  useEffect(() => {
    if (oldMessage && oldMessageSucess) {
      setMessages(oldMessage);
    }
  }, [oldMessage, oldMessageSucess]);
  console.log(messages);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };
  console.log("oldMessage", oldMessage);
  // Call scrollToBottom on initial render and whenever new content is added
  useEffect(() => {
    scrollToBottom();
  }, [messages, uploadingFile, media]);
  return (
    <Card>
      <CardHeader className="flex h-full flex-row items-center border-b-2 p-4">
        <div className="flex items-center space-x-4 ">
          <Avatar>
            <AvatarImage src={item.user.image ?? ""} alt="Image" />
            <AvatarFallback className="bg-red-300">
              {item.user.id.slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium leading-none">
              {addrShort(item.user.id, 5)}
            </p>
            <p className="text-sm text-muted-foreground">
              {item.user.email ? item.user.email : "Default"}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="py-2">
        <div className="max-h-[300px] min-h-[300px] space-y-4 overflow-y-auto">
          {messages?.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex  max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
                message.role === UserRole.CREATOR
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-muted",
              )}
            >
              {sanitizeInput(message.message).sanitizedInput}
              {// Display all matched URLs as links
              sanitizeInput(message.message).urls?.map((url, index) => (
                <div
                  key={index}
                  className=" w-full rounded-md bg-[#F5F7FB] py-2  shadow-sm"
                >
                  <Link
                    href={url}
                    className="flex items-center justify-between gap-2"
                  >
                    <File color="black" />{" "}
                    <span className=" text-base font-medium text-[#07074D]">
                      {url}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          ))}
          <div ref={messagesEndRef} />
          {media.length > 0 &&
            media.map((item, index) => (
              <div
                key={index}
                className=" mt-2 w-full rounded-md border-2  bg-[#F5F7FB] px-8 py-2 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="truncate text-base font-medium text-[#07074D]">
                    {shortFileName(item.name)}
                  </span>
                  <button
                    className="text-[#07074D]"
                    onClick={() => removeMediaItem(index)}
                  >
                    <Trash size={15} />
                  </button>
                </div>
              </div>
            ))}
          {uploadingFile && (
            <div className="w-full rounded-md bg-[#F5F7FB] px-8 py-4 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="truncate text-base font-medium text-[#07074D]">
                  {shortFileName(uploadingFile.name)}
                </span>{" "}
                <button
                  className="text-[#07074D]"
                  onClick={() => setUploadingFile(null)}
                >
                  <Trash size={15} />
                </button>
              </div>
              {/* Progress bar for the uploading file */}
              <div className="relative mt-5 h-[6px] w-full rounded-lg bg-[#E2E5EF]">
                <div
                  className="absolute left-0 h-full rounded-lg bg-[#6A64F1]"
                  style={{ width: `${progress}%` }} // Update progress bar
                ></div>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="">
        <form
          onSubmit={handleSubmit}
          className="flex w-full items-center gap-1 space-x-2 "
        >
          <div className="flex w-full items-center gap-5">
            <UploadButton
              endpoint="SubmissionImageUploader"
              appearance={{
                button: {
                  padding: "0px",

                  width: "40px",
                },
                container: {
                  width: "5px",
                  padding: "0px",
                  background: "white",
                },
                allowedContent: {
                  display: "none",
                },
              }}
              content={{
                button: (
                  <div className="flex items-center justify-center rounded-md p-1 ">
                    <Paperclip size={25} />
                  </div>
                ),
                allowedContent: "Max (1024MB)",
              }}
              onUploadProgress={(progress) => {
                setProgress(progress);
              }}
              onClientUploadComplete={(res) => {
                toast.success("Media uploaded");
                setUploadingFile(null); // Reset uploading file
                const data = res[0];
                console.log(data);
                if (data?.url) {
                  addMediaItem(data.url, data.name, data.size, data.type);
                }
              }}
              onBeforeUploadBegin={(files) => {
                setUploadingFile(files[0] ?? null); // Set the first file being uploaded (or you can handle multiple files as needed)
                setProgress(0); // Reset progress to 0 when a new file starts uploading
                return files; // Ensure you return the files array to satisfy the type requirements
              }}
              onUploadError={(error: Error) => {
                toast.error(error.message);
              }}
              className="custom-upload-button"
            />

            <Input
              id="message"
              placeholder="Type your message..."
              className="flex-1"
              autoComplete="off"
              value={input}
              onChange={(event) => setInput(event.target.value)}
            />
          </div>

          <Button
            type="submit"
            size="icon"
            disabled={inputLength === 0 || NewMessageMutation.isLoading}
          >
            <Send className="h-4 w-4" />
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </CardFooter>
    </Card>
  );
};
const shortFileName = (fileName: string) => {
  const shortFileName = fileName.split(".")[0];
  const extension = fileName.split(".")[1];
  if (shortFileName && shortFileName.length > 20) {
    return `${shortFileName?.slice(0, 20)}...${extension}`;
  }
  return fileName;
};

const shortURL = (url: string) => {
  if (url.length > 30) {
    return `${url.slice(0, 20)}...`;
  }
  return url;
};

function sanitizeInput(input: string) {
  const regex = /https:\/\/utfs\.io\/f\/[\w-]+\.\w+/g;

  const urlMatches = input.match(regex) ?? [];

  const sanitizedInput = input.replace(regex, "").trim();

  return {
    sanitizedInput,
    urls: urlMatches.length ? urlMatches : null,
  };
}
