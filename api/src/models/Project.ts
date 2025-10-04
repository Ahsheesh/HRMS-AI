import mongoose, { Schema, Document } from 'mongoose';

export interface IProject extends Document {
  projectId: string;
  name: string;
  description: string;
  requiredSkills: string[];
  startDate: Date;
  endDate?: Date;
  status: 'planning' | 'active' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'critical';
  manager: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ProjectSchema = new Schema<IProject>({
  projectId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  requiredSkills: [{ type: String }],
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  status: { type: String, enum: ['planning', 'active', 'completed', 'on_hold'], default: 'planning' },
  priority: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  manager: { type: Schema.Types.ObjectId, ref: 'Employee', required: true }
}, { timestamps: true });

export default mongoose.model<IProject>('Project', ProjectSchema);
