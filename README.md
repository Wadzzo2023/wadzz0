## Wadzzo Full Econsystem

## Chat Assistant Integration

The application includes an AI-powered chat assistant that provides information about brands, locations, and deals. The assistant uses OpenAI's API to generate responses based on location data and user questions.

### Setup

1. Make sure you have an OpenAI API key. You can get one by signing up at [OpenAI](https://openai.com).
2. Add your OpenAI API key to the `.env` file:
   ```
   OPENAI_API_KEY=your-api-key-here
   ```
3. The chat assistant will automatically provide information about the brands and locations displayed on the map.

### Features

- Location-aware responses: The assistant can use the user's current location (if shared) to provide information about nearby locations.
- Creator-specific information: When viewing specific creators on the map, the assistant will focus on providing information about those creators.
- Interactive interface: Users can ask questions about brands, locations, deals, or general information about the platform.