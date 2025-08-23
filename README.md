# Valecta-StatusCode2

## Valecta — AI-Powered Hiring Platform

Valecta is a dual-sided web platform for Candidates and Employers. Candidates can upload resumes for an AI-powered plagiarism check. If the resume passes, the candidate can take an AI interview. A confidence score is generated from that interview and is visible only to the employer.

### Current Status

- Frontend (Next.js App Router) is scaffolded. UI components (badge, button, card, FloatingShapes, HeroSection, LineBackground, avatar, dialog, input, progress, select, separator, tabs, textarea) are implemented. Employer and job management pages/routes have been added (`/employer`, `/employer/jobs/create`, `/employer/jobs/[id]/edit`). Utility/config files and static assets are present.
- AI module (Python) includes initial plagiarism detection logic in `plagiarism/final.py` and sample resume data in `plagiarism/Resume.csv`. No integration yet; skill extraction and interview logic are not present in the current files.

## Key Features (Planned)

- Candidate
  - Upload resume for AI plagiarism screening
  - AI extracts skills and provides career path suggestions
  - If the resume passes plagiarism checks, proceed to an AI interview
  - Interview generates a confidence score (not visible to the candidate)
- Employer
  - View applicants for a role
  - See AI-generated confidence score per candidate
  - Future: job posting and management

## Tech Stack

- Frontend: Next.js (App Router), TypeScript, TailwindCSS, shadcn/ui, lucide-react
- AI Service: Python, OpenAI API, Pydantic, python-dotenv

## Repository Structure

```text
ai/
  requirements.txt
  plagiarism/
    final.py
    Resume.csv

frontend/
  app/
    appwrite.js
    favicon.ico
    globals.css
    layout.tsx
    lineBackground.css
    loading.tsx
    page.tsx
    auth/
      page.tsx
    employer/
      jobs/
        create/
          page.tsx
        [id]/
          edit/
            page.tsx
      loading.tsx
      page.tsx
  components/
    ui/
      avatar.tsx
      badge.tsx
      button.tsx
      card.tsx
      dialog.tsx
      FloatingShapes.tsx
      HeroSection.tsx
      input.tsx
      LineBackground.tsx
      progress.tsx
      select.tsx
      separator.tsx
      tabs.tsx
      textarea.tsx
  lib/
    config.ts
    utils.ts
  public/
    file.svg
    globe.svg
    next.svg
    vercel.svg
    window.svg
  package.json
  package-lock.json
  tsconfig.json
  eslint.config.mjs
  postcss.config.mjs
  next.config.ts
  components.json
```

## Local Setup

### Prerequisites

- Node.js 18+
- Python 3.10+
- An OpenAI API key

### 1) Frontend

```bash
cd frontend
npm install
npm run dev
# App runs on http://localhost:3000
```

Candidate routes (available today):

- `/` — Landing page
- `/auth` — Simple role/entry selection
- `/candidate/dashboard` — Candidate dashboard
- `/candidate/jobs` — Job listings
- `/candidate/jobs/[id]` — Job details
- `/candidate/profile` — Candidate profile

Header behavior:

- Clicking the brand/logo navigates to `/candidate/dashboard` (except on the landing page)
- User menu contains a red “Log out” option (clears local auth token and returns to `/`)

### 2) AI Service

Create and configure a virtual environment (optional but recommended), then install dependencies:

```bash
cd ai
pip install -r requirements.txt
```

What it does today:

- Plagiarism detection logic is present in `plagiarism/final.py` (see code for usage)
- Sample resume data is available in `plagiarism/Resume.csv`

Planned next:

- Integrate skill extraction and AI interview logic
- Expose API endpoints for the frontend to consume

## Product Flows

### Candidate Flow

1. Visit `/auth`, choose “Candidate”, sign in or continue
2. Upload resume → AI plagiarism check
3. If passed → AI interview
4. Score generated and stored server-side (not shown to candidate)

### Employer Flow

1. Visit `/auth`, choose “Employer”
2. View candidates that applied to a job
3. See the AI confidence score per candidate (visible only to employers)

## Privacy & Visibility

- The AI interview confidence score is stored for employer visibility only
- Candidate UI must not display the score

## Development Notes

- The current code uses local storage for a basic “authToken” placeholder in the UI. Replace with real auth in production.
- Frontend and AI service are currently separate. Integration points will include:
  - Resume upload endpoint (plagiarism check + skill extraction)
  - Interview orchestration endpoint (session state + question flow + scoring)
  - Employer-facing endpoints to fetch scores

## Roadmap

- Resume plagiarism detection pipeline
- AI interview orchestration and scoring in `ai/interview.py`
- REST (or RPC) interface between `frontend/` and `ai/`
- Employer dashboard for job posting and candidate review
- Persistent storage (e.g., Postgres) and auth
- CI/CD and deployment scripts

## Contributing

1. Create a feature branch
2. Commit small, logically scoped edits
3. Open a PR and describe the change and test steps

## License

TBD
