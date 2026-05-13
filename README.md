# Graduation Project Platform

A production-oriented full-stack repository for managing university graduation projects, proposals, meetings, tasks, milestones, and role-based academic workflows.

## Canonical Repository Structure

This repository uses a single source of truth for each application layer:

- [`BACKEND`](./BACKEND): Spring Boot API and persistence layer
- [`FRONTEND`](./FRONTEND): React + Vite web client

Legacy duplicate directories have been removed so the repository has one clear backend and one clear frontend.

```text
GradSphere/
├── BACKEND/
├── FRONTEND/
├── .gitignore
├── LICENSE
├── README.md
└── graduation-project.code-workspace
```

## Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios

### Backend

- Java 17
- Spring Boot
- Spring Security
- Spring Data JPA / Hibernate
- Flyway
- PostgreSQL
- OpenPDF / PDFBox

## Local Development

### Prerequisites

- Node.js 18+
- Java 17
- PostgreSQL

### Frontend

```powershell
cd FRONTEND
npm install
npm run dev
```

The Vite development server runs on `http://localhost:5173` by default.

### Backend

```powershell
cd BACKEND
.\mvnw.cmd spring-boot:run
```

The API runs on `http://localhost:8080` by default.

## Environment Configuration

### Frontend

Use [`FRONTEND/.env.example`](./FRONTEND/.env.example) as the template:

```env
VITE_API_BASE_URL=http://localhost:8080
```

### Backend

Use environment variables to override local defaults. The committed reference file is:

- [`BACKEND/src/main/resources/application-example.yaml`](./BACKEND/src/main/resources/application-example.yaml)

Recommended variables:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/grad_project
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=replace_with_a_secure_base64_secret
JWT_EXPIRATION_MS=86400000
PROPOSALS_DIR=./uploads/proposals
SERVER_PORT=8080
```

## Build Commands

### Frontend

```powershell
cd FRONTEND
npm run build
```

### Backend

```powershell
cd BACKEND
.\mvnw.cmd test
.\mvnw.cmd package
```

## Deployment Readiness Notes

- The frontend API base URL is environment-driven through `VITE_API_BASE_URL`.
- The backend proposal storage path is relative by default: `./uploads/proposals`.
- Build outputs such as `target/`, `dist/`, `.vite/`, and `node_modules/` are ignored at the repository root.
- Local-only secrets and override files are ignored and should not be committed.
- The workspace file [`graduation-project.code-workspace`](./graduation-project.code-workspace) is kept for local development convenience.

## Key Application Areas

- JWT-based authentication with OTP setup/reset flows
- Student teams and invitations
- Project proposal submission and feedback
- Supervisor and dean office workflows
- Meetings, meeting reports, and PDF/ZIP exports
- Tasks, milestones, notifications, and dashboards

## Repository Hygiene Guidance

- Treat `BACKEND` and `FRONTEND` as the only active application directories.
- Do not commit generated files from `target/`, `dist/`, `.vite/`, or `node_modules/`.
- Prefer environment variables and example config files over editing production secrets into tracked files.
