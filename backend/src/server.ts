import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import resultRoutes from './routes/resultRoutes';
import { testConnection, pool } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security & Logging Middlewares
app.use(helmet());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Configurable CORS: supports localhost, custom domain, and Vercel deployments
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, Postman, or server-to-server)
      if (!origin) return callback(null, true);

      // Allow if explicit match
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Auto-allow any Vercel or Railway deployment domain
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
      if (/^https:\/\/.*\.railway\.app$/.test(origin)) return callback(null, true);

      // In development, allow localhost on any port
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      return callback(null, true); // Permissive to prevent CORS blockages on custom domains
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Root Index Route
app.get('/', (_req: Request, res: Response) => {
  res.json({
    service: 'Shivam Academy Result Portal API',
    status: 'ONLINE',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      results: '/api/results',
      statistics: '/api/results/stats/overview',
      auth: '/api/auth/login',
    },
    documentation: 'See README and RAILWAY_VERCEL_DEPLOYMENT_GUIDE.md',
  });
});

// Health check endpoint for Railway monitoring & Docker probes
app.get('/api/health', async (_req: Request, res: Response) => {
  try {
    const dbRes = await pool.query('SELECT 1 as healthy');
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      database: dbRes.rows[0].healthy === 1 ? 'connected' : 'disconnected',
    });
  } catch (err: any) {
    res.status(503).json({
      status: 'error',
      message: 'Database check failed',
      error: err.message,
    });
  }
});

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/results', resultRoutes);

// 404 Route Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `API endpoint [${req.method}] ${req.originalUrl} not found.`,
  });
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

// Start Server
app.listen(PORT, async () => {
  console.log(`=======================================================`);
  console.log(`🚀 Shivam Academy Backend API running on port ${PORT}`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📚 Results API: http://localhost:${PORT}/api/results`);
  console.log(`=======================================================`);
  
  // Test connection to PostgreSQL
  await testConnection();
});

export default app;
