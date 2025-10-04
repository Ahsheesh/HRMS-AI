import mongoose, { Schema, Document } from 'mongoose';

export interface IAuditLog extends Document {
  requestId: string;
  userId?: mongoose.Types.ObjectId;
  action: string;
  endpoint: string;
  method: string;
  aiCall?: {
    service: string;
    endpoint: string;
    duration: number;
    fallback: boolean;
    modelUsed?: string;
  };
  statusCode: number;
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>({
  requestId: { type: String, required: true, index: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User' },
  action: { type: String, required: true },
  endpoint: { type: String, required: true },
  method: { type: String, required: true },
  aiCall: {
    service: { type: String },
    endpoint: { type: String },
    duration: { type: Number },
    fallback: { type: Boolean },
    modelUsed: { type: String }
  },
  statusCode: { type: Number, required: true },
  ipAddress: { type: String },
  userAgent: { type: String }
}, { timestamps: { createdAt: true, updatedAt: false } });

AuditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 }); // 30 days

export default mongoose.model<IAuditLog>('AuditLog', AuditLogSchema);
