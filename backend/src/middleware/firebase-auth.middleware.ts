import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Adjust the path to your service account key JSON file
import * as path from 'path';
import * as fs from 'fs';

// Create a logger instance
const logger = new Logger('FirebaseAuthMiddleware');

// Read the service account file from the root directory
const serviceAccountPath = path.resolve(
  process.cwd(),
  './omnitrade-firebase-adminsdk.json', // Use the file in the current directory
);
let serviceAccount: admin.ServiceAccount;

try {
  const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(rawData) as admin.ServiceAccount;
  logger.log(
    'Firebase service account loaded successfully from: ' + serviceAccountPath,
  );
} catch (error) {
  logger.error('Error loading Firebase service account:', error);
  throw new Error(
    'Failed to load Firebase service account. Please check the file exists and has correct permissions.',
  );
}

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    logger.log('Firebase Admin SDK initialized successfully');
  } catch (error) {
    logger.error('Error initializing Firebase Admin SDK:', error);
    throw error;
  }
}

@Injectable()
export class FirebaseAuthMiddleware implements NestMiddleware {
  async use(
    req: Request & { user?: { user_id: string } },
    res: Response,
    next: NextFunction,
  ) {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      // For public routes, allow the request to proceed without authentication
      // For protected routes, the controller should check req.user and handle accordingly
      return next();
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // Attach user info to the request object
      req.user = { user_id: decodedToken.uid };
      logger.debug(`Authenticated user: ${decodedToken.uid}`);
      next();
    } catch (error) {
      logger.error('Firebase Auth Error:', error);

      // For invalid tokens, return 401 Unauthorized
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/id-token-expired') {
        return res.status(401).json({ error: 'Token expired' });
      } else if (firebaseError.code === 'auth/argument-error') {
        return res.status(401).json({ error: 'Invalid token format' });
      } else {
        return res.status(401).json({ error: 'Authentication failed' });
      }
    }
  }
}
