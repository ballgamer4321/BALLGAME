import { applicationDefault, cert, getApps, initializeApp } from 'firebase-admin/app';
import { getDatabase } from 'firebase-admin/database';

const APP_NAME = 'orbita-hosted';

export function firebaseConfigured() {
  return Boolean(process.env.FIREBASE_DATABASE_URL &&
    (process.env.FIREBASE_SERVICE_ACCOUNT_JSON || process.env.GOOGLE_APPLICATION_CREDENTIALS));
}

export function firebaseDatabase() {
  if (!firebaseConfigured()) throw new Error('Firebase Realtime Database is not configured');
  let app = getApps().find(candidate => candidate.name === APP_NAME);
  if (!app) {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
    const key = raw ? JSON.parse(raw) as { project_id: string; client_email: string; private_key: string } : null;
    app = initializeApp({
      credential: key ? cert({ projectId: key.project_id, clientEmail: key.client_email, privateKey: key.private_key }) : applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    }, APP_NAME);
  }
  return getDatabase(app);
}
