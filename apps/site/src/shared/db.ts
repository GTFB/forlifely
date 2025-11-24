import path from 'path';
import { createRequire } from 'module';
import { schema } from './schema/schema';

const require = createRequire(import.meta.url);

const databaseUrl = process.env.DATABASE_URL;
const isPostgresConnection = Boolean(
  databaseUrl?.startsWith('postgres://') || databaseUrl?.startsWith('postgresql://'),
);

const sqliteDbPath =
  !isPostgresConnection && databaseUrl
    ? databaseUrl
    : path.join(process.cwd(), process.env.SQLITE_DB_FILE ?? 'esnad.sqlite');

const isBunRuntime = typeof Bun !== 'undefined';

type BunDrizzle = typeof import('drizzle-orm/bun-sqlite');
type PostgresDrizzle = typeof import('drizzle-orm/node-postgres');
type PgModule = typeof import('pg');


function createBunDb() {
  // TODO: Implement Bun database connection
}

function createPostgresDb() {
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is required to initialize PostgreSQL connection');
  }

  const { Pool } = require('pg') as PgModule;
  const { drizzle } = require('drizzle-orm/node-postgres') as PostgresDrizzle;

  const sslEnv = (process.env.POSTGRES_SSL ?? process.env.DATABASE_SSL ?? '').toLowerCase();
  const ssl =
    sslEnv && sslEnv !== 'false'
      ? {
          rejectUnauthorized:
            (process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED ?? 'true').toLowerCase() !== 'false',
        }
      : undefined;

  const pool = new Pool({
    connectionString: databaseUrl,
    max: Number(process.env.POSTGRES_POOL_MAX ?? process.env.DATABASE_POOL_MAX ?? 10),
    ssl,
  });

  return drizzle(pool, { schema });
}

const dbInstance = createPostgresDb();

type PostgresDbInstance = ReturnType<typeof createPostgresDb>;

export type SiteDb =  PostgresDbInstance;
export const db = dbInstance as SiteDb;
export const isPostgresDb = isPostgresConnection;