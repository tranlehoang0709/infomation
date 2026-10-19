export interface AppConfig {
  databaseUrl: string;
  jwtSecret: string;
  frontendOrigin: string;
  portfolioSlug: string;
  port: number;
  nodeEnv: string;
  mediaStorageDirectory: string;
}

export function validateEnvironment(raw: Record<string, unknown>): AppConfig {
  const required = ['DATABASE_URL', 'JWT_SECRET', 'FRONTEND_ORIGIN', 'PORTFOLIO_SLUG'] as const;
  for (const key of required) {
    if (typeof raw[key] !== 'string' || raw[key].trim() === '') {
      throw new Error(`Missing required environment variable: ${key}`);
    }
  }
  if (String(raw.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters.');
  }
  const port = Number(raw.PORT ?? 4000);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error('PORT must be a valid TCP port.');
  }
  return {
    databaseUrl: String(raw.DATABASE_URL),
    jwtSecret: String(raw.JWT_SECRET),
    frontendOrigin: String(raw.FRONTEND_ORIGIN),
    portfolioSlug: String(raw.PORTFOLIO_SLUG),
    port,
    nodeEnv: String(raw.NODE_ENV ?? 'development'),
    mediaStorageDirectory: String(raw.MEDIA_STORAGE_DIR ?? '../storage/uploads'),
  };
}
