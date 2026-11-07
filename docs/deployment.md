# Deployment & Reviewer Guide — ClaimFlow AI

Welcome to **ClaimFlow AI**, an enterprise-grade hospital cashless insurance claims and TPA workspace. This document provides step-by-step instructions for local development, reviewer testing, and production deployment.

---

## 1. Quick Reviewer Demo Credentials

For quick evaluation, seed data is provided with two designated role accounts:

| Role | Email | Password | Organization Scope |
| :--- | :--- | :--- | :--- |
| **Hospital Staff** | `hospital@claimflow.demo` | `HospitalStaff@2026!` | City Care Multispecialty Hospital |
| **TPA Manager** | `tpa@claimflow.demo` | `TPAManager@2026!` | HealthGuard TPA Services |

> **Note:** The login interface includes a **1-Click Demo Account Switcher** for reviewer convenience. However, arbitrary client-side role escalation is strictly prohibited by backend RBAC.

---

## 2. System Prerequisites

Ensure the following tools are installed on your host system:
- **Node.js**: v18.0.0 or higher (v20+ recommended, tested on v22.19.0)
- **npm**: v9.0.0 or higher
- **MongoDB**: MongoDB Atlas cluster URI or local MongoDB daemon (`mongodb://127.0.0.1:27017/claimflow`)
- **AI API Key** *(Optional for core UI/tests, required for live AI document extraction)*:
  - Google Gemini API Key (`GEMINI_API_KEY`) **or**
  - OpenAI API Key (`OPENAI_API_KEY`)

---

## 3. Local Installation & Setup

### Step 1: Clone the Repository
```bash
git clone https://github.com/manoharnm/claimflow-ai.git
cd claimflow-ai
```

### Step 2: Install Backend Dependencies
```bash
cd server
npm install
```

### Step 3: Install Frontend Dependencies
```bash
cd ../client
npm install
```

### Step 4: Configure Environment Variables

Create `server/.env` by copying `server/.env.example`:
```bash
cp server/.env.example server/.env
```

Populate the required values:
```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://<user>:<password>@cluster0.mongodb.net/claimflow?retryWrites=true&w=majority
JWT_SECRET=your-secure-random-jwt-secret-key-32-chars-minimum
JWT_EXPIRES_IN=8h
CLIENT_URL=http://localhost:5173

# AI Extraction Provider (gemini or openai)
AI_PROVIDER=gemini
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# Document Upload Limits
UPLOAD_DIR=uploads
MAX_FILE_SIZE_MB=15
```

---

## 4. Seeding the Database

Run the database seed script to populate demo users, realistic multi-TPA claims, itemized hospital bills, AI extraction records, active TPA queries, and audit logs:

```bash
cd server
npm run seed
```

This seeds:
- 2 Active Demo Accounts (`hospital@claimflow.demo` and `tpa@claimflow.demo`)
- 12+ Realistic Cashless Claims across Star Health, Medi Assist, Niva Bupa, HDFC ERGO, and ICICI Lombard
- Varied claim lifecycle statuses: `DRAFT`, `SUBMITTED`, `TPA_REVIEW`, `QUERY_RAISED`, `APPROVED`, `SANCTIONED`, `SETTLED`, `REJECTED`
- Active TPA query with pending deadlines
- Sample PDF documents in the storage folder
- Chronological immutable audit trails

---

## 5. Running the Application Locally

### Run Backend Server (Express + TypeScript)
```bash
cd server
npm run dev
# Server runs on http://localhost:5000
```

### Run Frontend Client (Vite + React)
```bash
cd client
npm run dev
# Application accessible at http://localhost:5173
```

---

## 6. Running Automated Tests

Execute the automated test suite covering Authentication, RBAC, State Machine Transitions, Financial Calculations, AI Extraction Validation, and Fallback:

```bash
cd server
npm test
```

For test coverage report:
```bash
cd server
npm run test:coverage
```

---

## 7. Production Deployment Instructions

### A. Backend on Render
1. Create a new **Web Service** on [Render](https://render.com).
2. Connect your GitHub repository.
3. Set **Root Directory** to `server`.
4. Set **Build Command** to: `npm install && npm run build`
5. Set **Start Command** to: `npm run start`
6. Add the following Environment Variables in the Render dashboard:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `MONGODB_URI`: `<Your MongoDB Atlas Connection String>`
   - `JWT_SECRET`: `<Secure Random Secret>`
   - `CLIENT_URL`: `https://your-client-app.vercel.app`
   - `AI_PROVIDER`: `gemini`
   - `GEMINI_API_KEY`: `<Your Google Gemini API Key>`

### B. Frontend on Vercel
1. Import your GitHub repository into [Vercel](https://vercel.com).
2. Set **Root Directory** to `client`.
3. Framework Preset: **Vite**.
4. Set **Build Command**: `npm run build`
5. Set **Output Directory**: `dist`
6. In **Environment Variables**, set:
   - `VITE_API_BASE_URL`: `https://your-render-backend.onrender.com/api`
7. Deploy.

### C. Database on MongoDB Atlas
1. Create a free M0 cluster or serverless instance on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Create a Database User with read/write access.
3. In **Network Access**, allow access from Render's IP addresses or `0.0.0.0/0` (with strong user credentials).
4. Obtain the SRV connection string: `mongodb+srv://<user>:<password>@cluster0.mongodb.net/claimflow?retryWrites=true&w=majority`.

---

## 8. Troubleshooting & FAQ

- **Q: What happens if no AI API key is configured?**
  - The application enters a graceful `AI_SERVICE_UNAVAILABLE` fallback mode. It explicitly notifies the user that external AI extraction is unconfigured, displays an intuitive warning badge, and opens the manual verification interface without halting the claim progression.
- **Q: How does the AI uncertainty threshold work?**
  - Fields extracted by the LLM are evaluated using deterministic heuristic scoring. If the calibrated confidence is below `0.80`, the field is marked in yellow as uncertain and requires human staff verification and reason entry before the claim can be submitted.
