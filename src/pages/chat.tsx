"use client";

import { useChat } from "@ai-sdk/react";
import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
import { Button } from "~/components/shadcn/ui/button";
import { Input } from "~/components/shadcn/ui/input";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/shadcn/ui/card";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "~/components/shadcn/ui/avatar";
import { ScrollArea } from "~/components/shadcn/ui/scroll-area";
import { MemoizedMarkdown } from "~/components/memoized-markdown";
import { UploadS3Button } from "./test";
import toast from "react-hot-toast";

export default function FormFillingAgent() {
  const { messages, input, handleInputChange, handleSubmit, isLoading } =
    useChat({
      body: {
        sessionId: "vongCongForm",
      },
    });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  const [url, setUrl] = useState("");

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messagesEndRef]); // Updated dependency

  const handleFileUpload = (value: string) => {
    setUrl(value);
    // here pass the vlaues to the handleInputChange
    handleInputChange({
      target: { value: `${input} \n assetImage: ${value}` },
    } as React.ChangeEvent<HTMLInputElement>);

    // setTimeout(() => {
    //   handleSubmit(new Event("submit", { bubbles: true, cancelable: true }));
    // }, 100);
  };

  // Handle hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (url) {
      handleSubmit(new Event("submit", { bubbles: true, cancelable: true }));
    }
  }, [url]);

  if (!mounted) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 p-4 dark:bg-gray-900">
      <Card className="w-full max-w-4xl shadow-lg">
        <CardHeader className="border-b">
          <CardTitle className="text-xl font-bold">FormFilling Agent</CardTitle>
        </CardHeader>

        <ScrollArea className="h-[60vh]">
          <CardContent className="space-y-4 p-6">
            {messages.length === 0 ? (
              <div className="flex h-40 flex-col items-center justify-center text-center text-muted-foreground">
                <p>No messages yet. Start a conversation!</p>
              </div>
            ) : (
              messages.map((message) => (
                <Message
                  key={message.id}
                  message={message}
                  handleUpload={handleFileUpload}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </CardContent>
        </ScrollArea>

        <CardFooter className="border-t p-4">
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}

function Message({
  message,
  handleUpload,
}: {
  message: { id: string; role: string; content: string };
  handleUpload: (value: string) => void;
}) {
  const upload = extractUploadField(message.content);
  const confirmation = confirmationMatch(message.content);
  return (
    <div
      className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
    >
      <div className="flex max-w-[80%] items-start gap-3">
        {message.role !== "user" && (
          <Avatar className="mt-1 h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="AI" />
            <AvatarFallback className="bg-primary text-primary-foreground">
              AI
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={` rounded-lg px-4 py-2 ${message.role === "user" ? "bg-slate-400" : "bg-muted"}`}
        >
          <div className="prose space-y-2">
            <MemoizedMarkdown id={message.id} content={message.content} />
            {upload && (
              <UploadS3Button
                endpoint="imageUploader"
                onClientUploadComplete={(res) => {
                  const data = res;

                  if (data?.url) {
                    // setThumbnail(data.url);
                    // setValue("thumbnail", data.url);
                    handleUpload(data.url);
                  }
                }}
                onUploadError={(error: Error) => {
                  // Do something with the error.
                  toast.error(`ERROR! ${error.message}`);
                }}
              />
            )}
            {confirmation && <Button>Confirm</Button>}
          </div>
        </div>

        {message.role === "user" && (
          <Avatar className="mt-1 h-8 w-8">
            <AvatarImage src="/placeholder.svg?height=32&width=32" alt="User" />
            <AvatarFallback className="bg-zinc-500 text-zinc-50">
              U
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </div>
  );
}

function extractUploadField(text: string) {
  const match = text.match(/UPLOAD_FIELD:([^\s]+)/);
  return match ? match[1] : null;
}

function confirmationMatch(text: string): boolean {
  return text.includes("PLEASE_CONFIRM");
  // return /ASK_CONFIRMATION:([^\s]+)/.test(text);
}
