# HRMS Demo - Quick Start Guide

## 🚀 5-Minute Setup

### 1. Start Backend Services (MongoDB, API, AI)

```bash
make start
# Or: docker-compose up -d
```

Wait ~30 seconds for services to initialize.

### 2. Seed Demo Data

```bash
make seed
# Or: docker-compose exec api npm run seed
```

### 3. Start Frontend

```bash
npm install
npm run dev
```

Visit: **http://localhost:3000**

## 🔑 Demo Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@hrms.demo | demo123 | Admin |
| hr@hrms.demo | demo123 | HR |
| manager@hrms.demo | demo123 | Manager |
| john@hrms.demo | demo123 | Employee |

## 🎯 Demo Walkthrough

### 1. Dashboard
- View system statistics
- Check service health status

### 2. People
- Browse 6 demo employees
- View skills and allocation percentages

### 3. Onboarding (⭐ AI Feature)
- Select "Emily Brown" (Junior Frontend Developer)
- Click **"Generate from JD"** button
- See AI-generated onboarding tasks (fallback mode)
- Toggle task completion

### 4. Performance (⭐ AI Feature)
- View existing performance reviews
- Check **AI Performance Insight** panel
- See attrition risk calculation with explanation
- View contributing factors

### 5. Allocations (⭐ AI Feature)
- Select "AI Recommendation Engine" project
- Click **"Suggest Candidates"** button
- View top 5 matched employees with scores
- See matching skills and explanations

## 🛠 Useful Commands

```bash
# View logs
make logs

# Stop services
make stop

# Clean everything (including data)
make clean

# Restart everything
make stop && make start && make seed
```

## 🔗 Service URLs

- **Frontend**: http://localhost:3000
- **API**: http://localhost:4000
- **AI Service**: http://localhost:8000
- **MongoDB**: localhost:27017

## 📊 API Examples

```bash
# Health check
curl http://localhost:4000/health

# AI health & fallback stats
curl http://localhost:4000/api/ai/health

# Login
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@hrms.demo","password":"demo123"}'

# Get employees (with token)
curl http://localhost:4000/api/employees \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## ⚠️ AI Service Note

The AI service currently runs in **fallback mode** with deterministic heuristics:

- ✅ All features work and demonstrate the flow
- ⚠️ Responses are rule-based, not ML-powered
- 🔄 Replace stubs in `ai-service/main.py` for real AI

## 🐛 Troubleshooting

**Services won't start:**
```bash
docker-compose down -v
docker-compose up -d
```

**Seed fails:**
```bash
docker-compose restart api
docker-compose exec api npm run seed
```

**Frontend errors:**
```bash
rm -rf node_modules
npm install
npm run dev
```

## 📦 What's Included

- ✅ 6 demo employees with realistic profiles
- ✅ 3 projects (active and planned)
- ✅ 4 resource allocations
- ✅ 3 performance reviews
- ✅ 5 onboarding tasks for new hire
- ✅ Full authentication system
- ✅ AI endpoints with fallback logic
- ✅ Audit logging for AI calls

## 🎓 Next Steps

1. Explore all 5 modules (Dashboard, People, Onboarding, Performance, Allocations)
2. Try the 3 AI features (onboarding generation, skills match, performance insight)
3. Check AI health endpoint to see fallback statistics
4. Review code in `api/src/routes/ai.ts` for integration patterns
5. Check `ai-service/main.py` for stub endpoints

## 📚 Full Documentation

See `README.md` for:
- Complete API reference
- Architecture details
- Development guide
- How to upgrade to real AI models
