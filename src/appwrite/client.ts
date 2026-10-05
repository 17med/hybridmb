import { Account, Client, Realtime, TablesDB } from 'appwrite';

/**
 * The single adapter to Appwrite. Every other module reaches Appwrite
 * through the objects exported here, never by building its own Client.
 */

function readRequiredEnv(name: keyof ImportMetaEnv): string {
  const value = import.meta.env[name];
  if (!value) {
    // Fail closed at boot: without these the app would talk to nothing,
    // so refusing to start is clearer than failing on the first request.
    throw new Error(`Missing required env variable ${name}. Copy .env.example to .env and fill it in.`);
  }
  return value;
}

export const appwriteConfig = {
  endpoint: readRequiredEnv('VITE_APPWRITE_ENDPOINT'),
  projectId: readRequiredEnv('VITE_APPWRITE_PROJECT_ID'),
  databaseId: readRequiredEnv('VITE_APPWRITE_DATABASE_ID'),
  messagesTableId: readRequiredEnv('VITE_APPWRITE_MESSAGES_TABLE_ID'),
  presenceTableId: readRequiredEnv('VITE_APPWRITE_PRESENCE_TABLE_ID'),
} as const;

const client = new Client()
  .setEndpoint(appwriteConfig.endpoint)
  .setProject(appwriteConfig.projectId);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const realtime = new Realtime(client);
