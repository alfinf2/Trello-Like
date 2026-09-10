# Task Tracker

A Trello-style task management application — boards contain columns, columns contain tasks, with drag-and-drop reordering and cross-column moves.

Built as a portfolio project demonstrating a fully decoupled architecture: **Laravel REST API** backend + **React SPA** frontend, communicating exclusively via `/api/v1` JSON endpoints.

## Tech Stack

**Backend**
- Laravel 13 (PHP 8.3+)
- Sanctum (Bearer token authentication)
- Fortify (registration, password reset, email verification, 2FA)
- MySQL (`dbtracker`)
- Pest + PHPUnit (111 tests, 351 assertions)
- PHPStan (level 7) + Laravel Pint

**Frontend**
- React 19 + TypeScript
- Vite (build tooling)
- Tailwind CSS 4
- shadcn/ui (Radix UI primitives)
- @dnd-kit (drag-and-drop)
- React Router 7

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Browser                                                    │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  React SPA (resources/js/spa/)                        │  │
│  │  BrowserRouter basename="/app"                        │  │
│  │  Sanctum Bearer token (localStorage)                  │  │
│  └──────────────────────┬────────────────────────────────┘  │
│                         │ fetch /api/v1/*                   │
└─────────────────────────┼───────────────────────────────────┘
                          │
┌─────────────────────────┼───────────────────────────────────┐
│  Laravel Backend        │                                   │
│  routes/api.php         │                                   │
│  FormRequest → Controller → Action → Model → Resource       │
│  Sanctum guard (token)                                      │
└─────────────────────────────────────────────────────────────┘
```

- **No Inertia** — the SPA is a standalone React app served at `/app/{any?}` via `resources/views/spa.blade.php`
- Fortify views (`/login`, `/register`, `/forgot-password`, `/reset-password`, `/user/confirm-password`) all render `view('spa')` — the SPA reads URL params and handles routing client-side
- Business logic lives in `Actions/` (single-purpose), validation in `FormRequest` classes, responses via API Resources

## Features

- **Auth**: Register, login, logout, email verification, forgot/reset password, two-factor authentication (TOTP + recovery codes)
- **Boards**: Create, update, delete; public/private visibility; owner/admin/member roles
- **Columns**: Create, rename, reorder (drag-and-drop), delete
- **Tasks**: Create, update, move (cross-column), delete; priority levels (low/medium/high/urgent); due dates; assignee; completion tracking
- **Labels**: Create, delete, attach/detach to tasks; color-coded
- **Activity log**: Tracks created/updated/moved/deleted actions per task
- **Board members**: Add/remove members with admin/member roles
- **Settings**: Profile update, password change, 2FA management, appearance toggle (light/dark/system), account deletion

## Installation

```bash
# Clone
git clone <repo-url> && cd task-tracker

# Backend
composer install
cp .env.example .env
php artisan key:generate
# Configure DB_* in .env (MySQL)
php artisan migrate --seed
php artisan serve

# Frontend (new terminal)
npm install
npm run dev
```

The app runs at `http://localhost:8000`. Visiting `/` redirects to `/app` (the SPA).

## Demo Credentials

```
Email:    test@example.com
Password: password
```

Seeded with: 1 board ("Product Launch"), 4 columns, 4 labels, 9 tasks.

## API Endpoints

All endpoints are prefixed with `/api/v1`. Public endpoints have no auth requirement.

### Authentication (Public)

| Method | Endpoint | Description | Throttle |
|--------|----------|-------------|----------|
| POST | `/register` | Create account | 5/min |
| POST | `/login` | Sign in (returns `two_factor: true` + challenge if 2FA enabled) | 5/min |
| POST | `/two-factor/login` | Complete 2FA login (challenge + code → token) | 5/min |
| POST | `/forgot-password` | Send reset link | 5/min |
| POST | `/reset-password` | Reset password (token + email + new password) | 6/min |

### Authenticated (Bearer Token)

| Method | Endpoint | Description | Throttle |
|--------|----------|-------------|----------|
| POST | `/logout` | Revoke current token | 10/min |
| GET | `/me` | Current user profile | — |
| PUT | `/profile` | Update name/email | — |
| PUT | `/profile/password` | Change password (revokes other tokens) | — |
| DELETE | `/profile` | Delete account | — |

### Email Verification

| Method | Endpoint | Description | Throttle |
|--------|----------|-------------|----------|
| POST | `/email/verification-notification` | Resend verification email | 6/min |
| GET | `/email/verify/{id}/{hash}` | Verify email (signed URL, web route) | — |

### Two-Factor Authentication

| Method | Endpoint | Description | Throttle |
|--------|----------|-------------|----------|
| GET | `/two-factor` | Status (enabled/confirming) | — |
| POST | `/two-factor` | Enable (returns QR SVG + recovery codes) | 5/min |
| PUT | `/two-factor` | Confirm with TOTP code | 5/min |
| DELETE | `/two-factor` | Disable (requires password) | 5/min |
| GET | `/two-factor/recovery-codes` | List recovery codes | — |
| PUT | `/two-factor/recovery-codes` | Regenerate recovery codes | 5/min |

### Boards

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/boards` | List user's boards |
| POST | `/boards` | Create board |
| GET | `/boards/{board}` | Board detail (columns, tasks, labels, members) |
| PUT | `/boards/{board}` | Update board |
| DELETE | `/boards/{board}` | Delete board (owner only) |

### Board Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/boards/{board}/members` | Add member |
| DELETE | `/boards/{board}/members/{user}` | Remove member |

### Columns

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/boards/{board}/columns` | List columns |
| POST | `/boards/{board}/columns` | Create column |
| PUT | `/boards/{board}/columns/reorder` | Reorder columns |
| PUT | `/columns/{column}` | Update column |
| DELETE | `/columns/{column}` | Delete column |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/columns/{column}/tasks` | List tasks (cursor pagination) |
| POST | `/tasks` | Create task |
| GET | `/tasks/{task}` | Task detail (with activities) |
| PUT | `/tasks/{task}` | Update task |
| PUT | `/tasks/{task}/move` | Move task (column + position) |
| DELETE | `/tasks/{task}` | Delete task |

### Labels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/boards/{board}/labels` | List board labels |
| POST | `/boards/{board}/labels` | Create label |
| DELETE | `/labels/{label}` | Delete label |

### Task Labels

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/{task}/labels` | List task labels |
| POST | `/tasks/{task}/labels` | Attach label |
| DELETE | `/tasks/{task}/labels/{label}` | Detach label |

### Activity

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/tasks/{task}/activities` | Task activity log |

## Project Structure

```
app/
├── Actions/           # Business logic (single-purpose)
│   ├── Activity/
│   ├── Board/
│   ├── Column/
│   ├── Fortify/
│   ├── Label/
│   └── Task/
├── Http/
│   ├── Controllers/Api/   # Thin controllers
│   ├── Requests/Api/      # Form validation
│   └── Resources/         # API response transformers
├── Models/            # Eloquent models
├── Policies/          # Authorization logic
└── Services/          # PositionService (decimal ordering)

resources/js/spa/      # React SPA (decoupled frontend)
├── app.tsx            # Route definitions
├── main.tsx           # Entry point (BrowserRouter)
├── store/auth.tsx     # Auth state (login, register, 2FA)
├── pages/             # Route pages
├── components/        # UI components
├── data/              # API data layer
├── lib/               # Utilities (api, errors)
└── types/             # TypeScript types

routes/
├── api.php            # All /api/v1 endpoints
└── web.php            # SPA mount + email verification
```

## License

MIT
