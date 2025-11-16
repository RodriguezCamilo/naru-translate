# NaruTrad — AI-Assisted Manga Translation SaaS (WIP)

> 🇪🇸 NaruTrad es un SaaS propio en desarrollo para traducir mangas y cómics usando IA, pensado para traductores y creadores de contenido.

NaruTrad is my own SaaS project in progress: an **AI-assisted platform for manga and comic translation**, focused on Spanish-speaking translators and content creators.

It’s not production-ready yet, but it shows how I approach **SaaS architecture, DX and product design**.

## Goals

- Allow users to upload manga/comic pages.
- Run OCR + translation pipelines using AI APIs.
- Provide an editor to review and localize dialogue.
- Manage projects, chapters and pages.
- Eventually offer a subscription-based SaaS model.

## Current Status

- Base app structure (Next.js + TypeScript).
- Initial Supabase setup (PostgreSQL, Auth, Storage).
- Auth/routing and editor UI under active development.

## Tech Stack

- Next.js (TypeScript)
- Supabase (PostgreSQL, Auth, Storage)
- Tailwind CSS
- External AI/OCR APIs
- Deployed to Vercel (planned)

## Getting Started

```bash
npm install
cp .env.example .env.local   # add Supabase + API keys
npm run dev
