# Avatar — AI Learning (Landing Page)

Next.js 14 (App Router) + Tailwind CSS + TypeScript implementation of the
Avatar AI Learning landing page.

## Stack
- **Next.js 14** (App Router, server components by default)
- **TypeScript** (strict)
- **Tailwind CSS** with a custom design system (`tailwind.config.ts` + `app/globals.css`)
- **lucide-react** for icons
- Generated marketing imagery in `/public`

## Getting started
```bash
npm install     # or pnpm / bun / yarn
npm run dev     # http://localhost:3000
npm run build && npm start
```

## Folder structure
```
app/
  layout.tsx         Root layout, fonts, metadata
  page.tsx           Landing page composition
  globals.css        Tailwind + design tokens (buttons, chips, eyebrow, etc.)
components/          One file per section — fully presentational, reusable
  Navbar.tsx
  Hero.tsx
  CoursesSection.tsx
  CourseCard.tsx
  QuizBanner.tsx
  HackathonBanner.tsx
  WhyChooseUs.tsx
  AdvisorCTA.tsx
  Footer.tsx
lib/
  api.ts             Thin fetch client (apiGet / apiPost) pointing at
                     NEXT_PUBLIC_API_BASE_URL — drop-in for any backend
  courses.ts         Typed mock data (Course, Level, CourseModule)
public/              Hero, course thumbnails, world map, quiz network
.env.example         NEXT_PUBLIC_API_BASE_URL=...
```

## Connecting a backend
Components currently consume `lib/courses.ts` directly. To switch to a
real backend (Express/Nest/FastAPI/etc.) without touching the UI:

```ts
// components/CoursesSection.tsx
import { apiGet } from "@/lib/api";
import type { Course } from "@/lib/courses";

const courses = await apiGet<Course[]>("/courses");
```

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local`. Server components fetch
on the server, so no CORS configuration is needed for SSR.

## Design system
All visual primitives are centralized:
- Colors: `ink.*` (neutrals) and `brand.*` (blue) in `tailwind.config.ts`
- Component classes: `.btn-primary`, `.chip-free`, `.filter-pill`,
  `.eyebrow`, `.h-display`, `.container-x` in `app/globals.css`
- Add a new variant once, reuse it across components — never hardcode
  hex values or one-off Tailwind color classes in JSX.

## Scaling out
- Add routes under `app/` (e.g. `app/courses/[id]/page.tsx`)
- Keep each route's UI composed from small components in `components/`
- Keep data fetching in `lib/` (one file per resource) so route files
  stay thin and components stay presentational.
