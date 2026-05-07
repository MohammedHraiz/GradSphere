# Graduation Project Management Platform

A full-stack web application for managing university graduation projects, including student teams, invitations, project submissions, supervisor/dean workflows, meetings, reports, and project archiving.

## Problem Statement

Graduation projects usually require coordination between students, supervisors, dean office staff, and administrators. When this process is handled manually, teams, project proposals, meeting records, approvals, and final archiving can become difficult to track. This platform centralizes the workflow so each user role can manage its responsibilities from one system.

## Features

- JWT-based authentication
- Role-based dashboards for students, supervisors, dean office users, and admins
- Student team creation and team roster management
- Team invitations between students
- Team-specific leader/member permissions
- Team name editing by team leaders
- Leave/disband team flow
- Project proposal submission with file upload support
- Supervisor/dean feedback endpoints
- Meeting PDF generation
- Bulk meeting document download
- Project archiving and graduation tracking
- Centralized backend error responses with a `message` field

## Tech Stack

### Frontend

- React
- Vite
- React Router DOM
- Axios
- CSS
- LocalStorage for client-side token/user persistence

### Backend

- Java 17
- Spring Boot
- Spring MVC
- Spring Security
- JWT authentication
- Spring Data JPA / Hibernate
- Flyway
- PostgreSQL
- Lombok
- OpenPDF

## Project Structure

```text
Grad_Project_Op/
├── GradProj_Front/
│   ├── src/
│   │   ├── api/                  # Axios client and API helper services
│   │   ├── auth/                 # AuthContext and route protection helpers
│   │   ├── components/           # Reusable frontend components
│   │   ├── layout/               # Sidebar/layout components
│   │   ├── pages/                # Role-based pages and dashboards
│   │   ├── styles/               # CSS files
│   │   ├── App.jsx               # Frontend routing and role dashboard shell
│   │   └── main.jsx              # React entry point
│   ├── package.json              # Frontend dependencies and scripts
│   └── vite.config.js            # Vite configuration and backend proxy
│
├── grad_ProjectBack/
│   ├── src/main/java/com/gradproject/platform/
│   │   ├── common/               # Shared base entity and exception handling
│   │   ├── modules/
│   │   │   ├── auth/             # Login, OTP, password setup
│   │   │   ├── project/          # Projects, meetings, archive logic
│   │   │   ├── team/             # Teams, members, invitations
│   │   │   └── user/             # User entity, profile, student search
│   │   ├── security/             # JWT filter, security config, user details
│   │   └── PlatformApplication.java
│   ├── src/main/resources/
│   │   ├── application.yaml      # Backend configuration
│   │   └── db/migration/         # Flyway database migrations
│   └── pom.xml                   # Backend dependencies and build config
│
└── graduation-project.code-workspace
```

## Installation

### Prerequisites

- Node.js and npm
- Java 17
- PostgreSQL
- Maven Wrapper included with the backend project

### Clone/Open Project

Open the root folder:

```powershell
cd c:\Users\moham\Downloads\Grad_Project_Op
```

### Install Frontend Dependencies

```powershell
cd GradProj_Front
npm install
```

### Install Backend Dependencies

Backend dependencies are resolved by Maven automatically:

```powershell
cd ..\grad_ProjectBack
.\mvnw.cmd test
```

## Environment Variables

The project currently stores most backend settings directly in `grad_ProjectBack/src/main/resources/application.yaml`.

