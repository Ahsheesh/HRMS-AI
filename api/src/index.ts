import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';
import authRoutes from './routes/auth.js';
import employeeRoutes from './routes/employees.js';
import onboardingRoutes from './routes/onboarding.js';
import performanceRoutes from './routes/performance.js';
import projectRoutes from './routes/projects.js';
import allocationRoutes from './routes/allocations.js';
import aiRoutes from './routes/ai.js';
import performanceAnalysisRoutes from './routes/performanceAnalysis.js';
import AuditLog from './models/AuditLog.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hrms';

// Middleware
app.use(cors());
app.use(express.json());

// Request ID and audit logging middleware
app.use((req, res, next) => {
  req.requestId = uuidv4();
  res.setHeader('X-Request-ID', req.requestId);

  const startTime = Date.now();

  res.on('finish', async () => {
    const duration = Date.now() - startTime;
    try {
      await AuditLog.create({
        requestId: req.requestId,
        userId: req.user?._id,
        action: `${req.method} ${req.path}`,
        endpoint: req.path,
        method: req.method,
        statusCode: res.statusCode,
        ipAddress: req.ip,
        userAgent: req.get('user-agent')
      });
    } catch (error) {
      console.error('Failed to log audit:', error);
    }
  });

  next();
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/performance', performanceRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/allocations', allocationRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/performance-analysis', performanceAnalysisRoutes);

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error',
    requestId: req.requestId
  });
});

// Connect to MongoDB and start server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log('✓ Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`✓ API server running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  });

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      requestId: string;
      user?: any;
    }
  }
}
