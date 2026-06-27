# 🛡️ Guardian-Link

## AI-Powered Lost & Found Children Identification System

Guardian-Link is a full-stack web application that helps authorities and citizens report missing children, submit sightings of found children, and uses **AI-powered facial recognition** to automatically match and reconnect families.

---

## 🚀 Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React.js + Tailwind CSS (Vite) |
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB |
| **AI Engine** | DeepFace (Facenet model) + OpenCV |

---

## 📁 Project Structure

```
Guardian-Link/
│
├── frontend/               # React + Tailwind (Vite)
│   ├── src/
│   │   ├── components/
│   │   │   ├── layout/     # Header, Footer, Sidebar, Layout
│   │   │   ├── common/     # Button, Input, Loader
│   │   │   ├── admin/      # AdminCard, AdminTable
│   │   │   ├── children/   # ChildCard, ChildForm
│   │   │   ├── match/      # MatchCard, MatchResult
│   │   │   └── report/     # ReportForm, ReportCard
│   │   ├── pages/          # All 10 pages
│   │   ├── services/       # API service layer
│   │   ├── routes/         # AppRoutes
│   │   └── context/        # AuthContext
│   └── package.json
│
├── backend/                # FastAPI
│   ├── app/
│   │   ├── main.py         # Entry point
│   │   ├── config.py       # Configuration
│   │   ├── routes/         # API endpoints
│   │   ├── models/         # Pydantic schemas
│   │   ├── database/       # MongoDB connection
│   │   ├── services/       # Face matcher AI
│   │   └── utils/          # Helper functions
│   ├── uploads/            # Image storage
│   ├── requirements.txt
│   └── run.py
│
├── database/               # MongoDB schema
├── ai-model/               # AI model files
├── README.md
└── .gitignore
```

---

## ⚙️ Setup Instructions

### Prerequisites
- **Node.js** v18+
- **Python** 3.10+
- **MongoDB** running on mongodb+srv://munjaparakrish25:<Krish123>@guardian-link.ffn1qkp.mongodb.net/?appName=guardian-link

### Backend Setup

```bash
cd backend
pip install -r requirements.txt
python run.py
```

The API will be available at `http://127.0.0.1:8000`

**Default Admin Account:**
- Email: `admin@guardianlink.com`
- Password: `1234`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`

---

## 🔑 Key Features

### 🔐 Authentication
- JWT-based authentication
- Role-based access (Admin / User)
- Secure password hashing (bcrypt)

### 📝 Report System
- Report missing children with photo upload
- Report found children with location data
- Auto-geolocation support

### 🤖 AI Face Matching
- DeepFace with Facenet model
- Automatic matching on report submission
- Cosine similarity scoring (0-100%)
- Confidence levels: High (75%+), Medium (50-74%), Low (<50%)

### 👤 Admin Panel
- User management (view, delete)
- Dashboard statistics
- System monitoring

### ⚙️ Settings
- Profile management
- Dark mode toggle
- Notification preferences
- Password change

---

## 📊 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login and get JWT |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/children/report-lost` | Report missing child |
| POST | `/api/children/report-found` | Report found child |
| GET | `/api/children/missing` | List missing children |
| GET | `/api/children/found` | List found children |
| GET | `/api/matches/` | Get AI match results |
| GET | `/api/reports/stats` | Dashboard statistics |
| GET | `/api/admin/dashboard` | Admin dashboard data |
| DELETE | `/api/admin/users/{id}` | Delete user |

---

## 🏗️ Architecture Principles

1. **Component-Based Architecture** — UI broken into reusable components
2. **Clean Separation** — Routes, Services, Models, Utils are separate modules
3. **Pages Assemble Components** — Pages only compose components, no business logic
4. **Single Responsibility** — Each file has one clear purpose
5. **DRY** — No duplicate code (e.g., ChildCard used by both Missing and Found pages)

---

## 📄 License

This project is developed for academic purposes (Final Year Project).

---

**Made with ❤️ by Krish,Shaurya,Suraj,Raj**
