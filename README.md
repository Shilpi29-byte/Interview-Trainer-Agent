# Interview Trainer Agent

An AI-powered interview preparation platform for students and job seekers across India, built with **IBM Granite AI** (granite-4-h-small).

---

## Features

| Feature | Description |
|---|---|
| ❓ Generate Questions | Generate interview questions by role, topic, difficulty & language |
| 📝 Evaluate Answer | AI scores your answer out of 10 with actionable feedback |
| 🎤 Mock Interview | Conversational mock interview with an AI interviewer |
| 📄 Resume Tips | India-specific resume tips tailored to your role & experience |
| 🏢 Company Prep | Preparation guide for TCS, Infosys, Google, Amazon, Flipkart & more |

---

## Setup & Run

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
Copy `.env.example` to `.env` and fill in your IBM API key:
```bash
cp .env.example .env
```

Edit `.env`:
```
IBM_API_KEY=n5usGezF8NyYGMkHb5o41yWuMriGn9vQo3BIuzVRwsTa
IBM_ML_URL=https://us-south.ml.cloud.ibm.com/ml/v1/text/generation?version=2023-05-29
IBM_PROJECT_ID=b94b9639-06f5-4196-a776-665da871294e
IBM_MODEL_ID=ibm/granite-4-h-small
PORT=3000
```

### 3. Start the Server
```bash
cd backend
npm start
```

### 4. Open the App
Open your browser and go to: **http://localhost:3000**

---

## Project Structure

```
interview-trainer/
├── backend/
│   ├── server.js          # Express API server
│   ├── package.json
│   ├── .env               # Your secrets (git-ignored)
│   └── .env.example       # Template
└── frontend/
    └── index.html         # Full single-page UI
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/generate-question` | Generate interview question |
| POST | `/api/evaluate-answer` | Evaluate & score a candidate's answer |
| POST | `/api/mock-interview` | Mock interview conversational turn |
| POST | `/api/resume-tips` | Get resume tips |
| POST | `/api/company-prep` | Company-specific preparation guide |

---

## Tech Stack
- **Backend**: Node.js + Express
- **AI Model**: IBM Granite 4 H Small via IBM Watson ML
- **Frontend**: Vanilla HTML/CSS/JavaScript (no framework needed)
- **Auth**: IBM IAM token (auto-refreshed every ~55 minutes)
