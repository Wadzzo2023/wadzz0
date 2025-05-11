import { useState, useRef, useEffect } from "react";
import { MessageSquare } from "lucide-react";
import { api } from "~/utils/api";

interface ChatInterfaceProps {
  // User location if available
  userLocation?: {
    latitude: number;
    longitude: number;
  } | null;
  // Creator IDs for filtering responses
  creatorIds?: string[];
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  userLocation,
  creatorIds,
}) => {
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ type: "user" | "bot"; text: string }>
  >([
    {
      type: "bot",
      text: "Hi there! I'm Wadzzo's assistant. Feel free to ask me anything about the brands, locations, or deals shown on this map!",
    },
  ]);
  const [messageInput, setMessageInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // API mutation for answering questions
  const answerQuestion = api.widget.answerQuestion.useMutation();

  const handleSendMessage = async () => {
    if (!messageInput.trim() || isLoading) return;

    // Add user message
    setMessages((prev) => [...prev, { type: "user", text: messageInput }]);

    // Show loading indicator
    setIsLoading(true);

    try {
      console.log(messageInput, userLocation, creatorIds);
      // Call the API with the user's question
      const response = await answerQuestion.mutateAsync({
        question: messageInput,
        userLocation,
        creatorIds: creatorIds,
      });

      // Add the AI response
      setMessages((prev) => [...prev, { type: "bot", text: response.answer }]);
    } catch (error) {
      // Handle errors
      console.error("Error getting answer:", error);
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, I'm having trouble connecting to my brain right now. Please try again later.",
        },
      ]);
    } finally {
      setIsLoading(false);
      // Clear input
      setMessageInput("");
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <>
      {/* Chat input in the center bottom of the screen */}
      <div className="fixed bottom-6 left-0 right-0 z-20 flex justify-center">
        <div
          className="mx-4 flex w-full max-w-md cursor-pointer items-center rounded-full border border-gray-200 bg-white shadow-lg"
          onClick={() => setIsChatOpen(true)}
        >
          <div className="flex-1 px-4 py-3 text-gray-500">
            Ask about brands or locations...
          </div>
          <div
            className="mr-1 rounded-full bg-primary p-2 text-white"
            style={{ backgroundColor: "#FF006E" }}
          >
            <MessageSquare className="h-5 w-5" />
          </div>
        </div>
      </div>

      {/* Chat bottom sheet */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-30 mx-auto transform rounded-t-xl bg-white shadow-lg transition-transform duration-300 ${
          isChatOpen ? "translate-y-0" : "translate-y-full"
        }`}
        style={{ height: "70vh", maxHeight: "500px", maxWidth: "600px" }}
      >
        <div className="flex items-center justify-between border-b p-4">
          <h2 className="text-lg font-semibold">Chat with Wadzzo</h2>
          <button
            onClick={() => setIsChatOpen(false)}
            className="rounded-full p-1 hover:bg-gray-100"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div
          className="overflow-auto p-4"
          style={{ height: "calc(100% - 140px)" }}
          ref={chatContainerRef}
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={`mb-4 ${message.type === "user" ? "text-right" : ""}`}
            >
              <div
                className={`${
                  message.type === "user"
                    ? "ml-auto bg-primary text-white"
                    : "bg-gray-100 text-gray-800"
                } inline-block max-w-[80%] rounded-lg p-3`}
                style={
                  message.type === "user" ? { backgroundColor: "#FF006E" } : {}
                }
              >
                <p className="text-sm">{message.text}</p>
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {isLoading && (
            <div className="mb-4">
              <div className="inline-block max-w-[80%] rounded-lg bg-gray-100 p-3">
                <div className="flex space-x-1">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-gray-400"></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="h-2 w-2 animate-bounce rounded-full bg-gray-400"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t p-4">
          <div className="flex">
            <input
              type="text"
              placeholder="Ask about brands or locations..."
              className="flex-1 rounded-l-md border p-2 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
              disabled={isLoading}
            />
            <button
              onClick={handleSendMessage}
              className="rounded-r-md bg-primary p-2 text-white hover:bg-primary/90 disabled:opacity-50"
              style={{ backgroundColor: "#FF006E" }}
              disabled={isLoading || !messageInput.trim()}
            >
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-5 w-5"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-8.707l-3-3a1 1 0 00-1.414 1.414L10.586 9H7a1 1 0 100 2h3.586l-1.293 1.293a1 1 0 101.414 1.414l3-3a1 1 0 000-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ChatInterface;
