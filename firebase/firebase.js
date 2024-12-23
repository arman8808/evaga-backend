import admin from 'firebase-admin';
import { readFileSync } from 'fs';
import path from 'path';


const serviceAccountKeyPath = path.resolve(
  './firebase/evaga-a8fbd-firebase-adminsdk-z7ee3-9f54885078.json'
);

admin.initializeApp({
  credential: admin.credential.cert(
    JSON.parse(readFileSync(serviceAccountKeyPath, 'utf-8'))
  ),
});

export default admin;
