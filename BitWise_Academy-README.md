# Bitwise Academy

**An online school platform for children's programming classes:** live video lessons, a shared whiteboard, AI-generated tests and an AI lesson assistant.

Built as my bachelor's thesis at Politehnica University of Timișoara (graded **10/10**).

<!--
  SCREENSHOTS: take 3-4 screenshots (classroom with video + whiteboard, teacher dashboard,
  a generated test, parent dashboard), put them in a folder called docs/screenshots/
  and uncomment the lines below. A short GIF of a live lesson is even better.

![Live classroom](docs/screenshots/classroom.png)
![Teacher dashboard](docs/screenshots/teacher-dashboard.png)
![AI-generated test](docs/screenshots/test.png)
-->

## ✨ Features

**Live classroom**
- Real-time audio/video lessons using the Agora SDK
- Interactive whiteboard synchronized between all participants
- Lesson timer and in-lesson chat

**AI features (Google Gemini)**
- Teachers upload a course PDF and the platform generates a test from it (text extracted with `pdfplumber`)
- Children take the test in the app; results are saved for teachers and parents
- **Glitch**, an AI assistant children can ask questions during a lesson

**Scheduling and school management**
- Separate roles and dashboards for **teachers** and **parents** (with child profiles)
- Teachers set their availability; lessons appear in a calendar
- Attendance tracking, skipping lessons and scheduling makeup lessons
- Lesson credits and subscriptions
- End-of-lesson reports for parents, and phone calls to parents through Twilio

**Accounts**
- JWT authentication, password reset by email, profile pictures

## 🧱 Tech stack

| Layer | Technologies |
|---|---|
| Frontend | React, TypeScript, Vite, SCSS |
| Backend | Python, Django, Django REST Framework, SimpleJWT |
| Database & storage | Supabase (PostgreSQL + Storage) |
| Real-time | Agora SDK (video), WebRTC (whiteboard) |
| AI | Google GenAI (Gemini), pdfplumber |
| Integrations | Twilio |
| DevOps | Docker, Docker Compose (with `watch` for live reload), GitHub Actions, Docker Hub |
| Testing | Cypress end-to-end tests |

## 🏗️ Architecture

```
React + TypeScript (Vite)  ──REST/JWT──▶  Django REST API  ──▶  Supabase (PostgreSQL, Storage)
        │                                      │
        ├── Agora SDK (live video)             ├── Google Gemini (tests, AI assistant)
        └── WebRTC (whiteboard sync)           └── Twilio (calls to parents)
```

Frontend and backend each have their own Dockerfile and run together with Docker Compose.

## ⚙️ CI/CD

On every push to `main`, a **GitHub Actions** workflow ([`docker-image.yml`](.github/workflows/docker-image.yml)) builds the frontend and backend Docker images and pushes them to Docker Hub:
- `rusticd3/bitwise-frontend`
- `rusticd3/bitwise-backend`

## 🧪 Tests

**Cypress** end-to-end tests cover the main user flows:
- **Authentication:** register, login, password reset
- **Teacher:** manage schedule, generate a test, cancel a lesson, send a report
- **Parent:** subscriptions, makeup lessons, skip a lesson, complete a test, AI assistant

```bash
cd frontend
npx cypress open
```

## 🚀 Getting started

**Requirements:** [Docker Desktop](https://www.docker.com/products/docker-desktop/), installed and running.

**1. Clone the repository**
```bash
git clone https://github.com/rustic-d3/BitWise_Academy.git
cd BitWise_Academy
```

**2. Create the environment files** from the templates, then fill in your own keys (Supabase, Agora, Gemini, Twilio):

macOS / Linux / Git Bash:
```bash
cp frontend/.env-frontend.template frontend/.env
cp backend/.env-backend.template backend/.env
```

Windows PowerShell:
```powershell
Copy-Item frontend\.env-frontend.template frontend\.env
Copy-Item backend\.env-backend.template backend\.env
```

**3. Start the app**
```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000

To stop it: `Ctrl+C`, or `docker compose down`.

<details>
<summary><b>Windows troubleshooting</b></summary>

- If `docker compose` isn't recognized, make sure Docker Desktop is running and WSL2 integration is enabled (Settings → Resources → WSL Integration).
- If you get line-ending errors (CRLF vs LF) in `.env` files or shell scripts, run:
  ```bash
  git config --global core.autocrlf input
  ```
</details>

## 👤 Author

**Rustic Dumbravă** · [LinkedIn](https://www.linkedin.com/in/rustic-dumbrav%C4%83-7b1215296) · [GitHub](https://github.com/rustic-d3)
