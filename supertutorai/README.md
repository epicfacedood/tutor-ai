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

## License

MIT
