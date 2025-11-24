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

type NodeDrizzle = typeof import('drizzle-orm/better-sqlite3');
type BunDrizzle = typeof import('drizzle-orm/bun-sqlite');
type PostgresDrizzle = typeof import('drizzle-orm/node-postgres');
type PgModule = typeof import('pg');

function createNodeDb() {
  const BetterSqlite = require('better-sqlite3') as typeof import('better-sqlite3');
  const { drizzle } = require('drizzle-orm/better-sqlite3') as NodeDrizzle;
  const sqlite = new BetterSqlite(sqliteDbPath);
  return drizzle(sqlite, { schema });
}

function createBunDb() {
  const { Database } = require('bun:sqlite') as typeof import('bun:sqlite');
  const { drizzle } = require('drizzle-orm/bun-sqlite') as BunDrizzle;
  const sqlite = new Database(sqliteDbPath, { create: true });
  return drizzle(sqlite, { schema });
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

const dbFactory = isPostgresConnection ? createPostgresDb : isBunRuntime ? createBunDb : createNodeDb;
const dbInstance = dbFactory();

type SqliteDbInstance = ReturnType<typeof createNodeDb>;

export type SiteDb = SqliteDbInstance;
export const db = dbInstance as SiteDb;
export const isPostgresDb = isPostgresConnection;

