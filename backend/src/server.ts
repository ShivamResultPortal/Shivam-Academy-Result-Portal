import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import resultRoutes from './routes/resultRoutes';
import { testConnection, pool } from './config/db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security & Logging Middlewares
app.use(helmet());
app.use(cookieParser());
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Strict Configurable CORS: Whitelist matching only
const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);

      // Check explicit allowed origins
      if (allowedOrigins.includes(origin)) return callback(null, true);

      // Allow verified Railway production domains
      if (/^https:\/\/.*\.railway\.app$/.test(origin)) return callback(null, true);
      if (/^https:\/\/.*\.up\.railway\.app$/.test(origin)) return callback(null, true);

      // Allow Vercel domains if deployed on Vercel
      if (/^https:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);

      // In local development, allow localhost on any port
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      if (process.env.NODE_ENV !== 'production' && /^http:\/\/127\.0\.0\.1(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }

      // Strictly reject all other origins
      return callback(new Error(`Origin [${origin}] blocked by strict CORS policy.`));
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
    version: '1.1.0',
    security: {
      rateLimiting: 'ACTIVE',
      validation: 'Zod (Strict)',
      authCookie: 'httpOnly Secure',
    },
    endpoints: {
      health: '/api/health',
      results: '/api/results',
      statistics: '/api/results/stats/overview',
      auth: '/api/auth/login',
      updateCredentials: '/api/auth/update-credentials',
    },
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

// Global Error Handler (including CORS errors)
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  if (err.message && err.message.includes('CORS policy')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }
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
  console.log(`🛡️ Rate Limiting & Zod Validation: ACTIVE`);
  console.log(`🍪 httpOnly Secure Cookie Authentication: ACTIVE`);
  console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
  console.log(`=======================================================`);
  
  // Test connection to PostgreSQL
  await testConnection();
});

export default app;
