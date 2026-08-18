# Studio — Social Media Content Studio

Create one piece of content and transform it into platform-ready formats: LinkedIn posts, Instagram captions, TikTok scripts, X posts, blog articles, promotional copy, and hashtag sets.

## Core workflow

**One idea → multiple platforms.** Enter a topic, choose the platforms you need it for, and generate every version at once. Already created something? Use **Transform content** to expand it into the formats it's still missing.

- **Dashboard** — overview of the workflow, quick stats, and shortcuts
- **Create content** — the main generation flow (topic → platforms → generate)
- **Transform content** — turn existing content into additional formats
- **Prompt library** — ready-made prompts across Social Media, Marketing, Business, Content Creation, Advertising, Engagement, and Branding
- **Recent content** — everything you've generated, with copy and delete
- **Content calendar** — schedule generated pieces against dates

Content generation runs entirely in the browser using a built-in template engine — there's no API key required and no data leaves your machine. Your content is saved to `localStorage` so it persists between sessions on the same browser.

## Requirements

- [Node.js](https://nodejs.org/) 18 or later
- npm (comes with Node.js)

## Install and run locally

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server
npm run dev
```

Then open the URL shown in the terminal (typically `http://localhost:5173`).

## Build for production

```bash
npm run build
npm run preview
```

`npm run build` outputs a static site to `dist/`, which you can deploy to any static host (Vercel, Netlify, GitHub Pages, S3, etc.).

## Project structure

```
src/
  components/       UI components (Dashboard, CreateContent, TransformContent, ...)
  components/ui/     Small shared primitives (Card, Button, Badge)
  data/              Prompt library and platform metadata
  lib/               Content generation engine and localStorage persistence
  types.ts           Shared TypeScript types
  App.tsx            Layout, navigation, and state
  main.tsx           React entry point
  index.css          Tailwind entry point + global styles
```

## Customizing content generation

All generation logic lives in `src/lib/generator.ts`. Each platform (blog, LinkedIn, Instagram, TikTok, X, promotional copy, hashtags) has its own template function — edit these to change tone, structure, or add new platforms. To add a new platform:

1. Add it to the `Platform` type in `src/types.ts`
2. Add its metadata to `src/data/platforms.ts`
3. Add a generation function and a case in `generateForPlatform` in `src/lib/generator.ts`
4. Add an icon mapping in `src/components/PlatformIcon.tsx`

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, lucide-react icons.
