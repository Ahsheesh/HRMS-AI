import mongoose, { Schema, Document } from 'mongoose';

export interface IEmployee extends Document {
  userId: mongoose.Types.ObjectId;
  employeeId: string;
  jobTitle: string;
  department: string;
  skills: string[];
  hireDate: Date;
  manager?: mongoose.Types.ObjectId;
  status: 'active' | 'onboarding' | 'inactive';
  currentAllocationPercent: number;
  phoneNumber?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  attendance: Array<{
    date: Date;
    status: 'Present' | 'Late' | 'Absent';
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>({
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  employeeId: { type: String, required: true, unique: true },
  jobTitle: { type: String, required: true },
  department: { type: String, required: true },
  skills: [{ type: String }],
  hireDate: { type: Date, default: Date.now },
  manager: { type: Schema.Types.ObjectId, ref: 'Employee' },
  status: { type: String, enum: ['active', 'onboarding', 'inactive'], default: 'onboarding' },
  currentAllocationPercent: { type: Number, default: 0, min: 0, max: 100 },
  phoneNumber: { type: String },
  emergencyContact: {
    name: { type: String },
    phone: { type: String },
    relationship: { type: String }
  },
  attendance: [{
    date: { type: Date, required: true },
    status: { type: String, enum: ['Present', 'Late', 'Absent'], required: true }
  }]
}, { timestamps: true });

export default mongoose.model<IEmployee>('Employee', EmployeeSchema);
