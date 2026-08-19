# Studio — Social Media Content Studio

Create one piece of content and transform it into platform-ready formats: LinkedIn posts, Instagram captions, TikTok scripts, X posts, blog articles, promotional copy, hashtag sets, weekly content calendars, and code snippets.

## Core workflow

**One idea → multiple platforms.** Enter a topic, choose the platforms you need it for, and generate every version at once. Already created something? Use **Transform content** to expand it into the formats it's still missing.

- **Dashboard** — overview of the workflow, quick stats, platform distribution, and activity trend visualization charts
- **Create content** — the main generation flow (topic/prompt → platforms → tone selection → generate) powered by AI
- **Transform content** — turn existing posts or general drafts into additional platform formats
- **Prompt library** — ready-made prompts across Social Media, Marketing, Business, Content Creation, Advertising, Engagement, and Branding
- **Recent content** — browse, search, filter, and edit everything you've generated, with copy, delete, and single-post refinement capabilities
- **Content calendar** — schedule generated pieces against calendar dates to organize your publishing pipeline

## AI Content Generation (Multi-Provider: Gemini & Groq)

Content generation is powered by a multi-provider AI architecture supporting both **Google Gemini** (`gemini-2.5-flash`) and **Groq** APIs.

### Provider Routing & Fallback Logic
- **Primary Provider**: Google Gemini is used by default.
- **Automatic Fallback**: If Gemini is unavailable, rate-limited, or quota-exhausted, the application automatically falls back to **Groq** (if configured). Before routing traffic, it performs a standalone test request to verify Groq connectivity.
- **Dynamic Model Selection**: When using Groq, the application fetches the list of active models via the Groq models API and selects the most capable available model (prioritizing `llama-3.1-8b-instant`, followed by `openai/gpt-oss-20b`, `openai/gpt-oss-120b`, `groq/compound`, etc.).

### API Key Configuration
You can set up API keys in two ways:
1. **In-UI Input**: Click the settings icon in the "Create Content" dashboard to paste your API keys. They will be saved securely in your browser's local storage:
   - Gemini Key: Saved as `studio.gemini_api_key`
   - Groq Key: Saved as `studio.groq_api_key`
2. **Environment Variables**: Create or modify a `.env` file in the `social-studio` directory and add:
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_GROQ_API_KEY=your_groq_api_key_here
   # Set to true if the key is pre-configured on a server/proxy
   VITE_GROQ_KEY_CONFIGURED=false
   ```

Your generated content and calendar schedules are saved to `localStorage` so they persist between sessions on the same browser.

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

## Install and run locally

Since the application codebase lives in the `social-studio` subdirectory, navigate there to run package commands:

```bash
# 1. Navigate to the project directory
cd social-studio

# 2. Install dependencies
npm install

# 3. Start the dev server
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

## Build for production

```bash
# Navigate to the project directory
cd social-studio

# Build and preview
npm run build
npm run preview
```

`npm run build` outputs a static site to `dist/`, which you can deploy to any static host (Vercel, Netlify, GitHub Pages, S3, etc.).

## Project structure

```
social-studio/
  src/
    components/         UI components (Dashboard, CreateContent, TransformContent, RecentContent, ContentCalendar, Sidebar, etc.)
    components/ui/      Small shared primitives (Card, Button, Badge)
    data/               Prompt library templates and platform metadata
    lib/                Gemini API integration client, localStorage persistence, and prompting rules
    types.ts            Shared TypeScript types
    App.tsx             Layout, navigation, and state manager
    main.tsx            React entry point
    index.css           Tailwind entry point + global theme styles
```

## Customizing content generation and platforms

All generation prompt logic lives in [generator.ts](file:///c:/Users/Administrator/Desktop/social-media-content-studio/social-studio/src/lib/generator.ts). Each platform has its own defined prompt instructions in `PLATFORM_INSTRUCTIONS`.

To add a new platform:
1. Add it to the `Platform` type in `src/types.ts`.
2. Add its metadata (label, default tone, limits, guidelines) to `src/data/platforms.ts`.
3. Add its prompt guidelines to `PLATFORM_INSTRUCTIONS` and any custom handler details in [generator.ts](file:///c:/Users/Administrator/Desktop/social-media-content-studio/social-studio/src/lib/generator.ts).
4. Add an icon mapping in `src/components/PlatformIcon.tsx`.

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, Lucide React icons, Google Gemini API, and Groq API.
