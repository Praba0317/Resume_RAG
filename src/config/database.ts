import { Db, MongoClient } from "mongodb";
import { env } from "./env";

let client: MongoClient | undefined;
let database: Db | undefined;

export async function getDatabase(): Promise<Db> {
  if (database) {
    return database;
  }

  if (!env.mongodbUri) {
    throw new Error("MONGODB_URI is not configured");
  }

  client ??= new MongoClient(env.mongodbUri);
  await client.connect();
  database = client.db(env.mongodbDbName);
  return database;
}

export async function pingDatabase(): Promise<number> {
  const startedAt = Date.now();
  const db = await getDatabase();
  await db.command({ ping: 1 });
  return Date.now() - startedAt;
}

export async function closeDatabase(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
    database = undefined;
  }
}
