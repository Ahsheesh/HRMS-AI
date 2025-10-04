# HRMS Demo - Human Resource Management System

A full-stack HRMS demo with MongoDB, Node.js/Express, React, and Python AI microservices.

## Features

- **Onboarding**: AI-powered onboarding checklist generation from job descriptions
- **Performance Reviews**: Track employee performance with AI-driven attrition risk insights
- **Resource Allocation**: Smart project-employee matching based on skills
- **People Management**: Employee profiles, skills, and status tracking

## Architecture

```
├── api/              # Node.js + Express + Mongoose API
├── ai-service/       # Python FastAPI AI microservice
├── src/              # React + Vite frontend
├── docker-compose.yml
└── Makefile
```

## Tech Stack

- **Backend**: Node.js 20, Express, Mongoose, TypeScript
- **Database**: MongoDB 7
- **AI Service**: Python 3.11, FastAPI, ChromaDB (stubs)
- **Frontend**: React 18, Vite, Tailwind CSS, TypeScript
- **Infrastructure**: Docker Compose

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Node.js 20+ (for local frontend dev)

### 1. Start Services

```bash
# Build and start all services
make start

# Or manually:
docker-compose up -d
```

Services will be available at:
- **API**: http://localhost:4000
- **AI Service**: http://localhost:8000
- **MongoDB**: localhost:27017

### 2. Seed Demo Data

```bash
make seed

# Or manually:
docker-compose exec api npm run seed
```

Demo credentials:
- `admin@hrms.demo / demo123` (Admin)
- `hr@hrms.demo / demo123` (HR)
- `manager@hrms.demo / demo123` (Manager)
- `john@hrms.demo / demo123` (Employee)

### 3. Start Frontend

```bash
# From project root
npm install
npm run dev
```

Frontend: http://localhost:3000

## API Endpoints

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Register

### Employees
- `GET /api/employees` - List all
- `GET /api/employees/:id` - Get one
- `POST /api/employees` - Create
- `PATCH /api/employees/:id` - Update

### Onboarding
- `GET /api/onboarding/employee/:employeeId` - Get tasks
- `POST /api/onboarding/bulk` - Bulk create tasks

### Performance
- `GET /api/performance` - List reviews
- `POST /api/performance` - Create review
- `PATCH /api/performance/:id` - Update review

### Projects & Allocations
- `GET /api/projects` - List projects
- `GET /api/allocations` - List allocations
- `POST /api/allocations` - Create allocation

### AI
- `POST /api/ai/generate-onboarding` - Generate onboarding tasks
- `GET /api/ai/skills-match?projectId=X` - Match employees to project
- `GET /api/ai/perf-insight?employeeId=X` - Performance insight
- `GET /api/ai/health` - AI service health & fallback stats

## AI Service (Stubs + Fallbacks)

The AI service currently returns **deterministic fallback responses**. All endpoints work with graceful degradation:

- **Onboarding Generation**: Rule-based templates from job title keywords
- **Skills Matching**: Token overlap + availability heuristic
- **Performance Insight**: Simple threshold rules

### Upgrading to Real AI

Replace stubs in `ai-service/main.py`:

1. **Onboarding**: Call OpenAI/Llama LLM with job description
2. **Skills Match**: Use sentence-transformers + ChromaDB for embedding search
3. **Performance**: Train ML model (sklearn/XGBoost) on historical review data

## Development

### Run Tests
```bash
# API tests (add when ready)
cd api && npm test

# Frontend tests
npm test
```

### View Logs
```bash
make logs

# Or specific service:
docker-compose logs -f api
docker-compose logs -f ai-service
```

### Stop Services
```bash
make stop

# Clean everything (removes volumes)
make clean
```

## Demo Walkthrough (3-5 minutes)

1. **Login** with `hr@hrms.demo / demo123`
2. **Dashboard**: View overview stats
3. **People**: Browse employee profiles and skills
4. **Onboarding**:
   - Select "Emily Brown" (Junior Frontend Developer)
   - Click "Generate from JD" to see AI-powered task generation
   - Toggle task completion
5. **Performance**:
   - View existing reviews
   - Check AI performance insight panel with attrition risk
6. **Allocations**:
   - Select "AI Recommendation Engine" project
   - Click "Suggest Candidates" to see skills matching
   - Review match scores and explanations

## Project Structure

```
api/src/
├── models/          # Mongoose schemas
├── routes/          # Express routes
├── middleware/      # Auth middleware
└── scripts/         # Seed script

ai-service/
├── main.py          # FastAPI app with stub endpoints
└── requirements.txt

src/
├── components/      # React components
├── pages/           # Page views
├── contexts/        # Auth context
└── services/        # API client
```

## Environment Variables

API (`.env` or Docker Compose):
```
MONGODB_URI=mongodb://admin:demo123@mongodb:27017/hrms?authSource=admin
JWT_SECRET=demo-jwt-secret-change-in-prod
AI_SERVICE_URL=http://ai-service:8000
```

## License

Demo project - MIT License
