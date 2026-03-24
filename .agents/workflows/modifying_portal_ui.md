---
description: Guidelines for adding new features or modifying the Mimer Portal UI
---

# Modifying Portal UI Workflow

Use this workflow when adding new pages, components, or altering the Control Plane (`apps/portal`).

## Step 1: Understand the Stack
* **Framework:** Next.js with App Router (`app/` directory).
* **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`). 
* **Language:** TypeScript. Strict typing is required.

## Step 2: Component Creation Rules
* Place reusable UI components in `apps/portal/components/`.
* Pages belong in `apps/portal/app/`.
* Always use modern React concepts (Server Components by default, add `"use client"` ONLY when state/effects are necessary).
* Do not use standard CSS files unless absolutely needed. Rely on Tailwind classes.

## Step 3: interacting with K8s/MinIO
* The portal communicates directly with Kubernetes and MinIO.
* You will find SDKs in `package.json` like `@kubernetes/client-node` and `@aws-sdk/client-s3`. 
* When adding API routes, place them in `apps/portal/app/api/` and use Next.js Route Handlers.

## Step 4: Validating Changes
Before finishing your task, ensure the frontend builds and lints correctly without errors:

```bash
cd apps/portal
npm run lint
npm run build
```
