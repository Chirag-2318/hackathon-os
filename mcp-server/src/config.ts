import { z } from 'zod';

const envSchema = z.object({
  PORT: z
    .string()
    .optional()
    .default('3000')
    .transform((val) => {
      const parsed = parseInt(val, 10);
      if (isNaN(parsed) || parsed <= 0 || parsed > 65535) {
        throw new Error(`PORT must be a valid port number between 1 and 65535, received: ${val}`);
      }
      return parsed;
    }),
  BRACKIT_API_BASE_URL: z
    .string()
    .optional()
    .default('http://localhost:8080')
    .transform((val) => val.replace(/\/+$/, '')),
  BRACKIT_DEV_TOKEN: z.string().optional(),
  NODE_ENV: z.string().optional().default('development'),
});

export type Config = {
  PORT: number;
  BRACKIT_API_BASE_URL: string;
  BRACKIT_DEV_TOKEN?: string;
  NODE_ENV: string;
  isProduction: boolean;
};

export function loadConfig(env: NodeJS.ProcessEnv = process.env): Config {
  const result = envSchema.safeParse(env);
  if (!result.success) {
    const errorDetails = result.error.errors
      .map((e) => `  - ${e.path.join('.')}: ${e.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${errorDetails}`);
  }

  const isProd = result.data.NODE_ENV === 'production';
  const devToken = isProd ? undefined : result.data.BRACKIT_DEV_TOKEN;

  return {
    PORT: result.data.PORT,
    BRACKIT_API_BASE_URL: result.data.BRACKIT_API_BASE_URL,
    BRACKIT_DEV_TOKEN: devToken,
    NODE_ENV: result.data.NODE_ENV,
    isProduction: isProd,
  };
}

export const config = loadConfig();
