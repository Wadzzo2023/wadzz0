"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import ReactMarkdown from "react-markdown"
import type { ChatMessage } from "~/types/pinAgent"
import { Button } from "~/components/shadcn/ui/button"
import { Input } from "~/components/shadcn/ui/input"
import { ScrollArea } from "~/components/shadcn/ui/scroll-area"
import { Loader2, Send, Plus, X, Trash2, MessageCircle, Sparkles, ChevronDown, Trash, Menu } from "lucide-react"
import { api } from "~/utils/api"
import { Dialog, DialogContent } from "../shadcn/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../shadcn/ui/dropdown-menu"
import { ChatMessageGroupSkeleton } from "./chat-message-skeleton"
import { SessionListSkeleton } from "./session-item-skeleton"

interface CreatorChatBoxProps {
    creatorId?: string
    isOpen?: boolean
    closeChat: () => void
}


export function PinAgentChatBox({ creatorId, isOpen, closeChat }: CreatorChatBoxProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [inputValue, setInputValue] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [selectedPins, setSelectedPins] = useState<string[]>([])
    const [showPinSelector, setShowPinSelector] = useState(false)
    const [currentSessionId, setCurrentSessionId] = useState<string | undefined>(undefined)
    const [isCreatingSession, setIsCreatingSession] = useState(false)
    const [newSessionTitle, setNewSessionTitle] = useState("")
    const [showNewSessionInput, setShowNewSessionInput] = useState(false)
    const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
    const [loadingSessionId, setLoadingSessionId] = useState<string | null>(null)
    const [isLoadingMessages, setIsLoadingMessages] = useState(false)
    const [showSidebar, setShowSidebar] = useState(false)
    const scrollRef = useRef<HTMLDivElement>(null)

    // Fetch chat sessions
    const {
        data: sessions,
        isLoading: sessionsLoading,
        refetch: refetchSessions,
    } = api.pinAgent.getChatSessions.useQuery()

    // Fetch creator's pins
    const { data: pins, isLoading: pinsLoading } = api.pinAgent.getCreatorPins.useQuery()

    // Analyze pins mutation
    const analyzeMutation = api.pinAgent.analyzePin.useMutation()

    // Chat session mutations
    const createSessionMutation = api.pinAgent.createChatSession.useMutation()
    const deleteSessionMutation = api.pinAgent.deleteChatSession.useMutation()

    // Chat history queries and mutations
    const { data: chatHistory, isLoading: historyLoading } = api.pinAgent.getChatHistory.useQuery(
        { sessionId: currentSessionId ?? "", limit: 50 },
        {
            enabled: isOpen && !!currentSessionId,
        },
    )
    const saveChatMutation = api.pinAgent.saveChatMessage.useMutation()
    const clearSessionMutation = api.pinAgent.clearChatSession.useMutation()

    useEffect(() => {
        if (isOpen && !currentSessionId && sessions && sessions.length === 0) {
            // Don't auto-create, just keep currentSessionId as null
        }
    }, [isOpen, sessions, currentSessionId])

    // Load chat history when session changes
    useEffect(() => {
        if (currentSessionId && chatHistory && isLoadingMessages) {
            setIsLoadingMessages(false)
            setMessages(chatHistory)
        }
    }, [currentSessionId, chatHistory, isLoadingMessages])

    // Auto-scroll to bottom
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollIntoView({ behavior: "smooth" })
        }
    }, [messages])

    const handleCreateNewSession = async (title?: string) => {
        setIsCreatingSession(true)
        try {
            const sessionTitle = title ?? newSessionTitle ?? `Chat ${new Date().toLocaleDateString()}`
            const newSession = await createSessionMutation.mutateAsync({
                title: sessionTitle,
            })

            setCurrentSessionId(newSession.id)
            setMessages([])
            setSelectedPins([])
            setNewSessionTitle("")
            setShowNewSessionInput(false)
            await refetchSessions()
        } catch (error) {
            console.error("Failed to create session:", error)
        } finally {
            setIsCreatingSession(false)
        }
    }

    const handleDeleteSession = async (sessionId: string) => {
        setDeletingSessionId(sessionId)
        try {
            await deleteSessionMutation.mutateAsync({ sessionId })

            // If deleted session is current, switch to another or create new
            if (currentSessionId === sessionId) {
                const remainingSessions = sessions?.filter((s) => s.id !== sessionId) ?? []
                if (remainingSessions.length > 0) {
                    setCurrentSessionId(remainingSessions[0]?.id)
                    setIsLoadingMessages(true)
                    setMessages([])
                } else {
                    setCurrentSessionId(undefined)
                    setMessages([])
                }
            }

            await refetchSessions()
        } catch (error) {
            console.error("Failed to delete session:", error)
        } finally {
            setDeletingSessionId(null)
        }
    }

    const handleSendMessage = async () => {
        if (!inputValue.trim() || isLoading) return

        let targetSessionId = currentSessionId

        if (!targetSessionId) {
            setIsCreatingSession(true)
            try {
                const messageContent = inputValue.trim()
                // Use first 50 chars of message as title, or a default title
                const sessionTitle = messageContent.length > 50 ? messageContent.substring(0, 50) + "..." : messageContent

                const newSession = await createSessionMutation.mutateAsync({
                    title: sessionTitle,
                })

                targetSessionId = newSession.id
                setCurrentSessionId(targetSessionId)
            } catch (error) {
                console.error("Failed to create session:", error)
                return
            } finally {
                setIsCreatingSession(false)
            }
        }

        const messageContent = inputValue.trim()
        const userMessage: ChatMessage = {
            role: "user",
            content: messageContent,
            timestamp: new Date(),
        }

        setInputValue("")
        setMessages((prev) => [...prev, userMessage])
        setIsLoading(true)

        try {
            const result = await analyzeMutation.mutateAsync({
                sessionId: targetSessionId,
                message: messageContent,
                conversationHistory: messages,
                pinIds: selectedPins.length > 0 ? selectedPins : undefined,
            })

            const assistantMessage: ChatMessage = {
                role: "assistant",
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                content: result.response,
                timestamp: new Date(),
            }

            setMessages((prev) => [...prev, assistantMessage])
            await refetchSessions()
        } catch (error) {
            const errorMessage: ChatMessage = {
                role: "assistant",
                content: "Sorry, I encountered an error analyzing your pins. Please try again.",
                timestamp: new Date(),
            }
            setMessages((prev) => [...prev, errorMessage])
            await refetchSessions()
            console.error("Chat error:", error)
        } finally {
            setIsLoading(false)
        }
    }

    const togglePinSelection = (pinId: string) => {
        setSelectedPins((prev) => (prev.includes(pinId) ? prev.filter((id) => id !== pinId) : [...prev, pinId]))
    }

    const removePinFromSelection = (pinId: string) => {
        setSelectedPins((prev) => prev.filter((id) => id !== pinId))
    }

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSendMessage()
        }
    }

    const clearChat = () => {
        if (!currentSessionId) return
        setMessages([])
        setSelectedPins([])
        clearSessionMutation.mutate({ sessionId: currentSessionId })
    }

    const handleSelectSession = (sessionId: string) => {
        setCurrentSessionId(sessionId)
        setIsLoadingMessages(true)
        setMessages([])
    }

    const selectedPinObjects = pins?.filter((pin) => selectedPins.includes(pin.id)) ?? []
    const currentSession = sessions?.find((s) => s.id === currentSessionId)

    return (
        <Dialog open={isOpen} onOpenChange={closeChat}>
            <DialogContent className="h-[90vh] min-w-[60vw]  p-0 gap-0 rounded-2xl flex flex-col [&>button]:hidden overflow-hidden border-0 border border-border/40 shadow-2xl bg-background shadow-2xl">
                <div className="flex h-full overflow-hidden flex-col md:flex-row">
                    {/* Sidebar - Hidden on mobile, shown as overlay when toggled */}
                    <div
                        className={`fixed md:static inset-0 z-40 w-full md:w-64 border-r border-border/40 bg-card flex flex-col shadow-inner transform transition-transform duration-300 ease-in-out ${showSidebar ? "translate-x-0" : "-translate-x-full md:translate-x-0"
                            }`}
                    >
                        {/* Close button for mobile sidebar */}
                        <div className="md:hidden p-3 border-b border-border/40 flex items-center justify-between">
                            <h3 className="font-semibold text-sm">Chats</h3>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => setShowSidebar(false)}
                                className="h-8 w-8 p-0"
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>

                        {/* Sidebar Header */}
                        <div className="hidden md:block p-4 border-b border-border/40 flex-shrink-0">
                            <Button
                                onClick={() => setShowNewSessionInput(!showNewSessionInput)}
                                className="w-full h-10 rounded-lg flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                                disabled={isCreatingSession}
                            >
                                <Plus className="h-4 w-4" />
                                <span className="text-sm font-semibold">New Chat</span>
                            </Button>
                        </div>

                        {/* Mobile New Chat Button */}
                        <div className="md:hidden p-3 border-b border-border/40 flex-shrink-0">
                            <Button
                                onClick={() => setShowNewSessionInput(!showNewSessionInput)}
                                className="w-full h-9 rounded-lg flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 shadow-sm hover:shadow-md text-xs"
                                disabled={isCreatingSession}
                            >
                                <Plus className="h-3.5 w-3.5" />
                                <span className="font-semibold">New Chat</span>
                            </Button>
                        </div>

                        {/* New Session Input */}
                        {showNewSessionInput && (
                            <div className="p-3 md:p-4 border-b border-border/40 flex-shrink-0 space-y-2 bg-muted/50">
                                <Input
                                    placeholder="Chat title..."
                                    value={newSessionTitle}
                                    onChange={(e) => setNewSessionTitle(e.target.value)}
                                    onKeyPress={(e) => {
                                        if (e.key === "Enter") {
                                            handleCreateNewSession()
                                        }
                                    }}
                                    className="h-8 md:h-9 text-xs md:text-sm rounded-md border-border bg-background"
                                    autoFocus
                                />
                                <div className="flex gap-2">
                                    <Button
                                        onClick={() => handleCreateNewSession()}
                                        size="sm"
                                        className="flex-1 h-7 md:h-8 text-xs rounded-md bg-primary hover:bg-primary/90"
                                        disabled={!newSessionTitle.trim() || isCreatingSession}
                                    >
                                        Create
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setShowNewSessionInput(false)
                                            setNewSessionTitle("")
                                        }}
                                        size="sm"
                                        variant="outline"
                                        className="flex-1 h-7 md:h-8 text-xs rounded-md"
                                    >
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Sessions List */}
                        <ScrollArea className="flex-1 overflow-hidden">
                            <div className="px-2 md:px-3 py-2 md:py-3 space-y-1">
                                {sessionsLoading ? (
                                    <SessionListSkeleton count={5} />
                                ) : sessions && sessions.length > 0 ? (
                                    sessions.map((session) => {
                                        const isDeleting = deletingSessionId === session.id
                                        const isLoading = loadingSessionId === session.id

                                        return (
                                            <div
                                                key={session.id}
                                                className={`group p-2 md:p-3 rounded-lg cursor-pointer transition-all duration-200 ${currentSessionId === session.id
                                                    ? "bg-primary/15 border border-primary/30 shadow-sm"
                                                    : "hover:bg-muted/60 border border-transparent hover:border-border/50"
                                                    } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                                                onClick={() => {
                                                    handleSelectSession(session.id)
                                                    setShowSidebar(false)
                                                }}
                                            >
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1 min-w-0">
                                                        <div className="font-medium text-xs md:text-sm truncate text-foreground">{session.title}</div>
                                                        <div className="text-xs text-muted-foreground mt-0.5 md:mt-1">
                                                            {isLoading ? (
                                                                <span className="flex items-center gap-1">
                                                                    <Loader2 className="h-2.5 w-2.5 animate-spin" />
                                                                    Loading...
                                                                </span>
                                                            ) : (
                                                                <>
                                                                    {session.messageCount} message{session.messageCount !== 1 ? "s" : ""}
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-6 md:h-7 w-6 md:w-7 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0 rounded-md hover:bg-muted"
                                                                onClick={(e) => e.stopPropagation()}
                                                                disabled={isDeleting}
                                                            >
                                                                {isDeleting ? (
                                                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                                ) : (
                                                                    <ChevronDown className="h-3.5 w-3.5" />
                                                                )}
                                                            </Button>
                                                        </DropdownMenuTrigger>
                                                        <DropdownMenuContent align="end" className="w-40">
                                                            <DropdownMenuItem
                                                                onClick={(e) => {
                                                                    e.stopPropagation()
                                                                    handleDeleteSession(session.id)
                                                                }}
                                                                className="text-destructive focus:text-destructive focus:bg-destructive/10 cursor-pointer text-xs"
                                                                disabled={isDeleting}
                                                            >
                                                                <Trash className="h-3.5 w-3.5 mr-2" />
                                                                Delete
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </div>
                                            </div>
                                        )
                                    })
                                ) : (
                                    <div className="text-center py-6 md:py-8 text-muted-foreground text-xs md:text-sm">
                                        <p>No chats yet</p>
                                        <p className="text-xs mt-1">Create a new one to start</p>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </div>

                    {/* Overlay for mobile when sidebar is open */}
                    {showSidebar && (
                        <div
                            className="fixed inset-0 z-30 bg-black/50 md:hidden"
                            onClick={() => setShowSidebar(false)}
                        />
                    )}

                    {/* Main Chat Area */}
                    <div className="flex-1 flex flex-col overflow-hidden bg-background">
                        {currentSessionId && currentSession ? (
                            <div className="px-3 md:px-6 py-2 md:py-4 border-b border-border/40 flex items-center justify-between bg-card/50 backdrop-blur-sm gap-2">
                                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className="md:hidden h-8 w-8 p-0 flex-shrink-0"
                                    >
                                        <Menu className="h-4 w-4" />
                                    </Button>
                                    <div className="h-8 md:h-10 w-8 md:w-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm md:text-base text-foreground truncate">{currentSession.title}</h3>
                                        <p className="text-xs text-muted-foreground hidden md:block">AI-powered analytics</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-1 md:gap-2 flex-shrink-0">
                                    {messages.length > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={clearChat}
                                            className="h-8 md:h-9 w-8 md:w-9 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all duration-200"
                                            disabled={clearSessionMutation.isLoading}
                                        >
                                            {clearSessionMutation.isLoading ? (
                                                <Loader2 className="h-3.5 md:h-4 w-3.5 md:w-4 animate-spin" />
                                            ) : (
                                                <Trash2 className="h-3.5 md:h-4 w-3.5 md:w-4" />
                                            )}
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={closeChat}
                                        className="h-8 md:h-9 w-8 md:w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200"
                                    >
                                        <X className="h-3.5 md:h-4 w-3.5 md:w-4" />
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="px-3 md:px-6 py-2 md:py-4 border-b border-border/40 flex items-center justify-between bg-card/50 backdrop-blur-sm gap-2">
                                <div className="flex items-center gap-2 md:gap-3 min-w-0">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setShowSidebar(!showSidebar)}
                                        className="md:hidden h-8 w-8 p-0 flex-shrink-0"
                                    >
                                        <Menu className="h-4 w-4" />
                                    </Button>
                                    <div className="h-8 md:h-10 w-8 md:w-10 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                                        <Sparkles className="h-4 md:h-5 w-4 md:w-5 text-primary" />
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-semibold text-sm md:text-base text-foreground">Pin Intelligence</h3>
                                        <p className="text-xs text-muted-foreground hidden md:block">Select a chat or create a new one</p>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={closeChat}
                                    className="h-8 md:h-9 w-8 md:w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all duration-200 flex-shrink-0"
                                >
                                    <X className="h-3.5 md:h-4 w-3.5 md:w-4" />
                                </Button>
                            </div>
                        )}

                        {/* Messages Area */}
                        <ScrollArea className="flex-1 overflow-hidden">
                            <div className="px-3 md:px-6 py-4 md:py-6">
                                <div className="space-y-3 md:space-y-4 max-w-3xl mx-auto w-full">
                                    {!currentSessionId ? (
                                        <div className="flex items-center justify-center h-full text-center py-12 md:py-16">
                                            <div className="space-y-3 md:space-y-4 px-4">
                                                <div className="h-12 md:h-16 w-12 md:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto shadow-sm">
                                                    <MessageCircle className="h-6 md:h-8 w-6 md:w-8 text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-base md:text-lg text-foreground">Welcome to Pin Intelligence</h4>
                                                    <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                                        Select a chat from the list or start a new conversation. Any message you send will create a new chat automatically.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : isLoadingMessages ? (
                                        <ChatMessageGroupSkeleton count={3} />
                                    ) : messages.length === 0 ? (
                                        <div className="flex items-center justify-center h-full text-center py-12 md:py-16">
                                            <div className="space-y-3 md:space-y-4 px-4">
                                                <div className="h-12 md:h-16 w-12 md:w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto shadow-sm">
                                                    <MessageCircle className="h-6 md:h-8 w-6 md:w-8 text-primary" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h4 className="font-semibold text-base md:text-lg text-foreground">Welcome to Pin Intelligence</h4>
                                                    <p className="text-xs md:text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                                                        Select your pins using the{" "}
                                                        <span className="inline-flex items-center justify-center h-5 w-5 rounded-md bg-primary/10 text-primary text-xs font-semibold">
                                                            +
                                                        </span>{" "}
                                                        button and ask about consumption patterns, performance trends, and insights.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        messages.map((message, index) => (
                                            <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                                                <div
                                                    className={`max-w-xs md:max-w-xl rounded-lg px-3 md:px-4 py-2 md:py-3 text-sm md:text-base ${message.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                                                        }`}
                                                >
                                                    {message.role === "assistant" ? (
                                                        <ReactMarkdown>{message.content}</ReactMarkdown>
                                                    ) : (
                                                        <p>{message.content}</p>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                    {isLoading && (
                                        <div className="flex justify-start">
                                            <div className="bg-muted rounded-lg px-3 md:px-4 py-2 md:py-3">
                                                <div className="flex gap-2 items-center">
                                                    <Loader2 className="h-3.5 md:h-4 w-3.5 md:w-4 animate-spin text-muted-foreground" />
                                                    <span className="text-xs md:text-sm text-muted-foreground">AI is thinking...</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={scrollRef} />
                                </div>
                            </div>
                        </ScrollArea>

                        {/* Selected Pins Display */}
                        {selectedPinObjects.length > 0 && (
                            <div className="px-3 md:px-6 py-2 md:py-3 border-t border-border/40 bg-card/50 backdrop-blur-sm">
                                <p className="text-xs text-muted-foreground mb-2">Selected pins:</p>
                                <div className="flex flex-wrap gap-2">
                                    {selectedPinObjects.map((pin) => (
                                        <div
                                            key={pin.id}
                                            className="inline-flex items-center gap-2 px-2 md:px-3 py-1 md:py-1.5 bg-primary/15 border border-primary/30 rounded-full text-xs"
                                        >
                                            <span className="text-foreground font-medium truncate max-w-xs md:max-w-none">{pin.title}</span>
                                            <button
                                                onClick={() => removePinFromSelection(pin.id)}
                                                className="ml-0.5 md:ml-1 text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                            >
                                                ×
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Pins Selector Modal */}
                        {showPinSelector && (
                            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center z-50 animate-in fade-in duration-200">
                                <div className="bg-background/95 backdrop-blur-xl border border-white/10 rounded-t-2xl md:rounded-2xl w-[95vw] md:w-96 max-h-[70vh] md:max-h-[60vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom-8 md:zoom-in-95 duration-300">
                                    {/* Modal Header */}
                                    <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-primary/5 to-transparent">
                                        <h3 className="font-semibold text-sm text-foreground">Select Pins</h3>
                                        <button
                                            onClick={() => setShowPinSelector(false)}
                                            className="text-muted-foreground hover:text-foreground transition-all duration-200 hover:rotate-90 hover:scale-110"
                                        >
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>

                                    {/* Pin List */}
                                    <ScrollArea className="flex-1 px-3 py-3 overflow-y-auto">
                                        {pinsLoading ? (
                                            <div className="flex justify-center items-center py-8">
                                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                                            </div>
                                        ) : pins && pins.length > 0 ? (
                                            <div className="space-y-2">
                                                {pins.map((pin, index) => (
                                                    <button
                                                        key={pin.id}
                                                        onClick={() => togglePinSelection(pin.id)}
                                                        style={{ animationDelay: `${index * 50}ms` }}
                                                        className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-300 animate-in fade-in slide-in-from-left-4 ${selectedPins.includes(pin.id)
                                                            ? "bg-gradient-to-r from-primary to-primary/90 text-primary-foreground shadow-lg shadow-primary/20 scale-[1.02] border border-primary/20"
                                                            : "bg-white/5 hover:bg-white/10 text-foreground border border-white/5 hover:border-white/20 hover:scale-[1.01]"
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <div className="flex-1 min-w-0">
                                                                <div className="font-medium truncate text-sm">{pin.title}</div>
                                                                <div className="text-xs opacity-70 mt-1">
                                                                    {pin.totalCollections} collection
                                                                    {pin.totalCollections !== 1 ? "s" : ""}
                                                                </div>
                                                            </div>
                                                            {selectedPins.includes(pin.id) && (
                                                                <div className="w-5 h-5 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 animate-in zoom-in duration-200">
                                                                    <div className="w-2 h-2 bg-primary-foreground rounded-full animate-pulse" />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground text-center py-8">No pins found</p>
                                        )}
                                    </ScrollArea>

                                    {/* Modal Footer */}
                                    <div className="px-3 py-3 border-t border-white/10 flex-shrink-0 flex gap-2 bg-gradient-to-t from-background/50 to-transparent backdrop-blur-sm">
                                        <Button

                                            className="flex-1 text-xs bg-primary border-white/10 transition-all duration-200"
                                            onClick={() => setShowPinSelector(false)}
                                        >
                                            Done
                                        </Button>
                                        {selectedPins.length > 0 && (
                                            <div className="text-xs text-muted-foreground flex items-center px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 animate-in fade-in zoom-in duration-200">
                                                {selectedPins.length} selected
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Input Area */}
                        <div className="px-2 md:px-6 py-2 md:py-4 border-t border-border/40 bg-card/50 backdrop-blur-sm">
                            <div className="flex gap-2 md:gap-3">
                                <Button
                                    size="sm"
                                    className="flex-shrink-0 h-9 md:h-10 w-9 md:w-10 p-0 rounded-lg"
                                    onClick={() => setShowPinSelector(!showPinSelector)}
                                    disabled={!currentSessionId}
                                >
                                    <Plus className="h-4 md:h-5 w-4 md:w-5" />
                                </Button>
                                <Input
                                    value={inputValue}
                                    onChange={(e) => setInputValue(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder={currentSessionId ? "Ask about your pins..." : "Select a chat or start typing..."}
                                    className="flex-1 h-9 md:h-10 rounded-lg border-border bg-background text-foreground placeholder:text-muted-foreground text-sm"
                                    disabled={isLoading || isCreatingSession}
                                />
                                <Button
                                    onClick={handleSendMessage}
                                    size="sm"
                                    className="flex-shrink-0 h-9 md:h-10 w-9 md:w-10 p-0 rounded-lg"
                                    disabled={isLoading || isCreatingSession || !inputValue.trim()}
                                >
                                    {isLoading ? <Loader2 className="h-4 md:h-5 w-4 md:w-5 animate-spin" /> : <Send className="h-4 md:h-5 w-4 md:w-5" />}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
