import mongoose, { Schema, Document } from 'mongoose';

export interface IMockResume extends Document {
  name: string;
  email: string;
  phone: string;
  resumeText: string;
  skills: string[];
  experienceYears: number;
  education: string;
  createdAt: Date;
  updatedAt: Date;
}

const MockResumeSchema = new Schema<IMockResume>({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String, required: true },
  resumeText: { type: String, required: true },
  skills: [{ type: String }],
  experienceYears: { type: Number, required: true },
  education: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model<IMockResume>('MockResume', MockResumeSchema);
