from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import re
from datetime import datetime
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
import numpy as np
from io import BytesIO
import base64
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

app = FastAPI(title="HRMS AI Service", version="1.0.0")

embedding_model = None

@app.on_event("startup")
async def load_model():
    global embedding_model
    print("Loading sentence-transformers model...")
    embedding_model = SentenceTransformer('all-MiniLM-L6-v2')
    print("Model loaded successfully!")

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

class Employee(BaseModel):
    _id: str
    employeeId: str
    userId: Optional[Dict[str, str]]
    skills: List[str]
    currentAllocationPercent: int

class SkillsMatchRequest(BaseModel):
    projectId: str
    requiredSkills: List[str]
    employees: List[Employee]
    topK: int = 5


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
@app.post("/ai/skills-match")
async def skills_match(request: SkillsMatchRequest):
    """
    Match employees to project based on skills using sentence embeddings.
    """
    if not embedding_model:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    project_skills_text = ", ".join(request.requiredSkills)
    project_embedding = embedding_model.encode([project_skills_text])

    employee_skills_texts = [", ".join(emp.skills) for emp in request.employees]
    if not employee_skills_texts:
        return {
            "projectId": request.projectId,
            "topCandidates": [],
            "fallback": False,
        }
    
    employee_embeddings = embedding_model.encode(employee_skills_texts)

    similarities = cosine_similarity(project_embedding, employee_embeddings)[0]

    candidates = []
    for i, emp in enumerate(request.employees):
        skill_score = similarities[i]
        availability_score = (100 - emp.currentAllocationPercent) / 100
        
        # Weighted score
        score = 0.7 * skill_score + 0.3 * availability_score
        
        matching_skills = [s for s in emp.skills if s.lower() in [rs.lower() for rs in request.requiredSkills]]

        candidates.append({
            "employeeId": emp.employeeId,
            "employeeName": f"{emp.userId['firstName']} {emp.userId['lastName']}",
            "score": float(score),
            "matchingSkills": matching_skills,
            "explain": f"Skill match: {skill_score:.2f}, Availability: {availability_score:.2f}. Current allocation: {emp.currentAllocationPercent}%"
        })

    candidates.sort(key=lambda x: x['score'], reverse=True)

    return {
        "projectId": request.projectId,
        "topCandidates": candidates[:request.topK],
        "fallback": False,
        "todo": None
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


class RadarChartRequest(BaseModel):
    technical: float
    communication: float
    teamwork: float
    initiative: float
    leadership: float
    punctuality: float


@app.post("/ai/generate-performance-radar")
async def generate_performance_radar(request: RadarChartRequest):
    """
    Generate a hexagonal radar chart for employee performance competencies.
    Returns a base64-encoded PNG image.
    """
    try:
        categories = ['Technical', 'Communication', 'Teamwork', 'Initiative', 'Leadership', 'Punctuality']
        values = [
            request.technical,
            request.communication,
            request.teamwork,
            request.initiative,
            request.leadership,
            request.punctuality
        ]

        values += values[:1]

        angles = np.linspace(0, 2 * np.pi, len(categories), endpoint=False).tolist()
        angles += angles[:1]

        fig, ax = plt.subplots(figsize=(8, 8), subplot_kw=dict(projection='polar'))

        ax.plot(angles, values, 'o-', linewidth=2, color='#3b82f6', label='Score')
        ax.fill(angles, values, alpha=0.25, color='#3b82f6')

        ax.set_ylim(0, 5)
        ax.set_yticks([1, 2, 3, 4, 5])
        ax.set_yticklabels(['1', '2', '3', '4', '5'], fontsize=10, color='#64748b')

        ax.set_xticks(angles[:-1])
        ax.set_xticklabels(categories, fontsize=12, fontweight='bold', color='#1e293b')

        ax.grid(True, linestyle='--', alpha=0.7, color='#cbd5e1')
        ax.spines['polar'].set_color('#cbd5e1')

        ax.set_facecolor('#f8fafc')
        fig.patch.set_facecolor('white')

        plt.title('Performance Competencies', size=16, fontweight='bold', pad=20, color='#0f172a')

        buf = BytesIO()
        plt.savefig(buf, format='png', dpi=150, bbox_inches='tight', facecolor='white')
        buf.seek(0)

        image_base64 = base64.b64encode(buf.read()).decode('utf-8')

        plt.close(fig)

        return {
            "image": f"data:image/png;base64,{image_base64}",
            "format": "png"
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error generating radar chart: {str(e)}")


class IdealProfileRequest(BaseModel):
    job_description: str


class IdealProfileResponse(BaseModel):
    keySkills: List[str]
    experience: str
    education: str
    summary: str


@app.post("/ai/generate-ideal-profile", response_model=IdealProfileResponse)
async def generate_ideal_profile(request: IdealProfileRequest):
    """
    Analyze job description and extract ideal candidate profile.
    """
    job_desc = request.job_description.lower()

    skill_keywords = {
        'react': ['react', 'reactjs', 'react.js'],
        'nodejs': ['node', 'nodejs', 'node.js', 'express'],
        'typescript': ['typescript', 'ts'],
        'python': ['python', 'django', 'flask', 'fastapi'],
        'mongodb': ['mongodb', 'mongo'],
        'postgresql': ['postgresql', 'postgres', 'sql'],
        'docker': ['docker', 'container'],
        'kubernetes': ['kubernetes', 'k8s'],
        'aws': ['aws', 'amazon web services', 'cloud'],
        'microservices': ['microservices', 'microservice'],
        'machine-learning': ['machine learning', 'ml', 'ai', 'artificial intelligence'],
        'tensorflow': ['tensorflow', 'tf'],
        'pytorch': ['pytorch'],
        'redux': ['redux', 'state management'],
        'css': ['css', 'styling', 'sass', 'scss'],
        'graphql': ['graphql', 'gql'],
        'ci-cd': ['ci/cd', 'ci cd', 'continuous integration', 'jenkins', 'github actions'],
        'terraform': ['terraform', 'infrastructure as code'],
        'agile': ['agile', 'scrum'],
        'rest-api': ['rest', 'api', 'restful']
    }

    detected_skills = []
    for skill, keywords in skill_keywords.items():
        if any(keyword in job_desc for keyword in keywords):
            detected_skills.append(skill)

    exp_years = 5
    if 'senior' in job_desc or 'lead' in job_desc:
        exp_years = 7
        experience = "7+ years"
    elif 'junior' in job_desc or 'entry' in job_desc:
        exp_years = 2
        experience = "2-3 years"
    elif 'mid-level' in job_desc or 'intermediate' in job_desc:
        exp_years = 4
        experience = "4-6 years"
    else:
        experience = "5+ years"

    education = "Bachelor's degree in Computer Science or related field"
    if 'master' in job_desc or 'phd' in job_desc:
        education = "Master's degree in Computer Science or related field"

    summary = f"Ideal candidate should have {experience} of professional experience with strong expertise in {', '.join(detected_skills[:5]) if detected_skills else 'relevant technologies'}. {education} preferred."

    return IdealProfileResponse(
        keySkills=detected_skills[:10] if detected_skills else ['programming', 'problem-solving'],
        experience=experience,
        education=education,
        summary=summary
    )


class ResumeItem(BaseModel):
    id: str
    name: str
    email: str
    resumeText: str


class RankResumesRequest(BaseModel):
    ideal_profile: IdealProfileResponse
    resumes: List[ResumeItem]


class RankedCandidate(BaseModel):
    id: str
    name: str
    email: str
    matchScore: float
    explanation: str


@app.post("/ai/rank-resumes")
async def rank_resumes(request: RankResumesRequest):
    """
    Rank resumes based on similarity to ideal candidate profile using embeddings.
    """
    if not embedding_model:
        raise HTTPException(status_code=503, detail="Model not loaded yet")

    if not request.resumes:
        return {"topCandidates": [], "totalProcessed": 0}

    ideal_text = f"{request.ideal_profile.summary} Key skills: {', '.join(request.ideal_profile.keySkills)}. Experience: {request.ideal_profile.experience}. Education: {request.ideal_profile.education}"

    ideal_embedding = embedding_model.encode([ideal_text])

    resume_texts = [r.resumeText for r in request.resumes]
    resume_embeddings = embedding_model.encode(resume_texts)

    similarities = cosine_similarity(ideal_embedding, resume_embeddings)[0]

    ranked_candidates = []
    for idx, (resume, similarity) in enumerate(zip(request.resumes, similarities)):
        match_score = float(similarity * 100)

        matched_skills = []
        resume_lower = resume.resumeText.lower()
        for skill in request.ideal_profile.keySkills:
            if skill.replace('-', ' ') in resume_lower or skill.replace('-', '') in resume_lower:
                matched_skills.append(skill)

        if match_score >= 70:
            explanation = f"Excellent match! Strong alignment on skills: {', '.join(matched_skills[:5]) if matched_skills else 'relevant experience'}. High compatibility with job requirements."
        elif match_score >= 50:
            explanation = f"Good match on {len(matched_skills)} skills: {', '.join(matched_skills[:4]) if matched_skills else 'core competencies'}. Solid candidate for consideration."
        else:
            explanation = f"Moderate match. Has {len(matched_skills)} relevant skills: {', '.join(matched_skills[:3]) if matched_skills else 'some experience'}."

        ranked_candidates.append(RankedCandidate(
            id=resume.id,
            name=resume.name,
            email=resume.email,
            matchScore=round(match_score, 1),
            explanation=explanation
        ))

    ranked_candidates.sort(key=lambda x: x.matchScore, reverse=True)

    top_candidates = ranked_candidates[:10]

    return {
        "topCandidates": [c.dict() for c in top_candidates],
        "totalProcessed": len(request.resumes)
    }


class GenerateQuestionsRequest(BaseModel):
    job_title: str
    required_skills: List[str]


@app.post("/ai/generate-questions")
async def generate_questions(request: GenerateQuestionsRequest):
    """
    Generate interview questions based on job title and required skills.
    """
    behavioral_questions = [
        "Tell me about a time when you faced a significant challenge in a project. How did you overcome it?",
        "Describe a situation where you had to work with a difficult team member. How did you handle it?",
        "Can you share an example of when you had to meet a tight deadline? What was your approach?",
        "Tell me about a time when you had to learn a new technology quickly. How did you approach it?",
        "Describe a project where you took initiative beyond your assigned responsibilities."
    ]

    technical_question_bank = {
        'react': [
            "Explain the difference between class components and functional components in React.",
            "What are React hooks and why were they introduced? Give examples of commonly used hooks.",
            "How does React's virtual DOM work and why is it beneficial?",
            "Explain the concept of lifting state up in React and when you would use it."
        ],
        'nodejs': [
            "Explain the event loop in Node.js and how it handles asynchronous operations.",
            "What is the difference between process.nextTick() and setImmediate()?",
            "How would you handle errors in Express.js middleware?",
            "Explain the concept of streams in Node.js and when you would use them."
        ],
        'typescript': [
            "What are the benefits of using TypeScript over JavaScript?",
            "Explain generics in TypeScript and provide a use case.",
            "What is the difference between 'interface' and 'type' in TypeScript?",
            "How does TypeScript handle null and undefined values?"
        ],
        'python': [
            "Explain the difference between lists and tuples in Python.",
            "What are decorators in Python and how would you use them?",
            "Explain the Global Interpreter Lock (GIL) and its implications.",
            "What is the difference between @staticmethod and @classmethod?"
        ],
        'docker': [
            "Explain the difference between a Docker image and a Docker container.",
            "What is a Dockerfile and what are some best practices for writing one?",
            "How would you optimize Docker image size?",
            "Explain Docker networking and how containers communicate with each other."
        ],
        'kubernetes': [
            "Explain the architecture of Kubernetes and its main components.",
            "What is a Pod in Kubernetes and how is it different from a container?",
            "Explain Kubernetes Services and the different types available.",
            "How does Kubernetes handle application scaling?"
        ],
        'aws': [
            "Explain the difference between EC2 and Lambda.",
            "What is an S3 bucket and what are its use cases?",
            "How would you design a highly available architecture on AWS?",
            "Explain VPC and its components in AWS."
        ],
        'mongodb': [
            "Explain the difference between SQL and NoSQL databases.",
            "What are indexes in MongoDB and why are they important?",
            "Explain aggregation pipelines in MongoDB.",
            "How would you handle data modeling in MongoDB?"
        ],
        'machine-learning': [
            "Explain the difference between supervised and unsupervised learning.",
            "What is overfitting and how can you prevent it?",
            "Explain the bias-variance tradeoff.",
            "What evaluation metrics would you use for a classification problem?"
        ],
        'microservices': [
            "What are the key benefits and challenges of microservices architecture?",
            "How do microservices communicate with each other?",
            "Explain the concept of service discovery in microservices.",
            "How would you handle distributed transactions in a microservices architecture?"
        ]
    }

    technical_questions = {}
    for skill in request.required_skills:
        skill_normalized = skill.lower().replace(' ', '-')
        if skill_normalized in technical_question_bank:
            technical_questions[skill] = technical_question_bank[skill_normalized]

    if not technical_questions:
        technical_questions['general'] = [
            "Walk me through your approach to solving a complex technical problem.",
            "How do you stay updated with new technologies and industry trends?",
            "Describe your experience with version control systems like Git.",
            "How do you approach code reviews and ensure code quality?"
        ]

    return {
        "behavioral_questions": behavioral_questions,
        "technical_questions": technical_questions,
        "job_title": request.job_title
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)