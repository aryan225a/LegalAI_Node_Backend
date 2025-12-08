import cors from 'cors';

const allowedOrigins = [
  process.env.FRONTEND_URL,
  'http://localhost:3000',
  'https://legalai-six.vercel.app',
].filter((o): o is string => !!o);

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, '');

    if (
      allowedOrigins
        .filter(Boolean)
        .map(o => o.replace(/\/$/, ''))
        .includes(normalizedOrigin)
    ) {
      return callback(null, true);
    }

    console.warn(`CORS blocked origin: ${origin}`);
    return callback(null, false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
  ],
  exposedHeaders: ['X-Total-Count', 'X-Page', 'X-Per-Page'],
  maxAge: 86400,
  preflightContinue: false,
  optionsSuccessStatus: 204,
};

export const corsMiddleware = cors(corsOptions);

