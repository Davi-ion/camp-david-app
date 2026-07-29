import 'dotenv/config';
import mariadb from 'mariadb';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '../generated/prisma/index.js';

const host = process.env.DB_HOST || '193.203.168.91';
const port = Number(process.env.DB_PORT) || 3306;
const user = process.env.DB_USER || 'u859677653_camp_david';
const password = process.env.DB_PASSWORD || '*Reedb4b4';
const database = process.env.DB_NAME || 'u859677653_camp_david_db';

console.log(`[Prisma] Connecting to remote MySQL at ${host}:${port}/${database} as ${user}...`);

const pool = mariadb.createPool({
  host,
  port,
  user,
  password,
  database,
  connectionLimit: 10,
  connectTimeout: 15000,
});

const adapter = new PrismaMariaDb(pool);
export const prisma = new PrismaClient({ adapter });
