import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import { env } from './config/env.js';
import routes from './routes/index.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { notFound } from './middlewares/notFound.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: env.FRONTEND_URL,
      credentials: false,
    })
  );
  if (env.NODE_ENV !== 'test') {
    app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
  }
  app.use(express.json({ limit: '100kb' }));

  // Rate limiting global por IP sobre la API
  app.use(
    '/api/v1',
    rateLimit({
      windowMs: 60_000,
      max: env.RATE_LIMIT_MAX,
      standardHeaders: true,
      legacyHeaders: false,
      message: {
        data: null,
        meta: null,
        error: { code: 'RATE_LIMITED', message: 'Demasiadas peticiones. Intente más tarde.' },
      },
    })
  );

  app.use('/api/v1', routes);

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
