import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// ─── Carga mínima de variables de entorno (sin dependencia de dotenv) ───────
// Lee el archivo `.env` de la raíz si existe. `ConfigModule` ya las carga en
// tiempo de ejecución; aquí solo se necesitan para la CLI de TypeORM.
function loadEnvFile() {
  const envPath = resolve(__dirname, '.env');
  if (!existsSync(envPath)) return;
  const content = readFileSync(envPath, 'utf8');
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    let value = trimmed.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile();

const isTls = process.env.REDIS_TLS === 'true';
const redisUser = process.env.REDIS_USERNAME ?? '';
const redisPass = process.env.REDIS_PASSWORD ?? '';
const redisHost = process.env.REDIS_HOST ?? 'localhost';
const redisPort = process.env.REDIS_PORT ?? '6379';
const redisDb = process.env.REDIS_DB ?? '0';
const redisAuth = redisUser || redisPass ? `${redisUser}:${redisPass}@` : '';
const redisUrl =
  process.env.REDIS_URL ||
  `${isTls ? 'rediss' : 'redis'}://${redisAuth}${redisHost}:${redisPort}/${redisDb}`;

export const AppDataSource = new DataSource({

  type: 'postgres',
  host: process.env.DB_HOST ?? 'localhost',
  port: parseInt(process.env.DB_PORT ?? '5432', 10),
  username: process.env.DB_USERNAME ?? 'postgres',
  password: process.env.DB_PASSWORD ?? 'root',
  database: process.env.DB_NAME ?? 'ivss',
  entities: ['src/**/entities/*.entity.ts'],
  migrations: ['src/migrations/*.ts'],
  migrationsRun: true,
  cache: {
    type: 'redis',
    options: { url: redisUrl },
  },
});
