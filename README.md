# ACCENTRA React + Vite Website

A React + Vite website for ACCENTRA, focused on data analytics and business intelligence. The project includes a React-powered interactive analytics dashboard preview.

## Libraries

- **React + Vite** — application and development/build tooling
- **Framer Motion** — entrance and scroll animations
- **Recharts** — responsive, interactive dashboard charts
- **Lucide React** — consistent icon system

## Run locally

1. Install Node.js LTS (Node.js 20.19+ recommended for this Vite setup).
2. Open a terminal in this project folder.
3. Run `npm install`.
4. Run `npm run dev` and open the local URL shown in the terminal.

## Production build

Run `npm run build`. Vite creates the production website in `dist/`.

## Deploy to Netlify

Connect the GitHub repository to Netlify:
- Build command: `npm run build`
- Publish directory: `dist`
- Production branch: `main`

The project includes a Netlify SPA redirect file. No backend credentials are required for the current frontend.

## Important notes

The dashboard contains illustrative sample figures, not client results. The existing enquiry form and chatbot are frontend/fallback experiences; they are not connected to a database or live AI service. A backend such as Supabase can be integrated later.
