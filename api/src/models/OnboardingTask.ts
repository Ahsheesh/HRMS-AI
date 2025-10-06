import mongoose, { Schema, Document } from 'mongoose';

export interface IOnboardingTask extends Document {
  employeeId: mongoose.Types.ObjectId;
  phase: 'day1' | 'week1' | 'month1' | 'month3';
  title: string;
  description: string;
  duration?: string;
  status: 'pending' | 'in_progress' | 'completed';
  dueDate?: Date;
  startDate?: Date;
  completedAt?: Date;
  assignedTo?: mongoose.Types.ObjectId;
  generatedByAI: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const OnboardingTaskSchema = new Schema<IOnboardingTask>({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  phase: { type: String, enum: ['day1', 'week1', 'month1', 'month3'], required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  duration: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  dueDate: { type: Date },
  startDate: { type: Date },
  completedAt: { type: Date },
  assignedTo: { type: Schema.Types.ObjectId, ref: 'Employee' },
  generatedByAI: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
}, { timestamps: true });

OnboardingTaskSchema.index({ employeeId: 1, phase: 1, order: 1 });

export default mongoose.model<IOnboardingTask>('OnboardingTask', OnboardingTaskSchema);
