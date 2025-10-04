import { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { projectsAPI, allocationsAPI, aiAPI } from '../services/api';

export default function Allocations() {
  const [projects, setProjects] = useState<any[]>([]);
  const [allocations, setAllocations] = useState<any[]>([]);
  const [selectedProject, setSelectedProject] = useState<any>(null);
  const [matchResults, setMatchResults] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [matching, setMatching] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [projectsData, allocationsData] = await Promise.all([
        projectsAPI.getAll(),
        allocationsAPI.getAll(),
      ]);
      setProjects(projectsData);
      setAllocations(allocationsData);
      if (projectsData.length > 0) {
        setSelectedProject(projectsData[0]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestCandidates = async () => {
    if (!selectedProject) return;

    setMatching(true);
    setMatchResults(null);

    try {
      const results = await aiAPI.skillsMatch(selectedProject._id, 5);
      setMatchResults(results);
    } catch (error) {
      console.error('Failed to match skills:', error);
    } finally {
      setMatching(false);
    }
  };

  const projectAllocations = allocations.filter(
    (a) => selectedProject && a.projectId._id === selectedProject._id
  );

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Resource Allocation</h1>
        <p className="text-slate-600 mt-2">Manage project assignments and team capacity</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Projects</h2>
          <div className="space-y-2">
            {projects.map((proj) => (
              <button
                key={proj._id}
                onClick={() => {
                  setSelectedProject(proj);
                  setMatchResults(null);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedProject?._id === proj._id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <p className="font-semibold text-slate-900">{proj.name}</p>
                <p className="text-sm text-slate-600 mt-1">{proj.requiredSkills.slice(0, 2).join(', ')}</p>
                <span className={`text-xs mt-2 inline-block px-2 py-1 rounded-full ${
                  proj.status === 'active' ? 'bg-emerald-100 text-emerald-700' :
                  proj.status === 'planning' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {proj.status}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedProject && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-slate-900">{selectedProject.name}</h2>
                    <p className="text-slate-600 mt-1">{selectedProject.description}</p>
                  </div>
                  <button
                    onClick={handleSuggestCandidates}
                    disabled={matching}
                    className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    {matching ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Matching...
                      </>
                    ) : (
                      <>
                        <Sparkles size={16} />
                        Suggest Candidates
                      </>
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {selectedProject.requiredSkills.map((skill: string) => (
                    <span key={skill} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-slate-600">Priority:</span>
                    <span className="ml-2 font-semibold text-slate-900 capitalize">{selectedProject.priority}</span>
                  </div>
                  <div>
                    <span className="text-slate-600">Status:</span>
                    <span className="ml-2 font-semibold text-slate-900 capitalize">{selectedProject.status}</span>
                  </div>
                </div>
              </div>

              {matchResults && (
                <div className={`rounded-xl shadow-sm p-6 border ${
                  matchResults.fallback ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                }`}>
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">
                    {matchResults.fallback ? 'Suggested Candidates (Fallback)' : 'AI-Matched Candidates'}
                  </h3>

                  {matchResults.topCandidates && matchResults.topCandidates.length > 0 ? (
                    <div className="space-y-3">
                      {matchResults.topCandidates.map((candidate: any, idx: number) => (
                        <div key={idx} className="p-4 bg-white border border-slate-200 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div>
                              <p className="font-semibold text-slate-900">{candidate.employeeName || candidate.employeeId}</p>
                              <p className="text-sm text-slate-600">Match Score: {(candidate.score * 100).toFixed(0)}%</p>
                            </div>
                            <div className="text-right">
                              <div className="text-2xl font-bold text-blue-600">{(candidate.score * 100).toFixed(0)}</div>
                              <button className="text-sm text-blue-600 hover:text-blue-700 font-medium mt-1">
                                Assign
                              </button>
                            </div>
                          </div>
                          {candidate.matchingSkills && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {candidate.matchingSkills.map((skill: string) => (
                                <span key={skill} className="px-2 py-1 bg-emerald-100 text-emerald-700 text-xs rounded-full">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                          <p className="text-xs text-slate-600 mt-2">{candidate.explain}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-600">No matching candidates found.</p>
                  )}

                  {matchResults.fallback && (
                    <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                      <p className="text-xs text-amber-800">⚠️ Using token-based fallback. {matchResults.todo}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Current Allocations</h3>
                {projectAllocations.length > 0 ? (
                  <div className="space-y-3">
                    {projectAllocations.map((alloc) => (
                      <div key={alloc._id} className="p-4 bg-slate-50 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-slate-900">{alloc.employeeId.employeeId}</p>
                            <p className="text-sm text-slate-600">{alloc.role}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-blue-600">{alloc.allocationPercent}%</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              alloc.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {alloc.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600">No allocations yet.</p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
