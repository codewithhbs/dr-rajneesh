# Dr. Rajneesh Kant — Admin Panel

A clean, lightweight admin dashboard for the clinic platform, built with **plain
React + Tailwind CSS + a single Axios instance**. No component-library bloat —
just small, readable components you can understand and extend.

## Tech stack

- **React 18** + **Vite** (fast dev server, simple build)
- **Tailwind CSS v3** for styling
- **Axios** — one shared instance for the whole app (`src/lib/axios.js`)
- **React Router v6** for navigation
- **react-hot-toast** for notifications
- **lucide-react** for icons

## Getting started

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build -> dist/
npm run preview  # preview the production build
```

### Configure the API URL

The backend base URL lives in **one** place: `src/constants/config.js`
(`API_URL`). You can also override it with an environment variable — copy
`.env.example` to `.env` and set:

```
VITE_API_URL=https://api.drrajneeshkant.in/api/v1
```

## How auth works

1. `POST /admin/login` returns a `token` + `user`.
2. The token is saved in `localStorage` (`adminToken`) by `AuthContext.login()`.
3. The single Axios instance (`src/lib/axios.js`) automatically attaches
   `Authorization: Bearer <token>` to **every** request via a request
   interceptor.
4. If any request returns **401**, the response interceptor clears the token and
   redirects to `/admin/login`.
5. `ProtectedRoute` gates every `/dashboard/*` page — it shows a loader while the
   stored token is verified (`GET /admin/profile`) and redirects to login if
   there's no valid session.

> The instance also sends `withCredentials: true`, so a cookie-based backend
> works too without any change.

## Project structure

```
src/
  lib/axios.js              # THE single axios instance (+ interceptors)
  context/AuthContext.jsx   # login / logout / profile / token state
  constants/config.js       # API_URL, sidebar menu, dropdown options
  components/
    ui/                     # plain Tailwind primitives (Button, Card, Modal...)
    layout/                 # Sidebar, Header, DashboardLayout, ProtectedRoute
  pages/
    Login.jsx  Dashboard.jsx  NotFound.jsx
    sessions/  users/  treatments/  clinics/
    blogs/  notifications/  popups/  settings/  misc/
  App.jsx                   # all routes
  main.jsx                  # app entry
```

## Navigation

The sidebar menu is defined once in `src/constants/config.js` (`menuSections`)
and the routes in `src/App.jsx` line up 1:1 with it. To add a page:

1. Create the page component under `src/pages/...`
2. Add a `<Route>` in `App.jsx`
3. Add an entry to `menuSections`

## Pages included

Dashboard (stat counts), Session Bookings (+ details, status update,
prescriptions), Users, Doctors, Treatments (+ create/edit form), Clinics, Blogs,
Blog Categories, Notifications, Popups (+ new popup), Web Settings, and My
Profile (change password). Medicine Bookings and Coupons are wired into the nav
with "Coming Soon" placeholders so every link works.

## Adding a new API call

Always import the shared instance — never the bare `axios` package:

```js
import api from "@/lib/axios";

const { data } = await api.get("/some-endpoint");
await api.post("/another-endpoint", payload);
```

That way the token, base URL, and 401 handling are applied everywhere.
