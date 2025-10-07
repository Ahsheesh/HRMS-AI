import mongoose, { Schema, Document } from 'mongoose';

export interface IAllocation extends Document {
  employeeId: mongoose.Types.ObjectId;
  projectId: mongoose.Types.ObjectId;
  allocationPercent: number;
  startDate: Date;
  endDate?: Date;
  role: string;
  status: 'planned' | 'active' | 'completed';
  matchScore?: number;
  matchExplanation?: string;
  createdAt: Date;
  updatedAt: Date;
}

const AllocationSchema = new Schema<IAllocation>({
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', required: true },
  allocationPercent: { type: Number, required: true, min: 0, max: 100 },
  startDate: { type: Date, required: false },
  endDate: { type: Date, required: false },
  role: { type: String, required: true },
  status: { type: String, enum: ['planned', 'active', 'completed'], default: 'planned' },
  matchScore: { type: Number },
  matchExplanation: { type: String }
}, { timestamps: true });

AllocationSchema.index({ employeeId: 1, status: 1 });
AllocationSchema.index({ projectId: 1, status: 1 });

export default mongoose.model<IAllocation>('Allocation', AllocationSchema);
