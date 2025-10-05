import mongoose, { Schema, Document } from 'mongoose';

export interface IJobOpening extends Document {
  title: string;
  department: string;
  description: string;
  requiredSkills: string[];
  status: 'Open' | 'Closed';
  postedDate: Date;
  createdAt: Date;
  updatedAt: Date;
}

const JobOpeningSchema = new Schema<IJobOpening>({
  title: { type: String, required: true },
  department: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
  postedDate: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.model<IJobOpening>('JobOpening', JobOpeningSchema);
