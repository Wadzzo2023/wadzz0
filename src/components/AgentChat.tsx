"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { api } from "~/utils/api"
import { MessageCircle, X, Send, Loader2, MapPin, Calendar, ExternalLink, Eye } from "lucide-react"
import { useMapModalStore } from "~/pages/maps"
import type { EventData } from "~/lib/agent/types"

interface Message {
  role: "user" | "assistant" | "system"
  content: string
  events?: EventData[]
  type?: "text" | "events" | "update"
}

export default function AgentChat() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hi! I'm your Wadzzo assistant. How can I help you today?",
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const chatMutation = api.agent.chat.useMutation()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || chatMutation.isLoading) return

    const userMessage: Message = {
      role: "user",
      content: inputMessage,
    }

    setMessages((prev) => [...prev, userMessage])
    setInputMessage("")

    try {
      const historyWithEvents = messages.map((msg) => ({
        role: msg.role,
        content:
          msg.events && msg.events.length > 0
            ? `${msg.content}\n\nEvents:\n${JSON.stringify(msg.events, null, 2)}`
            : msg.content,
      }))

      const response = await chatMutation.mutateAsync({
        message: inputMessage,
        conversationHistory: historyWithEvents.filter((m) => m.role !== "system"),
      })

      if (response.success) {
        const assistantMessage: Message = {
          role: "assistant",
          content: response.message,
          events: response.events,
          type: response.type as "text" | "events" | "update",
        }
        setMessages((prev) => [...prev, assistantMessage])
      }
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "Sorry, something went wrong. Please try again.",
        type: "text",
      }
      setMessages((prev) => [...prev, errorMessage])
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  return (
    <>
      {/* Chat Bubble Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-36 right-2 md:bottom-24 md:right-2 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-all hover:scale-110 hover:opacity-90"
          aria-label="Open chat"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      )}

      {/* Chat Sidebar */}
      {isOpen && (
        <div className="fixed bottom-0 right-0 z-50 flex h-[600px] w-full flex-col bg-background shadow-2xl sm:bottom-6 sm:right-6 sm:h-[600px] sm:w-[400px] sm:rounded-lg border border-border">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border bg-primary p-4 text-primary-foreground sm:rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">Wadzzo Assistant</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded-full p-1 transition-colors hover:bg-primary/80"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Messages Container */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message, index) => (
              <div key={index}>
                {message.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="max-w-[80%] rounded-lg bg-primary p-3 text-primary-foreground">
                      <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2">
                    {message.content && (
                      <div className="flex justify-start">
                        <div className="max-w-[80%] rounded-lg bg-muted p-3 text-muted-foreground">
                          <p className="whitespace-pre-wrap break-words text-sm">{message.content}</p>
                        </div>
                      </div>
                    )}
                    {message.events && message.events.length > 0 && (
                      <div className="space-y-2">
                        {message.events.map((event, eventIndex) => (
                          <EventCard key={eventIndex} event={event} />
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
            {chatMutation.isLoading && (
              <div className="flex justify-start">
                <div className="max-w-[80%] rounded-lg bg-muted p-3">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-border p-4 bg-background">
            <div className="flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={chatMutation.isLoading}
                className="flex-1 rounded-lg border border-input bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
              />
              <button
                onClick={handleSendMessage}
                disabled={!inputMessage.trim() || chatMutation.isLoading}
                className="flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-primary-foreground transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label="Send message"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

function EventCard({ event }: { event: EventData }) {
  const { setIsOpen, setPosition, setPrevData } = useMapModalStore()

  const handleCreatePin = () => {
    // Set the position for the pin
    setPosition({
      lat: event.latitude,
      lng: event.longitude,
    })

    // Set the previous data to pre-fill the form with pin configuration
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
    })

    // Open the create pin modal
    setIsOpen(true)
  }
  const handleViewOnMap = () => {
    // Center the map on this event location
    setPosition({
      lat: event.latitude,
      lng: event.longitude,
    })

  }

  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card shadow-sm transition-shadow hover:shadow-md">
      {/* {event.image && (
        <div className="h-32 w-full overflow-hidden">
          <img src={"https://placehold.co/600x400"} alt={event.title} className="h-full w-full object-cover" />
        </div>
      )} */}
      <div className="p-3">
        <h4 className="mb-1 font-semibold text-card-foreground">{event.title}</h4>
        {event.venue && <p className="mb-1 text-xs text-muted-foreground">{event.venue}</p>}
        <p className="mb-2 line-clamp-2 text-xs text-card-foreground">{event.description}</p>

        <div className="mb-2 flex items-start gap-1 text-xs text-muted-foreground">
          <MapPin className="mt-0.5 h-3 w-3 flex-shrink-0" />
          <span className="line-clamp-1">
            {event.address ?? `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`}
          </span>
        </div>

        <div className="mb-2 flex items-center gap-1 text-xs text-muted-foreground">
          <Calendar className="h-3 w-3 flex-shrink-0" />
          <span>
            {new Date(event.startDate).toLocaleDateString()} - {new Date(event.endDate).toLocaleDateString()}
          </span>
        </div>

        {/* Pin Configuration Display */}
        {(event.pinCollectionLimit !== 1 ||
          event.pinNumber !== 1 ||
          (event.autoCollect ?? false) ||
          (event.multiPin ?? false) ||
          (event.radius && event.radius !== 50)) && (
            <div className="mb-3 rounded bg-accent p-2 text-xs">
              <p className="font-semibold text-accent-foreground mb-1">Pin Configuration:</p>
              <div className="space-y-0.5 text-accent-foreground/80">
                {event.pinNumber && event.pinNumber !== 1 && <p>• Pins: {event.pinNumber}</p>}
                {event.pinCollectionLimit && event.pinCollectionLimit !== 1 && (
                  <p>• Collection Limit: {event.pinCollectionLimit}</p>
                )}
                {event.radius && event.radius !== 50 && <p>• Radius: {event.radius}m</p>}
                {event.autoCollect && <p>• Auto Collect: Yes</p>}
                {event.multiPin && <p>• Multi Pin: Yes</p>}
              </div>
            </div>
          )}

        <div className="flex gap-2">
          <button
            onClick={handleCreatePin}
            className="flex-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground transition-colors hover:opacity-90"
          >
            Create
          </button>
          <button
            onClick={handleViewOnMap}
            className="flex items-center justify-center gap-1 rounded border border-primary px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-accent"
          >
            <Eye className="h-3 w-3" />
            View
          </button>
          {event.url && (
            <a
              href={event.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center rounded border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
