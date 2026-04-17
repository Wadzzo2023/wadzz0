"use client";

import { type MutableRefObject, useEffect, useRef, useState } from "react";
import { ArrowLeft, Loader2, Paperclip, Plus, Search, Send, Smile, Trash } from "lucide-react";
import { UserRole } from "@prisma/client";
import { cn } from "~/lib/utils";
import { z } from "zod";
import Link from "next/link";
import { api } from "~/utils/api";
import { addrShort } from "~/utils/utils";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/shadcn/ui/avatar";
import { ScrollArea } from "~/components/shadcn/ui/scroll-area";
import { Input } from "~/components/shadcn/ui/input";
import { Button } from "~/components/shadcn/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/shadcn/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/shadcn/ui/popover";
import Avater from "~/components/ui/avater";
import { toast } from "~/hooks/use-toast";
import { AnimatePresence, motion } from "framer-motion";
import { MultiUploadS3Button } from "~/pages/test";

type BountyDoubtListItem = {
  id: number;
  bountyId: number;
  userId: string;
  createdAt: Date;
  winnerCount?: number;
  user: {
    name: string | null;
    id: string;
    image: string | null;
    email: string | null;
  };
};

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

const Chat = ({ bountyId }: { bountyId: number }) => {
  const { data: listBountyDoubt } = api.bounty.Bounty.listBountyDoubts.useQuery({
    bountyId: Number(bountyId),
  });
  const [selectedDoubt, setSelectedDoubt] = useState<BountyDoubtListItem | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");

  const filteredDoubts = (listBountyDoubt ?? []).filter((item) => {
    const query = searchTerm.toLowerCase();
    return (
      item.user.id.toLowerCase().includes(query) ||
      (item.user.email?.toLowerCase().includes(query) ?? false) ||
      (item.user.name?.toLowerCase().includes(query) ?? false)
    );
  });

  if (!listBountyDoubt) return null;

  return (
    <div className="flex h-full w-full flex-col bg-white text-slate-900">
      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-3">
        <div className="flex items-center gap-2">
          {mobileView === "chat" && selectedDoubt ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 md:hidden"
              onClick={() => setMobileView("list")}
              aria-label="Back to users"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          ) : null}
          <h2 className="text-base font-medium text-slate-900">
            {mobileView === "chat" && selectedDoubt ? "Chat" : "Users"}
          </h2>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button
              size="icon"
              variant="outline"
              className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
            >
              <Plus className="h-4 w-4" />
              <span className="sr-only">New chat</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="border-slate-200 bg-white text-slate-900 sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>New chat</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mb-4"
              />
              <ScrollArea className="h-[300px]">
                {filteredDoubts.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => {
                      setIsDialogOpen(false);
                      setSelectedDoubt(item);
                      setMobileView("chat");
                    }}
                    className="flex cursor-pointer items-center gap-3 rounded-lg p-2 hover:bg-slate-100"
                  >
                    <Avater
                      url={item.user.image}
                      className="h-10 w-10"
                      winnerCount={item.winnerCount}
                    />
                    <div>
                      <p className="font-medium text-slate-900">{addrShort(item.user.id, 5)}</p>
                      <p className="text-sm text-muted-foreground">{item.user.email ?? "No email"}</p>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex min-h-0 flex-1 flex-col md:flex-row">
        <aside
          className={cn(
            "min-h-0 border-r border-slate-200 bg-white md:w-80",
            mobileView === "chat" ? "hidden md:flex md:flex-col" : "flex flex-col",
          )}
        >
          <div className="border-b border-slate-200 px-4 py-3">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <ScrollArea className="h-[calc(min(78vh,720px)-122px)]">
            <div className="space-y-2 p-2">
              {filteredDoubts.length === 0 ? (
                <div className="flex h-40 w-full items-center justify-center">
                  <p className="text-center text-sm font-medium text-muted-foreground">No chats available</p>
                </div>
              ) : (
                filteredDoubts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedDoubt(item);
                      setMobileView("chat");
                    }}
                    className={cn(
                      "flex w-full items-center justify-start gap-3 rounded-md border p-2 text-left transition-colors",
                      selectedDoubt?.id === item.id
                        ? "border-blue-300 bg-blue-50"
                        : "border-slate-200 bg-white hover:bg-slate-100",
                    )}
                  >
                    <Avater
                      url={item.user.image}
                      className="h-10 w-10"
                      winnerCount={item.winnerCount}
                    />
                    <div className="flex min-w-0 flex-col items-start overflow-hidden">
                      <p className="font-medium text-slate-900">{addrShort(item.user.id, 5)}</p>
                      <p className="w-full truncate text-sm text-muted-foreground">{item.user.email ?? "No email"}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </ScrollArea>
        </aside>

        <div className={cn("min-h-0 flex-1", mobileView === "list" ? "hidden md:block" : "block")}>
          {!selectedDoubt ? (
            <div className="flex h-full items-center justify-center p-4">
              <p className="text-center text-sm font-medium text-muted-foreground">
                Select a chat or start a new conversation
              </p>
            </div>
          ) : (
            <ChatItem item={selectedDoubt} />
          )}
        </div>
      </div>
    </div>
  );
};

