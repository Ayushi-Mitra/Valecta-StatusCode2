# Valecta

Valecta is an AI-powered recruitment platform built for StatusCode 2 Hackathon.  
It bridges the gap between **candidates** and **employers** with a seamless, automated, and trustworthy hiring process — while still keeping the final decision human.  

---

## ✨ Features

### 👨‍💻 Candidate Workflow
- Browse job postings and apply with a resume.  
- AI verifies:
  - **Skill match** – checks if required skills align with the resume.  
  - **Certificate authenticity** – prevents fake/plagiarized resumes.  
- If validated, candidate proceeds to an **AI-powered interview**:
  - Audio-based adaptive questions (each depends on the previous response).  
  - Candidate receives a **confidence score** (only visible to employers).  
- Upload resume for **AI career mapping**:
  - Suggested **current job opportunities**.  
  - **Future role recommendations** with personalized roadmaps.  

### 🏢 Employer Workflow
- Post job vacancies with minimal input.  
- AI automatically evaluates candidates and assigns confidence scores.  
- Employers view:
  - Candidate list + confidence scores.  
  - One-click **“Hire”** action — blending automation with human choice.  

---

## 🚀 Tech Stack
- **Frontend**: Next.js, Tailwind CSS, ShadCN UI  
- **Backend**: Node.js / Express  
- **AI Models**: Python (skills matcher, certificate verification, adaptive interview agent, career roadmap generator)  
- **Database & Auth**: Appwrite  
- **Deployment**: Vercel + Render (or relevant hosting services)  

---

## 📂 Project Structure

frontend/
├── app/
│   ├── appwrite.js
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   ├── lineBackground.css
│   ├── loading.tsx
│   ├── page.tsx                # Landing page
│   ├── auth/
│   │   ├── candidate/
│   │   │   └── page.tsx        # Candidate login/signup
│   │   ├── employer/
│   │   │   └── page.tsx        # Employer login/signup
│   │   └── page.tsx            # (Legacy, not used)
│   ├── employer/
│   │   ├── loading.tsx
│   │   ├── page.tsx            # Employer dashboard
│   │   └── jobs/
│   │       ├── [id]/
│   │       │   └── edit/
│   │       │       └── page.tsx
│   │       └── create/
│   │           └── page.tsx
│   ├── candidate/
│   │   ├── path-predictor/
│   │   │   └── page.tsx
│   │   └── dashboard/
│   │       └── page.tsx        # Candidate dashboard
│   └── components/
│       └── ui/
│           ├── avatar.tsx
│           ├── badge.tsx
│           ├── button.tsx
│           ├── card.tsx
│           ├── decrypted-text.tsx
│           ├── dialog.tsx
│           ├── FloatingShapes.tsx
│           ├── HeroSection.tsx
│           ├── input.tsx
│           ├── LineBackground.tsx
│           ├── progress.tsx
│           ├── select.tsx
│           ├── separator.tsx
│           ├── tabs.tsx
│           └── textarea.tsx
│   ├── lib/
│   │   ├── config.ts
│   │   └── utils.ts
│   └── public/
│       ├── file.svg
│       ├── globe.svg
│       ├── next.svg
│       ├── vercel.svg
│       └── window.svg
├── components.json
├── eslint.config.mjs
├── next-env.d.ts
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── README.md
├── tsconfig.json

ai/
├── interview.py
├── requirements.txt
└── plagiarism/
    ├── final.py
    ├── Resume.csv

README.md

---

## 🏆 Why Valecta?
- **Real-world relevance** → Tackles one of the biggest problems in hiring: resume fraud + skill mismatch.  
- **End-to-end automation** → From resume parsing to interview to employer shortlist.  
- **Scalable** → Can be deployed for universities, startups, and enterprises.  
- **Perfect balance** → AI handles the heavy lifting, but final hiring choice stays human.  

---

## 🔮 Future Scope
- Multi-language interview support.  
- AI-driven salary benchmarking.  
- Candidate personality & culture-fit assessment.  
- Employer dashboard with deeper analytics.  
