import { useState, useEffect } from 'react';
import { Briefcase, Sparkles, Search, User, Mail, Phone, GraduationCap, Award, X, FileText, MessageSquare } from 'lucide-react';

const API_URL = 'http://localhost:4000/api';

interface JobOpening {
  _id: string;
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  status: string;
  postedDate: string;
}

interface IdealProfile {
  keySkills: string[];
  experience: string;
  education: string;
  summary: string;
}

interface Candidate {
  id: string;
  name: string;
  email: string;
  phone: string;
  matchScore: number;
  explanation: string;
  skills: string[];
  experienceYears: number;
  education: string;
  resumeText: string;
  stage: 'sourced' | 'interview' | 'hired';
}

interface InterviewQuestions {
  behavioral_questions: string[];
  technical_questions: Record<string, string[]>;
  job_title: string;
}

export default function Recruitment() {
  const [jobs, setJobs] = useState<JobOpening[]>([]);
  const [selectedJob, setSelectedJob] = useState<JobOpening | null>(null);
  const [idealProfile, setIdealProfile] = useState<IdealProfile | null>(null);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<InterviewQuestions | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingState, setLoadingState] = useState('');
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recruitment/jobs`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setJobs(data);
      if (data.length > 0 && !selectedJob) {
        setSelectedJob(data[0]);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const generateIdealProfile = async () => {
    if (!selectedJob) return;

    setLoading(true);
    setLoadingState('Analyzing job requirements...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recruitment/generate-profile`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobDescription: selectedJob.description })
      });
      const data = await response.json();
      setIdealProfile(data);
    } catch (error) {
      console.error('Error generating profile:', error);
    } finally {
      setLoading(false);
      setLoadingState('');
    }
  };

  const findCandidates = async () => {
    if (!selectedJob || !idealProfile) return;

    setLoading(true);
    setLoadingState('Scanning talent pool and ranking candidates...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recruitment/find-matches`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobId: selectedJob._id,
          idealProfile
        })
      });
      const data = await response.json();
      setCandidates(data.topCandidates.map((c: any) => ({ ...c, stage: 'sourced' })));
    } catch (error) {
      console.error('Error finding candidates:', error);
    } finally {
      setLoading(false);
      setLoadingState('');
    }
  };

  const generateQuestions = async (candidate: Candidate) => {
    if (!selectedJob) return;

    setLoading(true);
    setLoadingState('Generating personalized interview questions...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recruitment/generate-questions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          jobTitle: selectedJob.title,
          requiredSkills: selectedJob.requiredSkills
        })
      });
      const data = await response.json();
      setInterviewQuestions(data);
    } catch (error) {
      console.error('Error generating questions:', error);
    } finally {
      setLoading(false);
      setLoadingState('');
    }
  };

  const openCandidateModal = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setInterviewQuestions(null);
    setShowModal(true);
  };

  const moveCandidateStage = (candidateId: string, newStage: 'sourced' | 'interview' | 'hired') => {
    setCandidates(candidates.map(c =>
      c.id === candidateId ? { ...c, stage: newStage } : c
    ));
  };

  const hireCandidate = async (candidate: Candidate) => {
    setLoading(true);
    setLoadingState('Processing hire and creating employee profile...');
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/recruitment/hire`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          mockResumeId: candidate.id,
          jobId: selectedJob?._id
        })
      });
      const data = await response.json();

      if (data.success) {
        moveCandidateStage(candidate.id, 'hired');
        setShowModal(false);

        setTimeout(() => {
          window.location.hash = '#onboarding';
          window.location.reload();
        }, 1500);
      }
    } catch (error) {
      console.error('Error hiring candidate:', error);
    } finally {
      setLoading(false);
      setLoadingState('');
    }
  };

  const getMatchColor = (score: number) => {
    if (score >= 70) return 'text-green-600 bg-green-50 border-green-200';
    if (score >= 50) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-slate-600 bg-slate-50 border-slate-200';
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">AI Recruitment Center</h1>
        <p className="text-slate-600">Leverage AI to find, evaluate, and hire top talent</p>
      </div>

      {loading && (
        <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
          <span className="text-blue-700 font-medium">{loadingState}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <h2 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-blue-600" />
            Open Positions
          </h2>
          <div className="space-y-3">
            {jobs.map(job => (
              <div
                key={job._id}
                onClick={() => {
                  setSelectedJob(job);
                  setIdealProfile(null);
                  setCandidates([]);
                }}
                className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                  selectedJob?._id === job._id
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <h3 className="font-semibold text-slate-900 mb-1">{job.title}</h3>
                <p className="text-sm text-slate-600 mb-2">{job.department}</p>
                <div className="flex flex-wrap gap-1">
                  {job.requiredSkills.slice(0, 3).map(skill => (
                    <span key={skill} className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                      {skill}
                    </span>
                  ))}
                  {job.requiredSkills.length > 3 && (
                    <span className="text-xs px-2 py-1 bg-slate-100 text-slate-700 rounded">
                      +{job.requiredSkills.length - 3}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2">
          {selectedJob ? (
            <div className="space-y-6">
              <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                <h2 className="text-xl font-bold text-slate-900 mb-2">{selectedJob.title}</h2>
                <p className="text-slate-600 mb-4">{selectedJob.description}</p>
                <div className="flex flex-wrap gap-2 mb-6">
                  {selectedJob.requiredSkills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="border-t border-slate-200 pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-yellow-500" />
                      Ideal Candidate Profile
                    </h3>
                    <button
                      onClick={generateIdealProfile}
                      disabled={loading}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white rounded-lg font-medium hover:from-yellow-500 hover:to-orange-600 transition-all disabled:opacity-50 flex items-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      Generate with AI
                    </button>
                  </div>

                  {idealProfile && (
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-lg p-5 border border-yellow-200">
                      <p className="text-slate-700 mb-4">{idealProfile.summary}</p>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Experience:</span>
                          <p className="text-slate-900">{idealProfile.experience}</p>
                        </div>
                        <div>
                          <span className="text-sm font-semibold text-slate-700">Education:</span>
                          <p className="text-slate-900">{idealProfile.education}</p>
                        </div>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-slate-700 block mb-2">Key Skills:</span>
                        <div className="flex flex-wrap gap-2">
                          {idealProfile.keySkills.map(skill => (
                            <span key={skill} className="px-3 py-1 bg-white border border-yellow-300 text-slate-800 rounded-full text-sm">
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {idealProfile && (
                  <div className="border-t border-slate-200 pt-6 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                        <Search className="w-5 h-5 text-blue-600" />
                        Top Candidates
                      </h3>
                      <button
                        onClick={findCandidates}
                        disabled={loading}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        <Search className="w-4 h-4" />
                        Find Top 10 Candidates
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {candidates.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Candidate Pipeline</h3>

                  <div className="grid grid-cols-3 gap-4">
                    {['sourced', 'interview', 'hired'].map(stage => (
                      <div key={stage} className="bg-slate-50 rounded-lg p-4">
                        <h4 className="font-semibold text-slate-700 mb-3 capitalize flex items-center gap-2">
                          {stage === 'sourced' && <User className="w-4 h-4" />}
                          {stage === 'interview' && <MessageSquare className="w-4 h-4" />}
                          {stage === 'hired' && <Award className="w-4 h-4" />}
                          {stage === 'sourced' ? 'Sourced' : stage === 'interview' ? 'Interview Prep' : 'Hired'}
                        </h4>
                        <div className="space-y-2">
                          {candidates.filter(c => c.stage === stage).map(candidate => (
                            <div
                              key={candidate.id}
                              onClick={() => openCandidateModal(candidate)}
                              className="bg-white rounded-lg p-3 border border-slate-200 cursor-pointer hover:shadow-md transition-all"
                            >
                              <div className="flex items-center justify-between mb-2">
                                <h5 className="font-semibold text-slate-900">{candidate.name}</h5>
                                <span className={`text-xs px-2 py-1 rounded-full border font-semibold ${getMatchColor(candidate.matchScore)}`}>
                                  {candidate.matchScore}%
                                </span>
                              </div>
                              <p className="text-xs text-slate-600 mb-2">{candidate.explanation}</p>
                              <div className="flex gap-1 flex-wrap">
                                {candidate.skills.slice(0, 3).map(skill => (
                                  <span key={skill} className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-12 text-center">
              <Briefcase className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-900 mb-2">Select a Job Opening</h3>
              <p className="text-slate-600">Choose a position to start the AI-powered recruitment process</p>
            </div>
          )}
        </div>
      </div>

      {showModal && selectedCandidate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-slate-200 p-6 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{selectedCandidate.name}</h2>
                <div className="flex items-center gap-4 mt-2 text-sm text-slate-600">
                  <span className="flex items-center gap-1"><Mail className="w-4 h-4" />{selectedCandidate.email}</span>
                  <span className="flex items-center gap-1"><Phone className="w-4 h-4" />{selectedCandidate.phone}</span>
                </div>
              </div>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg border border-blue-200">
                <div>
                  <span className="text-sm font-semibold text-slate-700">Match Score</span>
                  <p className="text-3xl font-bold text-blue-600">{selectedCandidate.matchScore}%</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-semibold text-slate-700">Experience</span>
                  <p className="text-xl font-bold text-slate-900">{selectedCandidate.experienceYears} years</p>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <Award className="w-5 h-5 text-blue-600" />
                  Skills & Qualifications
                </h3>
                <div className="flex flex-wrap gap-2 mb-3">
                  {selectedCandidate.skills.map(skill => (
                    <span key={skill} className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                      {skill}
                    </span>
                  ))}
                </div>
                <div className="flex items-center gap-2 text-slate-700">
                  <GraduationCap className="w-5 h-5" />
                  <span>{selectedCandidate.education}</span>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-slate-600" />
                  Full Resume
                </h3>
                <div className="bg-slate-50 rounded-lg p-4 border border-slate-200 whitespace-pre-wrap text-sm text-slate-700 max-h-60 overflow-y-auto">
                  {selectedCandidate.resumeText}
                </div>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                    Interview Questions
                  </h3>
                  <button
                    onClick={() => generateQuestions(selectedCandidate)}
                    disabled={loading || !!interviewQuestions}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Generate Questions
                  </button>
                </div>

                {interviewQuestions && (
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Behavioral Questions</h4>
                      <ul className="space-y-2">
                        {interviewQuestions.behavioral_questions.map((q, idx) => (
                          <li key={idx} className="flex gap-2 text-sm text-slate-700">
                            <span className="font-semibold text-slate-500">{idx + 1}.</span>
                            <span>{q}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900 mb-2">Technical Questions</h4>
                      {Object.entries(interviewQuestions.technical_questions).map(([skill, questions]) => (
                        <div key={skill} className="mb-3">
                          <h5 className="text-sm font-semibold text-blue-600 mb-1 capitalize">{skill}</h5>
                          <ul className="space-y-1">
                            {questions.map((q, idx) => (
                              <li key={idx} className="flex gap-2 text-sm text-slate-700">
                                <span className="font-semibold text-slate-500">•</span>
                                <span>{q}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6 flex gap-3">
                {selectedCandidate.stage === 'sourced' && (
                  <button
                    onClick={() => {
                      moveCandidateStage(selectedCandidate.id, 'interview');
                      setShowModal(false);
                    }}
                    className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-all"
                  >
                    Move to Interview Prep
                  </button>
                )}
                {selectedCandidate.stage === 'interview' && (
                  <button
                    onClick={() => hireCandidate(selectedCandidate)}
                    disabled={loading}
                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Award className="w-5 h-5" />
                    Hire Candidate
                  </button>
                )}
                {selectedCandidate.stage === 'hired' && (
                  <div className="flex-1 px-6 py-3 bg-green-100 text-green-700 rounded-lg font-semibold text-center border-2 border-green-300">
                    Successfully Hired!
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
