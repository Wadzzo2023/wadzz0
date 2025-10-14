import AgentChat from "~/components/AgentChat";

export default function AgentPage() {
  return (
    <div className="relative min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-4 text-4xl font-bold text-gray-900">
          AI Agent Assistant
        </h1>
        <p className="mb-8 text-lg text-gray-600">
          Welcome to the Wadzzo AI Agent page. Click the chat bubble in the
          bottom right corner to start a conversation with our AI assistant!
        </p>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              🤖 AI-Powered Help
            </h2>
            <p className="text-gray-600">
              Get instant answers to your questions about Wadzzo, locations,
              deals, and more.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              💬 Natural Conversations
            </h2>
            <p className="text-gray-600">
              Chat naturally with our AI assistant. It understands context and
              provides helpful responses.
            </p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow-md">
            <h2 className="mb-3 text-xl font-semibold text-gray-900">
              ⚡ Quick Support
            </h2>
            <p className="text-gray-600">
              Get immediate assistance without waiting. Our AI is available 24/7
              to help you.
            </p>
          </div>
        </div>
      </div>

      {/* Chat Component */}
      <AgentChat />
    </div>
  );
}
