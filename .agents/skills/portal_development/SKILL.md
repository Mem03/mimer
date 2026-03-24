---
name: Portal Development
description: Advanced instructions for modifying the Mimer Portal (Next.js 15, React 19, Tailwind v4).
---

# Portal Development Skill

Use this skill when implementing complex UI elements, new pages, or interacting with the backend APIs via the `apps/portal` Control Plane.

## Framework Specifics
The modern Mimer portal requires adhering to Next.js App Router rules:

### Tailwind V4 Conventions
Tailwind v4 is used here natively via PostCSS.
* **Component Styling:** Do not import arbitrary CSS stylesheets. Rely exclusively on Tailwind utilities (`className="flex flex-col gap-4 text-emerald-600 bg-slate-900"`). 
* Assume a robust Dark Mode context usually exists, as this is a developer-focused platform. Consider standardizing colors to Tailwind's slate/zinc palettes for backgrounds.

### Server Components vs Client Components
* Components in `app/` are **Server Components** by default.
* If you need React Hooks (`useState`, `useEffect`, `useContext`) or event listeners (`onClick`), you MUST start the file with `"use client";`.
* Try to keep data fetching in Server Components and pass static data as props to Client Components for better performance.

### API Integration (K8s & MinIO)
If the UI needs to interact with the Minikube cluster or MinIO:
1. **Never do it on the client.** 
2. Write a Next.js Server Handler in `app/api/<route>/route.ts`.
3. **DO NOT instantiate new clients.** Always import and reuse the pre-configured clients found in `src/lib/k8s.ts` and `src/lib/minio.ts`. These files already contain the necessary SDK wrappers and fallback environment variables needed to survive in both local and production states. Expand these modules if you need new functionality rather than bypassing them.
