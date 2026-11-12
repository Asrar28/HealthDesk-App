# Project memory

## Product intent & audience

- **HealthDesk**: full-stack family healthcare planner web app
- Core features: family health reminders, preventive checkup tracking, family member profiles
- Combines general health education with organisational tools — not a medical advice product
- Audience: families/households managing preventive health and reminders
- Requires a health disclaimer (e.g., "HealthDesk provides general health education and organisational tools...")

## Brand personality & voice

- Brand name: **HealthDesk** (chosen by user; previously referenced as SehatLink)
- Tone: trustworthy, organised, health-literate, family-friendly
- Spelling observed: British ("organisational") — likely preferred in copy

## Visual design & UX direction

- Production-worthy, distinctive UI (per `.bolt/prompt` — not restated here)
- Health/wellness aesthetic expected: clean, calm, trustworthy; avoid clinical sterility
- Components and interactions to be inferred as screens are built
- Responsive across mobile and desktop; family use implies multi-device access
- Accessibility important given health context (clear language, readable contrast)

## Decisions, constraints & rationale

- **Backend: Supabase** (user-selected; replaces Firebase mention in project summary) — used for auth, database, and secure persistence
- **Stack: Vite + React + TypeScript** with Supabase backend
- UI: Tailwind CSS, Lucide React icons, React hooks, `@/` path alias to `src/` (see `.bolt/prompt`)
- No extra UI/icon packages unless explicitly requested
- A prior build plan was "locked in" with Supabase and HealthDesk naming — treat as the agreed scope baseline
- Disclaimer copy must use "HealthDesk" (not SehatLink)

## Open questions & assumptions

- Exact Supabase schema (tables for profiles, reminders, checkups) not yet confirmed
- Auth model: assumed Supabase Auth with family/household grouping — unverified
- Data model for "preventive checkups" (templates vs. custom) unspecified
- Copy spelling convention (British vs. American) assumed British from observed usage
- Full scope of the "locked in plan" not visible here — infer from subsequent turns