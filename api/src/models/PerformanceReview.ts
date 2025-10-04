import mongoose, { Schema, Document } from 'mongoose';

export interface IPerformanceReview extends Document {
  employeeId: mongoose.Types.ObjectId;
  reviewerId: mongoose.Types.ObjectId;
  reviewPeriod: {
    startDate: Date;
    endDate: Date;
  };
  scores: {
    technical: number;
    communication: number;
    teamwork: number;
    leadership: number;
    initiative: number;
  };
  averageScore: number;
  strengths: string;
  areasForImprovement: string;
  goals: string;
  talkingPoints?: string[];
  status: 'draft' | 'submitted' | 'reviewed' | 'finalized';
  attritionRisk?: number;
  aiInsights?: {
    risk: number;
    factors: Array<{ feature: string; impact: number }>;
    explanation: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PerformanceReviewSchema = new Schema<IPerformanceReview>({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewerId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  reviewPeriod: {
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true }
  },
  scores: {
    technical: { type: Number, min: 1, max: 5, required: true },
    communication: { type: Number, min: 1, max: 5, required: true },
    teamwork: { type: Number, min: 1, max: 5, required: true },
    leadership: { type: Number, min: 1, max: 5, required: true },
    initiative: { type: Number, min: 1, max: 5, required: true }
  },
  averageScore: { type: Number, min: 1, max: 5 },
  strengths: { type: String, default: '' },
  areasForImprovement: { type: String, default: '' },
  goals: { type: String, default: '' },
  talkingPoints: [{ type: String }],
  status: { type: String, enum: ['draft', 'submitted', 'reviewed', 'finalized'], default: 'draft' },
  attritionRisk: { type: Number },
  aiInsights: {
    risk: { type: Number },
    factors: [{ feature: String, impact: Number }],
    explanation: { type: String }
  }
}, { timestamps: true });

PerformanceReviewSchema.pre('save', function(next) {
  if (this.scores) {
    const scores = this.scores;
    this.averageScore = (
      scores.technical + scores.communication + scores.teamwork +
      scores.leadership + scores.initiative
    ) / 5;
  }
  next();
});

export default mongoose.model<IPerformanceReview>('PerformanceReview', PerformanceReviewSchema);
