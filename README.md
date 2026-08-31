# Guardian-Link

<div align="center">

**AI-Powered Lost & Found Child Detection System**

A production-ready full-stack application for reporting missing and found children, featuring AI-powered face matching, admin verification, and public alert sharing.

[Python](https://img.shields.io/badge/Python-3.11-blue) [React](https://img.shields.io/badge/React-18.2.0-61DAFB) [FastAPI](https://img.shields.io/badge/FastAPI-0.104.1-009688) [MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248) [License](https://img.shields.io/badge/License-Academic-orange)

</div>

---

## 📋 Table of Contents

- [Overview](#overview)
- [Problem Statement](#problem-statement)
- [Key Features](#key-features)
- [System Architecture](#system-architecture)
- [AI-Powered Face Matching](#ai-powered-face-matching)
- [How the Matching System Works](#how-the-matching-system-works)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Running the Project Locally](#running-the-project-locally)
- [API Documentation](#api-documentation)
- [Authentication](#authentication)
- [Database](#database)
- [Image Storage](#image-storage)
- [Background Worker and AI Processing](#background-worker-and-ai-processing)
- [Deployment](#deployment)
- [Production Considerations](#production-considerations)
- [Screenshots](#screenshots)
- [Future Improvements](#future-improvements)
- [Troubleshooting](#troubleshooting)
- [Contributors](#contributors)
- [License](#license)

---

## Overview

Guardian-Link is a comprehensive lost and found child identification system that leverages artificial intelligence to match missing child reports with found child reports. The system enables users to submit reports with photographs, automatically processes these reports through an AI pipeline to generate face embeddings, and identifies potential matches based on facial similarity combined with metadata filtering (age, gender, location).

## Problem Statement

Every year, thousands of children go missing, and while many are found, reuniting them with their families remains a significant challenge. Traditional methods rely on manual matching and physical descriptions, which are time-consuming and often ineffective. Guardian-Link addresses this by using AI-powered face recognition to automate the matching process, significantly improving the chances of reuniting missing children with their families.

## ✨ Key Features

### 🔐 Authentication & Authorization
- User registration with email and mobile verification
- JWT-based authentication with access tokens (30 minutes) and refresh tokens (7 days)
- Google OAuth integration for social login
- Password reset via email
- Role-based access control (User, Admin)
- Profile completion requirement before accessing main features

### 📝 Report Management
- Report missing children with detailed information (name, age, gender, location, photo)
- Report found children with similar details
- Image upload with validation, compression, and Cloudinary storage
- Structured location data (country, state, district, city, coordinates)
- Report status tracking (Pending, Processing, Ai Matches, Resolved)

### 🤖 AI-Powered Face Matching
- Automatic face embedding generation using DeepFace (ArcFace model)
- RetinaFace face detection with OpenCV fallback
- Cosine similarity-based matching
- Metadata filtering (age tolerance, gender compatibility, location radius)
- Cross-user matching enforcement (prevents self-matches)
- Duplicate match prevention
- Confidence scoring (High ≥90%, Medium 75-89%, Low 60-74%)
- Top-5 ranked matches per report

### ⚙️ Background Job Processing
- Persistent AI job queue in MongoDB
- Embedded worker within FastAPI process
- Atomic job claiming with retry logic
- Automatic reclamation of stuck jobs
- Thread-safe model initialization with caching
- TensorFlow memory optimization for resource-constrained environments

### 👨‍💼 Admin Panel
- Dashboard statistics (users, reports, matches)
- User management (view, delete)
- Report management (view, delete, resolve)
- Match verification (confirm/reject)
- Audit log trail
- System health monitoring

### 🌐 Public Feed
- Public-facing missing children feed
- State-wise statistics for intelligence map
- Emergency contact information
- Government agency contacts

### 🔔 Notifications
- In-app notifications with polling
- Email notifications (optional SMTP)
- User notification preferences
- Match alert notifications

## 🏗️ System Architecture

```mermaid
graph TD
    A[User] --> B[React Frontend]
    B --> C[FastAPI Backend]
    C --> D[MongoDB Atlas]
    C --> E[Cloudinary]
    C --> F[AI Worker]
    F --> G[DeepFace/ArcFace]
    F --> H[TensorFlow]
    C --> I[Matching Service]
    I --> D
```

### Architecture Flow

1. **Frontend (React + Vite)**: User interface for reporting, viewing matches, and admin operations
2. **Backend (FastAPI)**: RESTful API, authentication, report processing, matching logic
3. **Database (MongoDB Atlas)**: Persistent storage for users, reports, embeddings, matches, jobs
4. **Image Storage (Cloudinary)**: Cloud-based image hosting with compression
5. **AI Worker**: Background task processing for face embedding generation and matching
6. **Face Recognition (DeepFace/ArcFace)**: Face detection and embedding generation
7. **Matching Service**: Candidate filtering, similarity calculation, match ranking

## 🧠 AI-Powered Face Matching

### Face Detection
- **Primary Detector**: RetinaFace (deep learning-based)
- **Fallback Detector**: OpenCV Haar Cascade
- **Configuration**: Environment variable `DETECTOR_BACKEND` (default: retinaface)

### Face Recognition Model
- **Model**: ArcFace (via DeepFace library)
- **Configuration**: Environment variable `FACE_MODEL_NAME` (default: ArcFace)
- **Embedding**: Float vector array (dimension determined by model)
- **Preprocessing**: Automatic alignment and normalization handled by DeepFace

### Embedding Generation Process
1. Image downloaded from Cloudinary URL
2. Image decoded and converted to RGB format
3. Quality assessment (face detection, blur detection)
4. Face detection using configured detector backend
5. Face embedding generation using ArcFace
6. Embedding stored in MongoDB `face_embeddings` collection
7. Report updated with embedding status and model information

### Similarity Calculation
- **Metric**: Cosine similarity
- **Formula**: `similarity = (A · B) / (||A|| × ||B||) × 100`
- **Output**: Percentage (0.0 to 100.0)

### Match Threshold
- **Default Threshold**: 50.0 (configurable via `MATCH_THRESHOLD`)
- **Confidence Levels**:
  - High: ≥90.0
  - Medium: 75.0-89.9
  - Low: 60.0-74.9
  - No Match: <60.0

### Candidate Filtering
Before similarity calculation, candidates are filtered by:
- **Same User Rejection**: Matches between reports from the same user are blocked
- **Same Report Rejection**: Self-matches are blocked
- **Inactive Report Filtering**: Resolved/archived reports are excluded
- **Gender Compatibility**: Gender must match (if specified)
- **Age Compatibility**: Age difference within tolerance (default: 2 years)
- **Location Compatibility**: Within radius (default: 25km) or same state/district

### Ranking
- Matches ranked by final score (descending)
- Top N matches stored (default: 5, configurable via `TOP_MATCH_LIMIT`)
- Final score calculation with confidence-based penalties

### Duplicate Prevention
- Database query checks for existing match between same missing/found pair
- Prevents duplicate match creation
- Supports bidirectional matching (missing_id/found_id and found_id/missing_id)

## 🔍 How the Matching System Works

### Complete Workflow

1. **Report Submission**
   - User submits missing or found report with photo
   - Image validated, compressed, and uploaded to Cloudinary
   - Report document created in MongoDB (`children` or `children_found` collection)
   - AI job created in `ai_jobs` collection with status "queued"

2. **AI Job Processing**
   - Background worker polls `ai_jobs` collection every 5 seconds
   - Worker atomically claims job (status changes to "processing")
   - Report status updated to "processing"
   - Image downloaded from Cloudinary with retry logic (max 3 attempts)

3. **Embedding Generation**
   - Face detection and quality assessment
   - DeepFace/ArcFace generates face embedding vector
   - Embedding stored in `face_embeddings` collection
   - Report updated with `embedding_id`, `embedding_status`, `embedding_model`
   - Job marked as success

4. **Candidate Search**
   - System queries opposite collection (missing → found, found → missing)
   - Candidates filtered by metadata (gender, age, location, status)
   - Same-user and same-report matches rejected
   - Only reports with successful embeddings considered

5. **Similarity Calculation**
   - Cosine similarity computed between source and candidate embeddings
   - Raw score compared against `MATCH_THRESHOLD`
   - Candidates below threshold discarded

6. **Match Scoring**
   - Final score calculated with confidence-based penalties
   - Matches ranked by final score (descending)
   - Top N matches selected (default: 5)

7. **Match Creation**
   - Duplicate check performed (existing match between same pair)
   - Match document created in `matches` collection
   - Missing child status updated to "Ai Matches"
   - Audit log entry created

8. **Notification**
   - If email configured, notification sent to both reporters
   - In-app notification created for both users
   - Match visible in Matches page for both users

9. **Admin Verification**
   - Admin reviews matches in admin panel
   - Match confirmed or rejected
   - Status updated to "Confirmed" or "Rejected"
   - If confirmed, missing child status updated to "Resolved"

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.0.0
- **Styling**: Tailwind CSS 3.3.5
- **Routing**: React Router DOM 6.20.0
- **Icons**: Lucide React 0.292.0
- **Animations**: Framer Motion 12.42.2
- **Maps**: React Simple Maps 3.0.0
- **Testing**: Vitest 1.0.0
- **Linting**: ESLint 8.53.0

### Backend
- **Framework**: FastAPI 0.104.1
- **Runtime**: Python 3.11
- **ASGI Server**: Uvicorn 0.24.0
- **Database Driver**: Motor 3.3.2 (async MongoDB)
- **Authentication**: python-jose 3.3.0 (JWT), passlib 1.7.4 (bcrypt)
- **Validation**: Pydantic 2.5.3
- **Email**: Flask-Mail 2.3.3 (via SMTP)
- **HTTP Client**: httpx 0.25.2, aiohttp 3.9.1

### Database
- **Database**: MongoDB Atlas
- **Driver**: Motor (async Python driver)
- **Collections**: users, children, children_found, face_embeddings, matches, ai_jobs, audit_logs, user_notifications

### AI / Machine Learning
- **Face Recognition**: DeepFace 0.0.89
- **Face Detection**: RetinaFace 0.0.18, OpenCV 4.8.1.78
- **Recognition Model**: ArcFace (via DeepFace)
- **Backend**: TensorFlow 2.15.0, Keras 2.15.0
- **Image Processing**: Pillow 10.1.0, NumPy 1.26.2
- **Additional**: MTCNN 1.0.0 (alternative detector)

### Cloud Services
- **Image Storage**: Cloudinary 1.36.0
- **Database**: MongoDB Atlas

### Deployment
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Frontend Server**: Nginx (Alpine)
- **Backend Server**: Uvicorn
- **Process Management**: Embedded asyncio worker

### Development Tools
- **Package Manager**: npm (frontend), pip (backend)
- **Version Control**: Git
- **Environment**: dotenv (python-dotenv 1.0.0)

## 📁 Project Structure

```
LOST-FOUND-SYSTEM/
├── backend/
│   ├── app/
│   │   ├── routes/              # API endpoint definitions
│   │   │   ├── auth.py          # Authentication endpoints
│   │   │   ├── admin.py         # Admin management endpoints
│   │   │   ├── children.py      # Lost/found report endpoints
│   │   │   ├── match.py         # Match management endpoints
│   │   │   ├── user.py          # User profile endpoints
│   │   │   ├── public.py        # Public feed endpoints
│   │   │   ├── intelligence.py  # Intelligence map endpoints
│   │   │   └── report.py        # Report endpoints
│   │   ├── services/            # Business logic
│   │   │   ├── embedding_service.py   # Face embedding generation
│   │   │   ├── face_matcher.py        # DeepFace integration
│   │   │   ├── matching_service.py    # Similarity calculation & ranking
│   │   │   ├── job_service.py         # AI job queue management
│   │   │   ├── storage_service.py     # Cloudinary integration
│   │   │   ├── email_service.py       # Email notifications
│   │   │   ├── otp_service.py         # OTP generation/verification
│   │   │   ├── sms_service.py         # SMS notifications
│   │   │   └── audit_service.py       # Audit logging
│   │   ├── models/               # Pydantic models
│   │   │   ├── user_model.py
│   │   │   ├── child_model.py
│   │   │   ├── location_model.py
│   │   │   └── report_model.py
│   │   ├── database/             # Database configuration
│   │   │   ├── db.py             # MongoDB connection
│   │   │   └── indexes.py        # Database indexes
│   │   ├── utils/                # Utility functions
│   │   │   ├── file_utils.py     # File upload/validation
│   │   │   ├── passwords.py      # Password hashing
│   │   │   ├── tokens.py         # JWT token management
│   │   │   └── errors.py         # Error handling
│   │   ├── dependencies/         # FastAPI dependencies
│   │   │   └── auth_deps.py      # Authentication dependencies
│   │   ├── main.py               # FastAPI application entry point
│   │   ├── config.py             # Configuration management
│   │   └── worker.py             # AI background worker
│   ├── requirements.txt          # Python dependencies
│   ├── Dockerfile               # Backend Docker configuration
│   └── run.py                   # Local development runner
├── frontend/
│   ├── src/
│   │   ├── pages/                # React page components
│   │   │   ├── Home.jsx
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── ReportLost.jsx
│   │   │   ├── ReportFound.jsx
│   │   │   ├── MissingChildren.jsx
│   │   │   ├── FoundChildren.jsx
│   │   │   ├── Matches.jsx
│   │   │   ├── Admin.jsx
│   │   │   ├── Settings.jsx
│   │   │   ├── News.jsx
│   │   │   ├── IntelligenceMap.jsx
│   │   │   └── ...
│   │   ├── components/           # Reusable components
│   │   │   ├── admin/
│   │   │   ├── children/
│   │   │   ├── common/
│   │   │   ├── home/
│   │   │   ├── layout/
│   │   │   ├── map/
│   │   │   ├── match/
│   │   │   ├── news/
│   │   │   ├── publicfeed/
│   │   │   └── report/
│   │   ├── context/              # React context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── NotificationContext.jsx
│   │   ├── services/             # API service layer
│   │   │   └── api.js
│   │   ├── routes/               # React Router configuration
│   │   │   └── AppRoutes.jsx
│   │   ├── utils/                # Utility functions
│   │   ├── constants/            # Application constants
│   │   ├── hooks/                # Custom React hooks
│   │   ├── App.jsx               # Root component
│   │   └── main.jsx              # Application entry point
│   ├── package.json              # Node.js dependencies
│   ├── vite.config.js            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS configuration
│   ├── Dockerfile                # Frontend Docker configuration
│   ├── nginx.conf                # Nginx configuration
│   └── vercel.json               # Vercel deployment configuration
├── .env.example                  # Environment variables template
├── .gitignore                    # Git ignore rules
├── docker-compose.yml            # Docker Compose configuration
└── README.md                     # This file
```

## 🚀 Installation

### Prerequisites

- **Node.js**: 18.x or higher
- **Python**: 3.11 or higher
- **MongoDB**: MongoDB Atlas account (free tier sufficient)
- **Cloudinary**: Cloudinary account (free tier sufficient)

### Backend Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd LOST-FOUND-SYSTEM
   ```

2. **Create virtual environment**
   ```bash
   cd backend
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   ```

3. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment variables**
   ```bash
   # Copy .env.example to .env in project root
   cd ..
   cp .env.example .env
   
   # Edit .env and set required variables:
   # - MONGO_URI (MongoDB Atlas connection string)
   # - SECRET_KEY (JWT signing secret, 32+ characters)
   # - CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
   ```

5. **Start backend server**
   ```bash
   cd backend
   python run.py
   ```
   
   Backend will be available at `http://127.0.0.1:8000`
   API documentation at `http://127.0.0.1:8000/docs`

### Frontend Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Configure environment variables**
   ```bash
   # Create .env file in frontend directory
   cp .env.example .env
   
   # Edit .env and set:
   # - VITE_API_BASE_URL (default: http://localhost:8000/api)
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```
   
   Frontend will be available at `http://localhost:5173`

## 🔐 Environment Variables

### Required Variables

- `MONGO_URI` — MongoDB Atlas connection string
  - Example: `mongodb+srv://username:password@cluster.mongodb.net/guardian_link?retryWrites=true&w=majority`
  
- `SECRET_KEY` — JWT signing secret (minimum 32 characters)
  - Generate a secure random string for production
  - Example: `your-very-secure-secret-key-minimum-32-characters-long`

### Optional Variables

#### Database
- `DB_NAME` — Database name (default: `guardian_link`)

#### Authentication
- `ACCESS_TOKEN_EXPIRE_MINUTES` — Access token lifetime in minutes (default: 30)
- `REFRESH_TOKEN_EXPIRE_DAYS` — Refresh token lifetime in days (default: 7)
- `PASSWORD_RESET_EXPIRE_MINUTES` — Password reset link validity (default: 30)
- `EMAIL_VERIFY_EXPIRE_HOURS` — Email verification link validity (default: 24)

#### CORS
- `CORS_ORIGINS` — Comma-separated list of allowed origins (default: `http://localhost:5173,http://127.0.0.1:5173`)

#### File Uploads
- `MAX_UPLOAD_SIZE_MB` — Maximum upload size in MB (default: 10)

#### Cloudinary
- `CLOUDINARY_CLOUD_NAME` — Cloudinary cloud name
- `CLOUDINARY_API_KEY` — Cloudinary API key
- `CLOUDINARY_API_SECRET` — Cloudinary API secret

#### Email (SMTP)
- `SMTP_HOST` — SMTP server host
- `SMTP_PORT` — SMTP server port (default: 587)
- `SMTP_USER` — SMTP username
- `SMTP_PASSWORD` — SMTP password
- `SMTP_FROM` — From email address

#### AI Model
- `FACE_MODEL_NAME` — Face recognition model (default: ArcFace)
- `DETECTOR_BACKEND` — Face detector backend (default: retinaface)
- `MATCH_THRESHOLD` — Similarity threshold for matches (default: 50.0)
- `TOP_MATCH_LIMIT` — Maximum matches per report (default: 5)
- `AGE_TOLERANCE` — Age difference tolerance in years (default: 2)
- `LOCATION_RADIUS` — Location matching radius in km (default: 25.0)
- `HIGH_MATCH_THRESHOLD` — High confidence threshold (default: 90.0)
- `MEDIUM_MATCH_THRESHOLD` — Medium confidence threshold (default: 75.0)
- `LOW_MATCH_THRESHOLD` — Low confidence threshold (default: 60.0)

#### Default Admin
- `DEFAULT_ADMIN_EMAIL` — Default admin email (default: admin@guardianlink.com)
- `DEFAULT_ADMIN_PASSWORD` — Default admin password (default: 1234)
- `DEFAULT_ADMIN_NAME` — Default admin name (default: System Admin)

#### Google OAuth
- `GOOGLE_CLIENT_ID` — Google OAuth client ID
- `GOOGLE_CLIENT_SECRET` — Google OAuth client secret
- `GOOGLE_OAUTH_ENABLED` — Enable Google OAuth (default: true)

#### SMS Provider
- `SMS_PROVIDER` — SMS provider (options: twilio, mock; default: mock)
- `SMS_API_KEY` — SMS API key
- `SMS_SENDER_ID` — SMS sender ID

## 💻 Running the Project Locally

### Complete Local Development

1. **Terminal 1 - Backend**
   ```bash
   cd backend
   python -m venv venv
   venv\Scripts\activate  # Windows
   # source venv/bin/activate  # macOS/Linux
   pip install -r requirements.txt
   python run.py
   ```

2. **Terminal 2 - Frontend**
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

3. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:8000
   - API Documentation: http://localhost:8000/docs

### Docker Compose (Recommended for Testing)

```bash
# Configure .env file
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up --build

# Access the application
# Frontend: http://localhost
# Backend: http://localhost:8000
```

## 📚 API Documentation

### Authentication Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | User login | No |
| POST | `/api/auth/refresh` | Refresh access token | No |
| POST | `/api/auth/logout` | User logout | No |
| POST | `/api/auth/forgot-password` | Request password reset | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| POST | `/api/auth/verify-email` | Verify email address | No |
| POST | `/api/auth/google` | Google OAuth authentication | No |
| POST | `/api/auth/send-otp` | Send OTP for mobile verification | No |
| POST | `/api/auth/verify-otp` | Verify OTP code | No |
| GET | `/api/auth/me` | Get current user info | Yes |

### User Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/user/profile` | Get user profile | Yes |
| PUT | `/api/user/profile` | Update user profile | Yes |
| PUT | `/api/user/change-password` | Change password | Yes |
| DELETE | `/api/user/account` | Delete user account | Yes |

### Report Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/children/report-lost` | Report missing child | Yes |
| POST | `/api/children/report-found` | Report found child | Yes |
| GET | `/api/children/missing` | Get missing children reports | Yes |
| GET | `/api/children/found` | Get found children reports | Yes |
| GET | `/api/children/{id}` | Get specific report | Yes |
| DELETE | `/api/children/{id}` | Delete report | Yes (Admin) |

### Match Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/matches/` | Get all matches for current user | Yes |
| GET | `/api/matches/{match_id}` | Get specific match details | Yes |
| POST | `/api/matches/{match_id}/confirm` | Confirm a match | Yes (Admin) |
| POST | `/api/matches/{match_id}/reject` | Reject a match | Yes (Admin) |
| GET | `/api/matches/statistics` | Get match statistics | Yes (Admin) |

### Admin Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/admin/dashboard` | Get dashboard statistics | Yes (Admin) |
| GET | `/api/admin/all-users` | Get all users | Yes (Admin) |
| DELETE | `/api/admin/users/{user_id}` | Delete user | Yes (Admin) |
| DELETE | `/api/admin/missing/{child_id}` | Delete missing report | Yes (Admin) |
| DELETE | `/api/admin/found/{child_id}` | Delete found report | Yes (Admin) |
| GET | `/api/admin/audit-logs` | Get audit logs | Yes (Admin) |

### Public Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/public/feed` | Get public missing children feed | No |
| GET | `/api/public/stats` | Get public statistics | No |
| GET | `/api/public/recent-alerts` | Get recent alerts | No |
| GET | `/api/public/intelligence-map` | Get intelligence map data | No |
| GET | `/api/public/report/{report_id}` | Get public report details | No |

### Intelligence Endpoints

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/intelligence/state-stats` | Get state-wise statistics | Yes (Admin) |
| GET | `/api/intelligence/district-stats` | Get district-wise statistics | Yes (Admin) |
| GET | `/api/intelligence/timeline` | Get timeline data | Yes (Admin) |

Full interactive API documentation available at `/docs` when backend is running.

## 🔑 Authentication

The system uses JWT (JSON Web Tokens) for authentication with the following flow:

1. **Registration**: User registers with email, mobile, and password
2. **Email Verification**: Verification email sent (optional SMTP)
3. **Mobile Verification**: OTP sent via SMS (optional Twilio)
4. **Profile Completion**: User completes profile before accessing main features
5. **Login**: User receives access token (30 min) and refresh token (7 days)
6. **Token Refresh**: Access token refreshed using refresh token
7. **Logout**: Tokens invalidated on server

### Token Types

- **Access Token**: Short-lived (30 minutes), used for API requests
- **Refresh Token**: Long-lived (7 days), used to obtain new access tokens

### Google OAuth

Users can authenticate using Google OAuth:
- Google Identity Services integration
- Automatic profile completion for new users
- Seamless login for existing users

## 🗄️ Database

### MongoDB Collections

#### users
- User accounts and authentication data
- Fields: email, password (hashed), full_name, mobile, gender, address, role, email_verified, mobile_verified, profile_complete, preferences, created_at

#### children
- Missing child reports
- Fields: child_name, age, gender, location_structured, date_missing, description, image_url, public_id, reporter_email, user_id, embedding_id, embedding_status, embedding_model, status, created_at

#### children_found
- Found child reports
- Fields: same as children collection

#### face_embeddings
- Face embedding vectors
- Fields: report_id, embedding (float vector array), model_name, detector_backend, created_at

#### matches
- Match records between missing and found reports
- Fields: missing_id, found_id, missing_reporter, found_reporter, rank, confidence, similarity, raw_score, score, status, created_at

#### ai_jobs
- AI processing job queue
- Fields: report_id, report_type, report_collection, status, attempts, max_attempts, created_at, started_at, completed_at, last_error, next_retry_at

#### audit_logs
- System audit trail
- Fields: action, actor_email, target_type, target_id, details, created_at

#### user_notifications
- User notifications
- Fields: recipient_email, type, title, message, read, created_at

### Database Indexes

Indexes are automatically created on startup for:
- users: email (unique)
- children: reporter_email, status, embedding_status, created_at
- children_found: reporter_email, status, embedding_status, created_at
- face_embeddings: report_id (unique)
- matches: missing_id, found_id, created_at
- ai_jobs: status, next_retry_at, created_at

## 🖼️ Image Storage

### Cloudinary Integration

Images are stored exclusively on Cloudinary:
- Automatic compression before upload
- Organized in folders: `guardian-link/lost/` and `guardian-link/found/`
- Public ID based on UUID filename
- Secure URLs returned to frontend
- Image deletion on report deletion

### Image Processing

1. **Validation**: MIME type check (jpeg, png, webp, jpg)
2. **Size Limit**: Maximum 10MB (configurable)
3. **Compression**: Automatic compression before upload
4. **Filename**: UUID-based to prevent collisions
5. **Format**: Original format preserved

## ⚙️ Background Worker and AI Processing

### Worker Architecture

The AI worker is embedded within the FastAPI process as an asyncio background task:

- **Startup**: Worker starts during FastAPI lifespan
- **Polling**: Polls `ai_jobs` collection every 5 seconds
- **Claiming**: Atomically claims jobs using MongoDB find_one_and_update
- **Processing**: Processes jobs sequentially (one at a time)
- **Shutdown**: Gracefully cancelled on FastAPI shutdown

### Job Lifecycle

1. **Created**: Job created with status "queued"
2. **Claimed**: Worker claims job, status changes to "processing"
3. **Processing**: Worker downloads image, generates embedding
4. **Success**: Job marked as success, report updated
5. **Failure**: Job marked as failure, error logged
6. **Retry**: Failed jobs requeued with exponential backoff
7. **Reclamation**: Jobs stuck in "processing" > 5 minutes reclaimed

### Thread-Safe Model Initialization

- **Lock Protection**: threading.Lock() prevents concurrent initialization
- **Double-Check Locking**: Efficient lock usage with double-check pattern
- **Model Caching**: Initialized model cached globally for reuse
- **Error Caching**: Initialization failures cached to prevent retry loops
- **Thread Detection**: Skips pre-warming in worker threads (signal handling incompatible)

### TensorFlow Memory Optimization

- **Memory Growth**: GPU memory growth enabled (prevents full allocation)
- **Thread Limiting**: CPU parallelism limited to 1 thread
- **Warning Suppression**: TensorFlow warnings suppressed
- **Graceful Fallback**: Continues with default settings if configuration fails

### Production Behavior

- **Automatic Reconnection**: MongoDB reconnection on connection errors
- **Stuck Job Reclamation**: Jobs stuck > 5 minutes automatically requeued
- **Retry Logic**: Failed jobs retry up to 5 times
- **Diagnostic Logging**: Detailed logs for debugging AI pipeline

## 🚀 Deployment

### Docker Deployment

The application supports Docker-based deployment using Docker Compose for self-hosted environments.

```bash
# Build and start all services
docker-compose up --build

# Services:
# - Frontend (Nginx on port 80)
# - Backend (FastAPI on port 8000)
```

### Environment Configuration

Required environment variables for deployment:
- MongoDB Atlas connection string
- Cloudinary credentials
- JWT secret key
- SMTP credentials (for email, optional)
- Google OAuth credentials (optional)

### Build Process

**Frontend**:
```bash
cd frontend
npm run build
# Output: dist/ directory
```

**Backend**:
```bash
cd backend
pip install -r requirements.txt
# No build step required
```

## ⚡ Production Considerations

### Resource Optimization

The application includes several optimizations for resource-constrained environments:

- **TensorFlow Memory Configuration**: GPU memory growth enabled to prevent full allocation
- **CPU Thread Limiting**: Parallelism limited to 1 thread to reduce memory pressure
- **Thread-Safe Model Initialization**: Lock-protected initialization with caching to prevent concurrent loading
- **Worker Thread Detection**: Skips pre-warming in worker threads to avoid signal handling issues

### AI Model Initialization

The face recognition model is initialized with the following considerations:

- **Lazy Loading**: Model loads on first use to reduce startup time
- **Error Caching**: Initialization failures are cached to prevent retry loops
- **Graceful Fallback**: Continues with default settings if configuration fails

### Job Processing

The background worker includes robust job processing:

- **Persistent Queue**: Jobs stored in MongoDB survive process restarts
- **Atomic Claiming**: Jobs claimed atomically to prevent duplicate processing
- **Stuck Job Reclamation**: Jobs stuck in "processing" > 5 minutes automatically requeued
- **Retry Logic**: Failed jobs retry up to 3 times with exponential backoff

## 📸 Screenshots

*Note: Screenshots should be added here to demonstrate the application interface.*

**Placeholder sections for screenshots:**
- Home page
- Report submission form
- Dashboard
- Matches page
- Admin panel
- Intelligence map

## 🚀 Future Improvements

Potential enhancements for future development:

- **Mobile Application**: React Native mobile app for on-the-go reporting
- **Real-time Notifications**: WebSocket-based real-time match alerts
- **Advanced Analytics**: More detailed analytics and reporting
- **Multi-language Support**: Internationalization for multiple languages
- **Offline Mode**: Progressive Web App (PWA) with offline capabilities
- **Video Support**: Video-based face recognition for missing children
- **Age Progression**: AI-based age progression for long-term missing cases
- **Integration with Authorities**: API integration with police and government databases
- **Blockchain Verification**: Blockchain-based report verification for authenticity

## 🔧 Troubleshooting

### Common Issues

**MongoDB Connection Error**
- Symptom: "Database connection is not available"
- Solution: Verify MONGO_URI in .env is correct and MongoDB Atlas is accessible

**Cloudinary Upload Error**
- Symptom: "Cloudinary is not configured" or upload fails
- Solution: Verify CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET in .env

**AI Model Initialization Timeout**
- Symptom: Jobs stuck in "processing" status
- Solution: Check logs for TensorFlow memory errors; consider reducing model complexity or upgrading hosting tier

**Frontend API Connection Error**
- Symptom: "Network Error" or "Failed to fetch"
- Solution: Verify VITE_API_BASE_URL in frontend .env matches backend URL

**Email Verification Not Sending**
- Symptom: Verification email not received
- Solution: Verify SMTP configuration in .env; check spam folder; SMTP may be disabled (logs to console if not configured)

**OTP Not Sending**
- Symptom: SMS OTP not received
- Solution: Verify SMS_PROVIDER and SMS_API_KEY; default is "mock" which logs to console

**Docker Build Fails**
- Symptom: Docker build fails with dependency errors
- Solution: Ensure Docker daemon is running; check internet connection; try building without cache

**Port Already in Use**
- Symptom: "Address already in use" error
- Solution: Change PORT in .env or stop conflicting process

### 🐛 Debug Mode

Enable debug mode by setting:
```bash
DEBUG=true
```

This enables:
- Detailed error messages
- Stack traces
- Additional logging

## 👥 Contributors

Academic Final Year Project

- Krish
- Shaurya
- Suraj
- Raj

## 📄 License

This is an academic final-year project. No specific license is currently applied.

For academic or educational use, please contact the project maintainers.

---

## 📞 Support

For issues, questions, or contributions, please refer to the project repository or contact the development team.

---

<div align="center">

**Built with ❤️ for a safer future**

</div>
