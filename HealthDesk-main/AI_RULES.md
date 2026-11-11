# AI Rules & Project Architecture: HealthDesk

HealthDesk is a community-oriented preventive healthcare web application built for families in Bhatkal, Karnataka. It helps users organize recurring preventive checkups, manage family health profiles, discover local healthcare facilities via interactive maps, and browse reviewed health education articles.

---

## Tech Stack

- **React 18 & TypeScript**: Modern functional React with strict TypeScript typing, custom hooks, and component modularity.
- **Vite 7**: Fast build tooling, bundling, and local development environment with `@/` aliased to the `src` directory.
- **React Router (v7 / `react-router-dom`)**: Declarative client-side routing with centralized route tables, layout wrappers, and role-based access guards.
- **Tailwind CSS (v3)**: Utility-first styling with custom healthcare palette (`navy`, `teal`, `mint`, `cream`, `amber`, `coral`), custom elevation shadows, and reusable component classes (`btn-primary`, `card`, `input`, `badge`).
- **Supabase (`@supabase/supabase-js`)**: Relational PostgreSQL database, authentication (sessions, auth triggers, JWT), and Row Level Security (RLS) policies.
- **TanStack React Query (v5)**: Asynchronous server state synchronization, query caching, background polling, and cache invalidation.
- **React Hook Form & Zod**: Performant, uncontrolled form management combined with Zod runtime schema validation via `@hookform/resolvers/zod`.
- **Lucide React (`lucide-react`)**: Standardized SVG icons for health indicators, navigation, actions, and status badges.
- **Leaflet & React-Leaflet**: Mobile-friendly interactive maps for displaying local healthcare clinics, hospitals, and pharmacies.
- **Recharts**: Responsive chart components for visual health tracking, appointment completion stats, and family preventive care timelines.

---

## Library Usage Rules

To maintain code consistency and prevent dependency duplication, adhere strictly to the following rules:

### 1. Routing & Navigation → `react-router-dom`
- Declare all top-level routes inside `src/App.tsx`.
- Use `<Link>` and `<NavLink>` for internal navigation instead of native `<a>` tags.
- Use `useNavigate()` for programmatic redirects.
- Protect routes using `<ProtectedRoute>` (requires authentication) and `<RoleRoute>` (restricts access by roles such as `admin`, `editor`, `reviewer`).

### 2. Server State & Remote Data Fetching → `@tanstack/react-query`
- Always use `useQuery` for fetching remote records from Supabase and `useMutation` for inserts, updates, and deletes.
- Invalidate relevant query keys on successful mutations using `queryClient.invalidateQueries({ queryKey: [...] })`.
- Do NOT maintain redundant manual loading/error states in `useEffect` when React Query hooks provide `isLoading`, `isError`, and `data`.
- Use the shared QueryClient provider setup in `src/lib/query-client.ts`.

### 3. Database, Auth & Backend → `@supabase/supabase-js`
- Interact with the backend solely through the Supabase client initialized in `src/lib/supabase.ts`.
- Access session and user state through the `useAuth()` hook in `src/lib/auth.tsx`.
- Respect Row Level Security (RLS) constraints: user-scoped data (`family_members`, `reminders`, `bookmarks`) must be tied to `user.id`.

### 4. Forms & Validation → `react-hook-form` + `zod` + `@hookform/resolvers/zod`
- Use `useForm` with `resolver: zodResolver(schema)` for all forms (auth, reminder creation, facility editing, article submissions).
- Define validation schemas clearly using `zod` (`z.object({...})`) to provide immediate, user-friendly field-level error messages.

### 5. UI Elements & Design System → Tailwind CSS + `src/components/ui.tsx`
- Build layouts and bespoke styling using Tailwind utility classes.
- Use the predefined design system components from `src/components/ui.tsx`:
  - `Alert`: contextual alert banners (`info`, `success`, `warning`, `error`, `neutral`).
  - `Spinner` & `LoadingState`: loading placeholders and spinners.
  - `EmptyState`: placeholder when lists or search results are empty.
  - `ErrorState`: error display with optional retry button.
  - `Badge`: status and tag chips.
  - `Modal` & `ConfirmDialog`: accessible dialogs and deletion confirmations.
- Reusable base button styles are defined in `src/index.css` (`btn-primary`, `btn-secondary`, `btn-outline`, `btn-ghost`, `btn-danger`).

### 6. Iconography → `lucide-react`
- Exclusively import icons from `lucide-react` (e.g., `HeartPulse`, `CalendarCheck`, `MapPin`, `Users`).
- Avoid raw inline SVG code or importing secondary icon packs.

### 7. Maps & Geolocation → `leaflet` & `react-leaflet`
- Use `MapContainer`, `TileLayer`, `Marker`, and `Popup` from `react-leaflet` for facility location views.
- Ensure custom markers or popups are styled and responsive.
- Always include the Leaflet CSS and set container dimensions properly (`.leaflet-container`).

### 8. Visualizations & Charts → `recharts`
- Use `recharts` (`ResponsiveContainer`, `BarChart`, `LineChart`, `PieChart`, `Tooltip`) for preventive care compliance and health metrics.
- Maintain responsive containers (`width="100%" height={...}`) to fit dashboard cards smoothly.

### 9. Dates, Lead Times & Calendars → `date-fns` & `src/lib/date-utils.ts`
- Perform date math, recurring interval calculations, and formatting with `date-fns`.
- Use centralized helpers from `src/lib/date-utils.ts` for relative time and formatted display to ensure consistent locale and timezone handling.
