# SuperTutorAI

A ChatGPT-like interface built with React and Vite, powered by Claude AI.

## Features

- Modern UI similar to ChatGPT
- Real-time chat interface with Claude AI integration
- Chat history with multiple conversations
- Responsive design
- Dark mode sidebar

## Tech Stack

- React
- TypeScript
- Vite
- TailwindCSS
- Anthropic Claude API
- Heroicons

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Claude API key

### Installation

1. Clone the repository

```bash
git clone https://github.com/yourusername/supertutorai.git
cd supertutorai
```

2. Install dependencies

```bash
npm install
```

3. Set up your environment variables

Create a `.env` file in the root directory and add your Claude API key:

```
VITE_CLAUDE_API_KEY=your_claude_api_key_here
```

You can get a Claude API key by signing up at [Anthropic](https://www.anthropic.com/).

4. Start the development server

```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## Security Note

This application uses the `dangerouslyAllowBrowser: true` option to allow the Anthropic API to be called directly from the browser. This is done for demonstration purposes only and is not recommended for production applications.

In a production environment, you should:

- Create a backend API that handles the communication with Claude
- Keep your API key secure on the server side
- Never expose your API key in client-side code

## Project Structure

```
supertutorai/
├── public/
├── src/
│   ├── components/
│   │   ├── Chat.tsx
│   │   ├── ChatMessage.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   ├── services/
│   │   └── claudeService.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── .env
├── .env.example
├── index.html
├── package.json
├── tsconfig.json
├── tailwind.config.js
└── README.md
```

## Deployment

To build the application for production:

```bash
npm run build
```

This will create a `dist` folder with the compiled assets.

## Environment Variables

The application uses the following environment variables:

- `VITE_CLAUDE_API_KEY`: Your Claude API key for AI responses

### Environment Variables Security

To securely manage environment variables:

1. **Never commit real API keys to version control**

   - The `.env` file is included in `.gitignore` to prevent accidental commits
   - Use `.env.example` as a template with placeholder values

2. **Setting up environment variables**

   Run the setup script to create your `.env` file:

   ```bash
   npm run setup-env
   ```

   This script will:

   - Check if `.env` exists
   - Create it from `.env.example` if needed
   - Prompt you to enter your API key
   - Verify that `.env` is in your `.gitignore`

3. **Manual setup**

   Alternatively, you can manually copy `.env.example` to `.env` and add your API key:

   ```bash
   cp .env.example .env
   ```

   Then edit the `.env` file to add your actual API key.

4. **Security best practices**

   - Rotate your API keys regularly
   - Use different API keys for development and production
   - Consider using a secrets management service for production deployments

5. **Before committing changes**

   To ensure you don't accidentally commit your API key, run:

   ```bash
   npm run reset-env
   ```

   This will replace your actual API key with a placeholder in the `.env` file.

## License

MIT
