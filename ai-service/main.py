from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
from datetime import datetime

app = FastAPI(title="HRMS AI Service", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Models
class OnboardingRequest(BaseModel):
    requestId: str
    jobTitle: str
    jobDescription: str
    companyContext: Optional[str] = "HRMS Demo Company"
    constraints: Optional[Dict[str, Any]] = {"maxTasks": 12, "lang": "en", "format": "short"}


class OnboardingTask(BaseModel):
    phase: str
    title: str
    description: str
    duration: str
    order: int


class OnboardingResponse(BaseModel):
    requestId: str
    fallback: bool
    generatedChecklist: List[OnboardingTask]
    rationale: str
    sources: Optional[List[Dict[str, str]]] = []
    todo: Optional[str] = None


# Health check
@app.get("/health")
async def health():
    return {
        "status": "ok",
        "service": "hrms-ai",
        "timestamp": datetime.utcnow().isoformat()
    }


# Generate onboarding tasks
@app.post("/ai/generate-onboarding", response_model=OnboardingResponse)
async def generate_onboarding(request: OnboardingRequest):
    """
    Generate onboarding checklist from job description.
    Currently returns deterministic stub - replace with LLM call.
    """

    # Extract keywords from job title
    job_lower = request.jobTitle.lower()
    is_engineer = any(word in job_lower for word in ["engineer", "developer", "programmer"])
    is_senior = "senior" in job_lower or "lead" in job_lower
    is_manager = "manager" in job_lower

    # Build task list based on role
    tasks = []
    order = 0

    # Day 1 tasks (always)
    tasks.append(OnboardingTask(
        phase="day1",
        title="Account setup and access",
        description="Create email, Slack, and repository access. Set up 2FA and security keys.",
        duration="1h",
        order=order
    ))
    order += 1

    tasks.append(OnboardingTask(
        phase="day1",
        title="Team introductions",
        description="Meet your immediate team members and understand team structure.",
        duration="2h",
        order=order
    ))
    order += 1

    # Week 1 tasks
    if is_engineer:
        tasks.append(OnboardingTask(
            phase="week1",
            title="Development environment setup",
            description="Install IDE, dependencies, and run local development server. Clone repos and run tests.",
            duration="4h",
            order=order
        ))
        order += 1

        tasks.append(OnboardingTask(
            phase="week1",
            title="Codebase walkthrough",
            description="Review architecture, coding standards, PR process, and CI/CD pipeline.",
            duration="3h",
            order=order
        ))
        order += 1

    if is_manager:
        tasks.append(OnboardingTask(
            phase="week1",
            title="1:1s with direct reports",
            description="Schedule and conduct introductory meetings with each team member.",
            duration="1w",
            order=order
        ))
        order += 1

    # Month 1 tasks
    if is_engineer:
        complexity = "medium" if is_senior else "small"
        tasks.append(OnboardingTask(
            phase="month1",
            title=f"Complete first {complexity} feature",
            description=f"Pick up a {complexity}-sized ticket, implement, test, and deploy with mentor guidance.",
            duration="2w" if is_senior else "1w",
            order=order
        ))
        order += 1

    tasks.append(OnboardingTask(
        phase="month1",
        title="Company-wide knowledge sessions",
        description="Attend sessions on company values, product roadmap, and cross-team collaboration.",
        duration="6h",
        order=order
    ))
    order += 1

    # Month 3 tasks
    if is_senior:
        tasks.append(OnboardingTask(
            phase="month3",
            title="Technical design document",
            description="Write and present a technical design for a new feature or improvement.",
            duration="1w",
            order=order
        ))
        order += 1

    tasks.append(OnboardingTask(
        phase="month3",
        title="90-day review and goal setting",
        description="Reflect on onboarding experience and set goals for next quarter with manager.",
        duration="2h",
        order=order
    ))

    # Limit to maxTasks
    max_tasks = request.constraints.get("maxTasks", 12)
    tasks = tasks[:max_tasks]

    return OnboardingResponse(
        requestId=request.requestId,
        fallback=True,  # Mark as fallback since we're using heuristics
        generatedChecklist=tasks,
        rationale=f"Heuristic-based generation: Detected role={request.jobTitle}, engineer={is_engineer}, senior={is_senior}, manager={is_manager}. Generated {len(tasks)} phase-based tasks.",
        sources=[{"type": "job_description", "snippet": request.jobDescription[:200]}],
        todo="Replace this stub with real LLM call (e.g., OpenAI GPT-4 or local Llama model) for context-aware task generation"
    )


# Skills matching
@app.get("/ai/skills-match")
async def skills_match(projectId: str, requiredSkills: str, topK: int = 5):
    """
    Match employees to project based on skills.
    Currently returns deterministic stub - replace with embedding similarity.
    """

    return {
        "projectId": projectId,
        "topCandidates": [],
        "fallback": True,
        "todo": "Implement embedding-based skills matching using sentence-transformers and ChromaDB",
        "message": "AI service stub - Node API will handle fallback with token overlap"
    }


# Performance insight
@app.get("/ai/perf-insight")
async def perf_insight(employeeId: str):
    """
    Calculate attrition risk and performance insights.
    Currently returns deterministic stub - replace with ML model.
    """

    return {
        "employeeId": employeeId,
        "attritionRisk": 0.15,
        "topFactors": [
            {"feature": "avgReviewScore", "impact": -0.08},
            {"feature": "recentAllocations", "impact": 0.05}
        ],
        "explain": "Stub response - implement ML model for real predictions",
        "fallback": True,
        "todo": "Train and deploy attrition prediction model (e.g., sklearn RandomForest or XGBoost)"
    }


# Query chatbot (policy & docs)
class QueryRequest(BaseModel):
    query: str
    userId: str
    contextDocs: Optional[List[str]] = []
    authRole: str


@app.post("/ai/query")
async def query_docs(request: QueryRequest):
    """
    Answer questions about company policies and documents.
    Currently returns stub - implement RAG with ChromaDB + LLM.
    """

    # Simple keyword matching for demo
    query_lower = request.query.lower()

    if "leave" in query_lower or "paid" in query_lower:
        return {
            "answer": "According to our demo policy, engineers receive 18 paid leave days per year.",
            "sources": [
                {
                    "doc": "policy_handbook_demo.pdf",
                    "page": 3,
                    "snippet": "Paid leaves: All full-time employees receive 18 days of paid leave annually..."
                }
            ],
            "confidence": 0.75,
            "fallback": True,
            "todo": "Implement RAG: embed policy docs in ChromaDB, retrieve relevant chunks, generate answer with LLM"
        }

    return {
        "answer": "I don't have enough information to answer that question in demo mode.",
        "sources": [],
        "confidence": 0.0,
        "fallback": True,
        "todo": "Implement RAG pipeline for document Q&A"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
