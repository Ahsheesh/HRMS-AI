import { useState, useEffect } from 'react';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { performanceAPI, employeesAPI, aiAPI } from '../services/api';

export default function Performance() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedReview, setSelectedReview] = useState<any>(null);
  const [insight, setInsight] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [reviewsData, employeesData] = await Promise.all([
        performanceAPI.getAll(),
        employeesAPI.getAll(),
      ]);
      setReviews(reviewsData);
      setEmployees(employeesData);
      if (reviewsData.length > 0) {
        setSelectedReview(reviewsData[0]);
        loadInsight(reviewsData[0].employeeId._id);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadInsight = async (employeeId: string) => {
    try {
      const data = await aiAPI.perfInsight(employeeId);
      setInsight(data);
    } catch (error) {
      console.error('Failed to load insight:', error);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64">Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900">Performance Reviews</h1>
        <p className="text-slate-600 mt-2">Track and manage employee performance</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
          <h2 className="text-lg font-semibold text-slate-900 mb-4">Reviews</h2>
          <div className="space-y-2">
            {reviews.map((review) => (
              <button
                key={review._id}
                onClick={() => {
                  setSelectedReview(review);
                  loadInsight(review.employeeId._id);
                }}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors ${
                  selectedReview?._id === review._id
                    ? 'bg-blue-50 border-2 border-blue-500'
                    : 'bg-slate-50 border-2 border-transparent hover:bg-slate-100'
                }`}
              >
                <p className="font-semibold text-slate-900">{review.employeeId.employeeId}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-sm text-slate-600">Score: {review.averageScore.toFixed(1)}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    review.status === 'finalized' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {review.status}
                  </span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          {selectedReview && (
            <>
              <div className="bg-white rounded-xl shadow-sm p-6 border border-slate-200">
                <h2 className="text-xl font-semibold text-slate-900 mb-4">
                  Review for {selectedReview.employeeId.employeeId}
                </h2>

                <div className="grid grid-cols-5 gap-4 mb-6">
                  {Object.entries(selectedReview.scores).map(([key, value]) => (
                    <div key={key} className="text-center">
                      <p className="text-sm text-slate-600 capitalize mb-2">{key}</p>
                      <div className="text-2xl font-bold text-blue-600">{String(value)}</div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Strengths</h3>
                    <p className="text-slate-700">{selectedReview.strengths}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Areas for Improvement</h3>
                    <p className="text-slate-700">{selectedReview.areasForImprovement}</p>
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-2">Goals</h3>
                    <p className="text-slate-700">{selectedReview.goals}</p>
                  </div>
                </div>
              </div>

              {insight && (
                <div className={`rounded-xl shadow-sm p-6 border ${
                  insight.fallback ? 'bg-amber-50 border-amber-200' : 'bg-white border-slate-200'
                }`}>
                  <div className="flex items-center gap-2 mb-4">
                    {insight.attritionRisk > 0.5 ? (
                      <AlertTriangle className="text-red-600" size={20} />
                    ) : (
                      <TrendingUp className="text-emerald-600" size={20} />
                    )}
                    <h3 className="text-lg font-semibold text-slate-900">AI Performance Insight</h3>
                  </div>

                  <div className="mb-4">
                    <p className="text-sm text-slate-600 mb-2">Attrition Risk</p>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 h-3 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${
                            insight.attritionRisk > 0.5 ? 'bg-red-500' :
                            insight.attritionRisk > 0.3 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${insight.attritionRisk * 100}%` }}
                        />
                      </div>
                      <span className="font-semibold text-slate-900">{Math.round(insight.attritionRisk * 100)}%</span>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm font-semibold text-slate-900 mb-2">Top Factors:</p>
                    <ul className="space-y-1">
                      {insight.topFactors?.map((factor: any, idx: number) => (
                        <li key={idx} className="text-sm text-slate-700">
                          • {factor.feature}: {factor.impact > 0 ? '+' : ''}{factor.impact.toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <p className="text-sm text-slate-600 mt-4 pt-4 border-t border-slate-200">{insight.explain}</p>

                  {insight.fallback && (
                    <div className="mt-4 p-3 bg-amber-100 rounded-lg">
                      <p className="text-xs text-amber-800">⚠️ Using fallback heuristics. {insight.todo}</p>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
