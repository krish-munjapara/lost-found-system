# 🛡️ Guardian-Link v3.0

**AI-Powered Lost & Found Child Detection System**

Production-ready full-stack application for reporting missing/found children, AI face matching, admin verification, and public alert sharing.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + Tailwind CSS |
| Backend | FastAPI + Python 3.11 |
| Database | MongoDB (Motor async) |
| AI | DeepFace (Facenet) + cosine similarity |
| Storage | Local uploads + optional Cloudinary |
| Auth | JWT + refresh tokens + bcrypt |

---

## Quick Start

### 1. Environment

```bash
cp .env.example .env
# Edit .env — set MONGO_URI and SECRET_KEY at minimum
```

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
python run.py
```

API: `http://127.0.0.1:8000` | Docs: `http://127.0.0.1:8000/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

App: `http://localhost:5173`

---

## Docker Deployment

```bash
cp .env.example .env
# Configure .env with production values
docker-compose up --build
```

Frontend: `http://localhost` | Backend: `http://localhost:8000`

---

## Features

### Authentication
- Register / Login with JWT (30 min) + refresh tokens (7 days)
- Forgot / Reset password via email
- Change password in Settings
- Email verification on registration
- Token validation on app startup

### AI Matching
- DeepFace Facenet embeddings (unchanged core)
- Background matching on report submit
- Top-5 ranked matches per report
- Cross-user matching rule enforced
- Confidence: High ≥75%, Medium 50–74%, Low <50%

### Security
- Secrets via `.env` only
- File upload: MIME validation, size limit, UUID filenames
- Image compression before storage
- Face embeddings stripped from API responses
- Global error handling

### Admin Panel
- User management (delete)
- Report management (delete, resolve)
- Audit logs
- Dashboard statistics

### Notifications
- In-app + browser push (polling)
- Email notifications (SMTP optional)
- User notification preferences

---

## API Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register |
| POST | `/api/auth/login` | Login |
| POST | `/api/auth/refresh` | Refresh token |
| POST | `/api/auth/forgot-password` | Request reset |
| POST | `/api/auth/reset-password` | Reset password |
| POST | `/api/auth/verify-email` | Verify email |
| GET | `/api/auth/me` | Current user |
| PUT | `/api/user/profile` | Update profile |
| PUT | `/api/user/change-password` | Change password |
| DELETE | `/api/user/account` | Delete account |
| POST | `/api/children/report-lost` | Report missing |
| POST | `/api/children/report-found` | Report found |
| GET | `/api/matches/` | AI matches |
| GET | `/api/admin/dashboard` | Admin stats |
| GET | `/api/admin/audit-logs` | Audit trail |
| GET | `/api/public/feed` | Public feed |

Full interactive docs at `/docs` when backend is running.

---

## Testing

```bash
# Backend
cd backend && pytest tests/ -v

# Frontend
cd frontend && npm test
```

---

## Project Structure

```
LOST-FOUND-SYSTEM/
├── backend/
│   ├── app/
│   │   ├── routes/       # API endpoints
│   │   ├── services/     # AI, email, storage, audit
│   │   ├── utils/        # File upload, tokens, sanitize
│   │   └── database/     # MongoDB + indexes
│   ├── tests/
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/        # 14 pages
│   │   ├── components/
│   │   └── services/api.js
│   └── Dockerfile
├── docker-compose.yml
└── .env.example
```

---

## Environment Variables

See `.env.example` for the complete list. Required:

- `MONGO_URI` — MongoDB connection string
- `SECRET_KEY` — JWT signing secret (32+ chars)

Optional: Cloudinary, SMTP email, CORS origins, admin credentials.

---

## License

Academic Final Year Project — Krish, Shaurya, Suraj, Raj