const ChatItem = ({ item }: { item: BountyDoubtListItem }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [media, setMedia] = useState<SubmissionMediaInfoType[]>([]);
  const [progress, setProgress] = useState(0);
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const messagesEndRef: MutableRefObject<HTMLDivElement | null> = useRef(null);

  const { data: oldMessage, isSuccess: oldMessageSucess } =
    api.bounty.Bounty.getBountyForUserCreator.useQuery({
      bountyId: Number(item.bountyId),
      userId: item.userId,
    });

  const NewMessageMutation =
    api.bounty.Bounty.createUpdateBountyDoubtForCreatorAndUser.useMutation();

  const removeMediaItem = (index: number) => {
    setMedia((prevMedia) => prevMedia.filter((_, i) => i !== index));
  };

  const addMediaItem = (url: string, name: string, size: number, type: string) => {
    setMedia((prevMedia) => [...prevMedia, { url, name, size, type }]);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (input.length === 0 && media.length === 0) return;

    try {
      await NewMessageMutation.mutateAsync({
        chatUserId: item.userId,
        bountyId: Number(item.bountyId),
        content: input,
        role: UserRole.CREATOR,
        media: media.length > 0 ? media : undefined,
      });

      setMessages((prevMessages: Message[]) => [
        ...prevMessages,
        { role: UserRole.CREATOR, message: input },
      ]);
      setInput("");
      setMedia([]);
    } catch (error) {
      console.error("Error sending message with media:", error);
      toast({
        title: "Error sending message",
        description: "An error occurred while sending your message. Please try again.",
      });
    }
  };

  useEffect(() => {
    if (oldMessage && oldMessageSucess) {
      setMessages(oldMessage);
    }
  }, [oldMessage, oldMessageSucess]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, uploadingFile, media]);

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex items-center space-x-3 border-b border-slate-200 bg-white px-4 py-3">
        <Avatar>
          <AvatarImage src={item.user.image ?? ""} alt="User avatar" />
          <AvatarFallback>{item.user.id.slice(0, 2)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="text-sm font-medium leading-none text-slate-900">{addrShort(item.user.id, 5)}</p>
          <p className="text-sm text-muted-foreground">{item.user.email ?? "No email"}</p>
        </div>
      </div>

      <ScrollArea className="min-h-0 flex-1 bg-white">
        <div className="scrollbar-thin scrollbar-thumb-slate-200 space-y-4 overflow-y-auto p-4 pr-2">
          <AnimatePresence>
            {messages?.map((message, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className={cn("flex w-full", message.role === UserRole.CREATOR ? "justify-end" : "justify-start")}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-xl px-3 py-2 text-sm md:max-w-[75%]",
                    message.role === UserRole.CREATOR
                      ? "rounded-br-sm bg-blue-500 text-white"
                      : "rounded-bl-sm bg-slate-100 text-slate-800",
                  )}
                >
                  <p className="whitespace-pre-line break-words">
                    {sanitizeInput(message.message).sanitizedInput}
                  </p>
                  {sanitizeInput(message.message).urls?.map((url, urlIndex) => (
                    <Link
                      key={urlIndex}
                      href={url}
                      className="mt-2 flex items-center gap-2 rounded-md bg-white/60 p-2 text-xs text-blue-700 hover:underline"
                    >
                      <Paperclip className="h-3.5 w-3.5" />
                      <span className="truncate">{shortURL(url)}</span>
                    </Link>
                  ))}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {media.map((file, index) => (
            <div key={index} className="ml-auto flex max-w-[75%] items-center justify-between gap-2 rounded-md bg-blue-500 p-2 text-white">
              <Paperclip className="h-4 w-4" />
              <span className="truncate text-xs">{shortFileName(file.name)}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 rounded-full p-0"
                onClick={() => removeMediaItem(index)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          ))}

          {uploadingFile && (
            <div className="ml-auto flex max-w-[75%] flex-col gap-2 rounded-md bg-blue-500 p-2 text-white">
              <div className="flex items-center justify-between">
                <Paperclip className="h-4 w-4" />
                <span className="truncate text-xs">{shortFileName(uploadingFile.name)}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 rounded-full p-0"
                  onClick={() => setUploadingFile(null)}
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
              <div className="h-1 w-full overflow-hidden rounded-full bg-primary-foreground/20">
                <div
                  className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="border-t border-slate-200 bg-slate-50 px-4 py-3">
        <form onSubmit={handleSubmit} className="flex w-full items-center gap-2">
          <MultiUploadS3Button
            endpoint="multiBlobUploader"
            onUploadProgress={(nextProgress) => setProgress(nextProgress)}
            onClientUploadComplete={(res) => {
              toast({
                title: "Upload complete",
                description: "File uploaded successfully",
              });
              setUploadingFile(null);
              const data = res[0];
              if (data?.url) {
                addMediaItem(data.url, data.name, data.size, data.type);
              }
              setLoading(false);
            }}
            onUploadError={() => {
              setLoading(false);
              toast({
                title: "Upload failed",
                description: "An error occurred while uploading the file",
              });
            }}
            onBeforeUploadBegin={(files) => {
              setLoading(true);
              setUploadingFile(files[0] ?? null);
              return files;
            }}
          />

          <div className="flex w-full gap-2">
            <div className="relative w-full">
              <Input
                id="message"
                placeholder="Type your message..."
                className="h-10 w-full rounded-xl border-slate-200 bg-white pr-10 text-slate-900 placeholder:text-slate-400"
                autoComplete="off"
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
              <Popover>
                <PopoverTrigger asChild>
                  <button
                    type="button"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-slate-500 hover:bg-slate-100"
                  >
                    <Smile className="h-4 w-4" />
                  </button>
                </PopoverTrigger>
                <PopoverContent className="w-auto border-slate-200 bg-white p-2">
                  <div className="grid grid-cols-6 gap-1">
                    {["??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??", "??"].map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        className="rounded p-1 text-lg hover:bg-slate-100"
                        onClick={() => setInput((prev) => `${prev}${emoji}`)}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <Button
              type="submit"
              size="icon"
              className="h-10 w-10 rounded-xl bg-[#1f86ee] text-white hover:bg-[#1877da]"
              disabled={loading || (input.trim().length === 0 && media.length === 0) || NewMessageMutation.isLoading}
            >
              {NewMessageMutation.isLoading ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Number.POSITIVE_INFINITY, ease: "linear" }}
                >
                  <Loader2 className="h-4 w-4" />
                </motion.div>
              ) : (
                <Send className="h-4 w-4" />
              )}
              <span className="sr-only">Send</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const shortFileName = (fileName: string) => {
  const shortName = fileName.split(".")[0];
  const extension = fileName.split(".")[1];
  if (shortName && shortName.length > 20) {
    return `${shortName.slice(0, 20)}...${extension}`;
  }
  return fileName;
};

const shortURL = (url: string) => {
  if (url.length > 30) {
    return `${url.slice(0, 30)}...`;
  }
  return url;
};

function sanitizeInput(input: string) {
  const regex = /https:\/\/[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}(\/[^\s]*)?/g;
  const urlMatches = input.match(regex) ?? [];
  const sanitizedInput = input.replace(regex, "").trim();

  return {
    sanitizedInput,
    urls: urlMatches.length ? urlMatches : null,
  };
}

export default Chat;
