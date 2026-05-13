# GP Portal Frontend

Frontend for a graduation project management portal built with React and Vite. The application supports four role-based workspaces: `student`, `supervisor`, `dean`, and `admin`.

## Overview

This project provides a single-page interface for managing the graduation project lifecycle, including:

- authentication and role-aware routing
- student team formation and proposal submission
- supervisor assignment and project review
- task, milestone, and meeting management
- notifications, profile management, and shared meeting views
- dean and admin dashboards for oversight, reporting, and user management

## Tech Stack

- React 19
- React Router 7
- Vite 8
- Axios
- ESLint

## Roles and Main Areas

### Student

- dashboard overview
- team management and invitations
- project proposal submission and resubmission
- tasks and milestones
- meetings, chat, and notifications

### Supervisor

- dashboard
- assigned students and projects
- task and milestone management
- meetings and meeting progress workflows
- notifications and chat

### Dean

- dashboard
- projects, teams, students, and supervisors directories
- supervisor request tracking
- reports, meetings, and notifications

### Admin

- dashboard
- user management
- project import and admin forms
- AI recommendations, logs, and settings
- access to shared project, team, student, and meeting views

## Project Structure

```text
src/
  api/           API clients and service modules
  auth/          authentication context and route protection
  components/    shared UI pieces
  Pages/         role-based screens
    Admin/
    Dean/
    Login/
    Shared/
    Student/
    Supervisor/
  utils/         formatting, links, status helpers, downloads
```

## Environment Setup

Create a `.env` file in the project root:

```env
VITE_API_BASE_URL=http://localhost:8080
```

Notes:

- in development, the app uses the Vite proxy at `/api`
- `vite.config.js` proxies `/api` requests to `http://127.0.0.1:8080`
- in production, requests are built from `VITE_API_BASE_URL`

## Getting Started

### Prerequisites

- Node.js 18+ recommended
- a running backend API on port `8080` unless you change the environment value and proxy target

### Install

```bash
npm install
```

### Run the development server

```bash
npm run dev
```

### Build for production

```bash
npm run build
```

### Preview the production build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Authentication Notes

- authentication state is stored in `localStorage`
- the frontend accepts token keys such as `accessToken`, `token`, or `jwt`
- role normalization supports backend role values like `ROLE_STUDENT`, `ROLE_SUPERVISOR`, `ROLE_DEAN_OFFICE`, and `ROLE_ADMIN`
- unauthorized API responses clear local auth state and redirect to `/login`

## API Integration Highlights

The frontend is organized around service modules in [`src/api`](./src/api):

- `apiClient.js` configures Axios, auth headers, error normalization, and backend asset URL resolution
- `projectService.js` handles proposals, supervisor requests, status updates, and file downloads
- `workflowService.js` handles project tasks and milestones
- `meetingService.js` handles meeting scheduling and completion flows
- `notificationService.js` handles notification reads and cleanup
- `dashboardService.js`, `userService.js`, and `deanService.js` support dashboards, profiles, directories, and admin features

## Developer Notes

- the login page includes fast-track demo role buttons that attempt backend login for preset demo accounts
- the UI is heavily role-driven from [`src/App.jsx`](./src/App.jsx)
- authentication context lives in [`src/auth/AuthContext.jsx`](./src/auth/AuthContext.jsx)

## Available Scripts

- `npm run dev` starts the Vite development server
- `npm run build` creates the production build in `dist/`
- `npm run preview` serves the built app locally
- `npm run lint` runs ESLint
