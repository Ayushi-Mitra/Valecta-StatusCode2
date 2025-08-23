import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client();

client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) // Required
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID); // Required

export const account = new Account(client);
export const databases = new Databases(client);
export const storage = new Storage(client);
export { ID };