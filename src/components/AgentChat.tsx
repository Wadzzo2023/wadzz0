/* eslint-disable  */
"use client";

import type React from "react";
import { useState, useRef, useEffect } from "react";
import { api } from "~/utils/api";
import {
  MessageCircle,
  X,
  Send,
  Loader2,
  MapPin,
  Calendar,
  ExternalLink,
  Eye,
  ChevronDown,
  Minimize2,
  Trash2,
  Minus,
} from "lucide-react";
import type { EventData } from "~/lib/agent/types";
import { useMapModalStore } from "~/store/map-stores";

interface Message {
  role: "user" | "assistant" | "system";
  content: string;
  events?: EventData[];
  type?: "text" | "events" | "update";
}

interface AgentChatProps {
  setIsOpen?: (value: boolean) => void;
  setPosition?: (pos: google.maps.LatLngLiteral | undefined) => void;
  setPrevData?: (value?: any) => void;
}

export default function AgentChat(props?: AgentChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Wadzzo assistant. How can I help you today?",
    },
  ]);
  const [inputMessage, setInputMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const chatMutation = api.agent.chat.useMutation();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isLoading) return;

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputMessage("");
    setIsOpen(true);

    try {
      const historyWithEvents = messages.map((msg) => ({
        role: msg.role,
        content:
          msg.events && msg.events.length > 0
            ? `${msg.content}\n\nEvents:\n${JSON.stringify(msg.events, null, 2)}`
            : msg.content,
      }));

      const response = await chatMutation.mutateAsync({
        message: inputMessage,
        conversationHistory: historyWithEvents.filter(
          (m) => m.role !== "system",
        ),
      });

      if (response.success) {
        const assistantMessage: Message = {
          role: "assistant",
          content: response.message,
          events: response.events,
          type: response.type as "text" | "events" | "update",
        };
        setMessages((prev) => [...prev, assistantMessage]);
      }
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        type: "text",
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearMessages = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hi! I'm your Wadzzo assistant. How can I help you today?",
      },
    ]);
  };

  return (
    <>
      {/* Minimized Button - Shows when drawer is minimized */}
      {isMinimized && (
        <button
          onClick={() => {
            setIsMinimized(false);
            setIsOpen(true);
          }}
          className="fixed bottom-12 left-1/2 z-40 -translate-x-1/2 translate-y-1/2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl active:scale-95"
        >
          Wadzzo Assistant
        </button>
      )}

      {/* Neon Glowing Input Box - Hidden when minimized */}
      {!isMinimized && (
        <div className="fixed bottom-6 left-1/2 z-40 w-full max-w-2xl -translate-x-1/2 px-4">
          <style>{`
                        @keyframes neon-glow {
                            0%, 100% {
                                box-shadow: 0 0 5px rgba(34, 197, 94, 0.3), 0 0 10px rgba(34, 197, 94, 0.2), inset 0 0 5px rgba(34, 197, 94, 0.1);
                            }
                            50% {
                                box-shadow: 0 0 15px rgba(34, 197, 94, 0.6), 0 0 25px rgba(34, 197, 94, 0.4), inset 0 0 10px rgba(34, 197, 94, 0.2);
                            }
                        }
                        
                        @keyframes border-run {
                            0% {
                                background-position: 0% 50%;
                            }
                            50% {
                                background-position: 100% 50%;
                            }
                            100% {
                                background-position: 0% 50%;
                            }
                        }

                        /* Added four gradient lines that move around the edges */
                        @keyframes gradient-line-top {
                            0% {
                                left: -100%;
                            }
                            100% {
                                left: 100%;
                            }
                        }

                        @keyframes gradient-line-right {
                            0% {
                                top: -100%;
                            }
                            100% {
                                top: 100%;
                            }
                        }

                        @keyframes gradient-line-bottom {
                            0% {
                                right: -100%;
                            }
                            100% {
                                right: 100%;
                            }
                        }

                        @keyframes gradient-line-left {
                            0% {
                                bottom: -100%;
                            }
                            100% {
                                bottom: 100%;
                            }
                        }

                        .neon-input-wrapper {
                            animation: neon-glow 3s ease-in-out infinite, border-run 4s ease-in-out infinite;
                            border: 2px solid rgba(34, 197, 94, 0.5);
                            border-radius: 9999px;
                            background: linear-gradient(90deg, rgba(34, 197, 94, 0.05), rgba(34, 197, 94, 0.1), rgba(34, 197, 94, 0.05));
                            background-size: 200% 100%;
                            position: relative;
                            overflow: hidden;
                        }

                        .neon-input-wrapper::before,
                        .neon-input-wrapper::after {
                            content: '';
                            position: absolute;
                            pointer-events: none;
                        }

                        /* Top gradient line */
                        .neon-input-wrapper::before {
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 2px;
                            background: linear-gradient(90deg, transparent, rgba(34, 197, 94, 0.8), transparent);
                            animation: gradient-line-top 3s ease-in-out infinite;
                        }

                        /* Right gradient line */
                        .gradient-line-right {
                            position: absolute;
                            right: 0;
                            top: 0;
                            width: 2px;
                            height: 100%;
                            background: linear-gradient(180deg, transparent, rgba(34, 197, 94, 0.8), transparent);
                            animation: gradient-line-right 3s ease-in-out infinite;
                            pointer-events: none;
                        }

                        /* Bottom gradient line */
                        .gradient-line-bottom {
                            position: absolute;
                            bottom: 0;
                            left: 0;
                            width: 100%;
                            height: 2px;
                            background: linear-gradient(270deg, transparent, rgba(34, 197, 94, 0.8), transparent);
                            animation: gradient-line-bottom 3s ease-in-out infinite;
                            pointer-events: none;
                        }

                        /* Left gradient line */
                        .gradient-line-left {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 2px;
                            height: 100%;
                            background: linear-gradient(360deg, transparent, rgba(34, 197, 94, 0.8), transparent);
                            animation: gradient-line-left 3s ease-in-out infinite;
                            pointer-events: none;
                        }
                    `}</style>

          <div className="neon-input-wrapper flex items-center gap-2 rounded-full bg-white p-1 shadow-lg backdrop-blur-sm">
            <div className="gradient-line-bottom" />

            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me anything..."
              disabled={chatMutation.isLoading}
              className="flex-1 rounded-full bg-white px-5 py-3 text-sm text-foreground transition-all duration-200 placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
            />

            {/* Send Button */}
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || chatMutation.isLoading}
              className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary px-4 py-3 text-primary-foreground transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
              aria-label="Send message"
            >
              {chatMutation.isLoading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>

            {/* Chevron Down Button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="flex flex-shrink-0 items-center justify-center rounded-full bg-primary/80 px-4 py-3 text-primary-foreground transition-all duration-200 hover:scale-105 hover:shadow-lg active:scale-95"
              aria-label="Toggle chat history"
            >
              <ChevronDown
                className={`h-5 w-5 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
      )}

      {/* Chat History Drawer */}
      {isOpen && !isMinimized && (
        <>
          {/* Backdrop */}
          {/* <div
                        className="fixed inset-0 z-30 bg-black/40 backdrop-blur-md transition-opacity duration-300 animate-in fade-in"
                        onClick={() => setIsOpen(false)}
                    /> */}

          {/* Chat Drawer - Adjusted bottom position to prevent overlap with input box */}
          <div className="fixed inset-x-0 bottom-24 z-40 mx-auto flex h-[80vh] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-background shadow-2xl duration-300 animate-in slide-in-from-bottom-5 sm:bottom-24 md:h-[70vh]">
            {/* Header */}
            <div className="flex items-center justify-between bg-primary px-6 py-3 text-primary-foreground sm:rounded-t-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-foreground/20 backdrop-blur-sm">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold">Wadzzo Assistant</h3>
                  <p className="text-xs text-white/80">Powered by AI</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleClearMessages}
                  className="rounded-full p-2 transition-colors hover:bg-white/20 active:bg-white/30"
                  aria-label="Clear chat"
                  title="Clear"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => {
                    setIsMinimized(true);
                    setIsOpen(false);
                  }}
                  className="rounded-full p-2 transition-colors hover:bg-white/20 active:bg-white/30"
                  aria-label="Minimize chat"
                  title="Minimize"
                >
                  <Minus className="h-5 w-5" />
                </button>

                <button
                  onClick={() => setIsOpen(false)}
                  className="rounded-full p-2 transition-colors hover:bg-white/20 active:bg-white/30"
                  aria-label="Close chat"
                  title="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Messages Container */}
            <div className="flex-1 space-y-4 overflow-y-auto bg-gradient-to-b from-background via-background to-background/80 p-6">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className="duration-300 animate-in fade-in slide-in-from-bottom-2"
                >
                  {message.role === "user" ? (
                    <div className="flex justify-end">
                      <div className="max-w-[75%] rounded-3xl rounded-tr-lg bg-primary px-5 py-3 text-primary-foreground shadow-lg">
                        <p className="whitespace-pre-wrap break-words text-sm font-medium leading-relaxed">
                          {message.content}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {message.content && (
                        <div className="flex justify-start">
                          <div className="max-w-[75%] rounded-3xl rounded-tl-lg bg-muted px-5 py-3 text-muted-foreground shadow-md">
                            <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                              {message.content}
                            </p>
                          </div>
                        </div>
                      )}
                      {message.events && message.events.length > 0 && (
                        <div className="grid grid-cols-1 gap-3 space-y-2 md:grid-cols-2">
                          {message.events.map((event, eventIndex) => (
                            <EventCard
                              key={eventIndex}
                              event={event}
                              storeSetters={props}
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
              {chatMutation.isLoading && (
                <div className="flex justify-start animate-in fade-in">
                  <div className="rounded-3xl rounded-tl-lg bg-muted px-5 py-3 shadow-md">
                    <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        </>
      )}
    </>
  );
}

function EventCard({
  event,
  storeSetters,
}: {
  event: EventData;
  storeSetters?: AgentChatProps;
}) {
  const defaultStore = useMapModalStore();

  const setIsOpen = storeSetters?.setIsOpen ?? defaultStore.setIsOpen;
  const setPosition = storeSetters?.setPosition ?? defaultStore.setPosition;
  const setPrevData = storeSetters?.setPrevData ?? defaultStore.setPrevData;

  const handleCreatePin = () => {
    setPosition({
      lat: event.latitude,
      lng: event.longitude,
    });

    setPrevData({
      title: event.title,
      description: event.description,
      lat: event.latitude,
      lng: event.longitude,
      startDate: new Date(event.startDate),
      endDate: new Date(event.endDate),
      url: event.url,
      autoCollect: event.autoCollect ?? false,
      pinCollectionLimit: event.pinCollectionLimit ?? 1,
      pinNumber: event.pinNumber ?? 1,
      radius: event.radius ?? 50,
    });

    setIsOpen(true);
  };

  const handleViewOnMap = () => {
    setPosition({
      lat: event.latitude,
      lng: event.longitude,
    });
  };

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-md transition-all duration-200 hover:border-blue-500/50 hover:shadow-lg">
      <div className="flex flex-col justify-between p-4">
        <h4 className="mb-2 text-sm font-bold text-card-foreground">
          {event.title}
        </h4>
        {event.venue && (
          <p className="mb-2 text-xs font-medium text-muted-foreground">
            {event.venue}
          </p>
        )}
        <p className="mb-3 line-clamp-2 text-xs text-card-foreground">
          {event.description}
        </p>

        <div className="mb-2 flex items-start gap-2 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span className="line-clamp-1">
            {event.address ??
              `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`}
          </span>
        </div>

        <div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>
            {new Date(event.startDate).toLocaleDateString()} -{" "}
            {new Date(event.endDate).toLocaleDateString()}
          </span>
        </div>

        {(event.pinCollectionLimit !== 1 ||
          event.pinNumber !== 1 ||
          (event.autoCollect ?? false) ||
          (event.multiPin ?? false) ||
          (event.radius && event.radius !== 50)) && (
          <div className="mb-3 rounded-lg border border-border bg-accent p-3 text-xs">
            <p className="mb-2 font-semibold text-accent-foreground">
              Pin Configuration:
            </p>
            <div className="space-y-1 text-accent-foreground/80">
              {event.pinNumber && event.pinNumber !== 1 && (
                <p>• Pins: {event.pinNumber}</p>
              )}
              {event.pinCollectionLimit && event.pinCollectionLimit !== 1 && (
                <p>• Collection Limit: {event.pinCollectionLimit}</p>
              )}
              {event.radius && event.radius !== 50 && (
                <p>• Radius: {event.radius}m</p>
              )}
              {event.autoCollect && <p>• Auto Collect: Yes</p>}
              {event.multiPin && <p>• Multi Pin: Yes</p>}
            </div>
          </div>
        )}

        <div className="flex gap-2 ">
          <button
            onClick={handleCreatePin}
            className="flex-1 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground transition-all duration-200 hover:shadow-md active:scale-95"
          >
            Create
          </button>
          <button
            onClick={handleViewOnMap}
            className="flex items-center justify-center gap-1 rounded-lg border border-primary px-3 py-2 text-xs font-semibold text-primary transition-all duration-200 hover:bg-accent active:scale-95"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded-lg border border-border px-3 py-2 text-xs font-semibold text-muted-foreground transition-all duration-200 hover:bg-muted active:scale-95"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
