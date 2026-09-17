import { createClient } from "@libsql/client";
import { mkdir } from "node:fs/promises";
export async function connect(url, authToken) {
  if (url.startsWith("file:.data/")) await mkdir(".data", { recursive: true });
  const db = createClient({ url, authToken: authToken || undefined });
  await db.executeMultiple(`
 PRAGMA foreign_keys=ON;
 CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE NOT NULL,name TEXT NOT NULL,password TEXT NOT NULL,role TEXT NOT NULL DEFAULT 'member',created TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS sessions(hash TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS limits(key TEXT PRIMARY KEY,count INTEGER NOT NULL,expires INTEGER NOT NULL);
 CREATE TABLE IF NOT EXISTS counselors(id TEXT PRIMARY KEY,data TEXT NOT NULL,demo INTEGER NOT NULL,active INTEGER NOT NULL DEFAULT 1);
 CREATE TABLE IF NOT EXISTS requests(id TEXT PRIMARY KEY,user_id TEXT NOT NULL REFERENCES users(id),data TEXT NOT NULL,status TEXT NOT NULL,counselor_id TEXT,amount INTEGER,slot TEXT,location TEXT,venue_note TEXT,offer_expires TEXT,offer_revision TEXT,demo INTEGER NOT NULL DEFAULT 0,created TEXT NOT NULL,updated TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,request_id TEXT NOT NULL REFERENCES requests(id),user_id TEXT NOT NULL REFERENCES users(id),amount INTEGER NOT NULL,provider TEXT NOT NULL,status TEXT NOT NULL,payment_key TEXT UNIQUE,operation_key TEXT NOT NULL,refund_key TEXT NOT NULL,receipt TEXT,created TEXT NOT NULL,updated TEXT NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS active_order ON orders(request_id) WHERE status NOT IN ('failed','refunded');
 CREATE TABLE IF NOT EXISTS support(id TEXT PRIMARY KEY,request_id TEXT NOT NULL REFERENCES requests(id),kind TEXT NOT NULL,note TEXT NOT NULL,status TEXT NOT NULL,created TEXT NOT NULL);
 CREATE UNIQUE INDEX IF NOT EXISTS open_support ON support(request_id) WHERE status='open';
 CREATE TABLE IF NOT EXISTS audit(id TEXT PRIMARY KEY,actor TEXT NOT NULL,action TEXT NOT NULL,object_id TEXT NOT NULL,created TEXT NOT NULL);
 `);
  return db;
}
export const one = async (db, sql, args = []) =>
  (await db.execute({ sql, args })).rows[0];
export const many = async (db, sql, args = []) =>
  (await db.execute({ sql, args })).rows;
export const run = (db, sql, args = []) => db.execute({ sql, args });