Recommended variables for production/demo environments:

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/grad_project
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=your_password
JWT_SECRET=replace_with_a_secure_secret
JWT_EXPIRATION_MS=86400000
PROPOSALS_DIR=./uploads/proposals
VITE_API_BASE_URL=http://localhost:8080
```

Current frontend production API configuration uses `VITE_API_BASE_URL` in `src/api/apiClient.js`.

## Database Setup

Create the PostgreSQL database:

```sql
CREATE DATABASE grad_project;
```

Then verify the backend database settings in:

```text
grad_ProjectBack/src/main/resources/application.yaml
```

Flyway is enabled and runs migrations automatically on backend startup. Migration files are located in:

```text
grad_ProjectBack/src/main/resources/db/migration
```

Main database tables include:

- `users`
- `teams`
- `team_members`
- `invitations`
- `projects`
- `project_comments`
- `meetings`
- `project_history`

## Demo Users

Flyway migration `V12__seed_demo_users.sql` creates demo accounts automatically.

All demo accounts use this password:

```text
password
```

| Role | Email |
| --- | --- |
| Student Leader | `student.leader@demo.local` |
| Student Member | `student.member@demo.local` |
| Supervisor | `supervisor@demo.local` |
| Dean Office | `dean@demo.local` |
| Admin | `admin@demo.local` |

For a clean demo, start with a fresh `grad_project` database or remove old demo teams/projects before running the workflow again.

## How To Run Locally

### Start Backend

```powershell
cd c:\Users\moham\Downloads\Grad_Project_Op\grad_ProjectBack
.\mvnw.cmd spring-boot:run
```

The backend runs on:

```text
http://localhost:8080
```

### Start Frontend

```powershell
cd c:\Users\moham\Downloads\Grad_Project_Op\GradProj_Front
npm.cmd run dev
```

The frontend runs on the Vite development URL, usually:

```text
http://localhost:5173
```

During development, frontend requests to `/api` are proxied to the backend by `vite.config.js`.

## Available Scripts

### Frontend

```powershell
npm.cmd run dev
npm.cmd run build
npm.cmd run lint
npm.cmd run preview
```

### Backend

```powershell
.\mvnw.cmd spring-boot:run
.\mvnw.cmd test
.\mvnw.cmd clean package
```

## API Overview

### Authentication

- `POST /api/v1/auth/request-otp`
- `POST /api/v1/auth/setup-password`
- `POST /api/v1/auth/login`

### Users

- `GET /api/v1/users/me`
- `GET /api/v1/users/students/search`

### Teams

- `POST /api/v1/student/teams`
- `GET /api/v1/student/teams/my`
- `GET /api/v1/teams/my`
- `GET /api/v1/teams/my/members`
- `PUT /api/v1/teams/my`
- `DELETE /api/v1/teams/my/leave`

### Invitations

- `POST /api/v1/invitations/send/{receiverId}`
- `GET /api/v1/invitations/me`
- `POST /api/v1/invitations/{invitationId}/accept`
- `POST /api/v1/invitations/{invitationId}/reject`

### Projects

- `POST /api/projects/submit`
- `GET /api/projects/my-project`
- `GET /api/projects/assigned`
- `PATCH /api/projects/{id}/feedback`
- `GET /api/projects/all`
- `POST /api/projects/deadline-setup`
- `GET /api/projects/{projectId}/download-all-meetings`
- `GET /api/projects/student/{studentId}`

### Meetings

- `GET /api/meetings/{id}/download-form`

### Admin

- `POST /api/admin/archive/{projectId}`

## Screenshots

Add screenshots here before submission/demo:

```text
docs/screenshots/login.png
docs/screenshots/student-dashboard.png
docs/screenshots/team-management.png
docs/screenshots/project-submission.png
docs/screenshots/supervisor-dashboard.png
docs/screenshots/dean-dashboard.png
docs/screenshots/admin-dashboard.png
```

## Future Improvements

- Add seed/demo users for easier setup
- Move database credentials and JWT secret out of `application.yaml`
- Add real email delivery for OTP instead of console output
- Complete dynamic backend integration for all dashboard pages
- Add supervisor assignment workflow
- Add project milestone and task persistence
- Add real-time or persisted chat
- Add notification persistence
- Improve automated backend and frontend test coverage
- Add refresh tokens or a more secure token storage strategy
- Add deployment profiles for development, demo, and production

## Contributors

- Graduation project team members
- Supervisor
- University department/dean office reviewers
