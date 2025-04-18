import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Adjust the path to your service account key JSON file
import * as path from 'path';
import * as fs from 'fs';

// Read the service account file
const serviceAccountPath = path.resolve(
  process.cwd(),
  'omnitrade-firebase-adminsdk.json',
);
let serviceAccount: admin.ServiceAccount;

try {
  const rawData = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(rawData) as admin.ServiceAccount;
  console.log(
    'Firebase service account loaded successfully from:',
    serviceAccountPath,
  );
} catch (error) {
  console.error('Error loading Firebase service account:', error);
  throw new Error(
    'Failed to load Firebase service account. Please check the file exists and has correct permissions.',
  );
}

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount), // Cast to satisfy type checking
  });
}

@Injectable()
export class FirebaseAuthMiddleware implements NestMiddleware {
  async use(
    req: Request & { user?: { user_id: string } },
    _res: Response, // Prefix with underscore to indicate it's not used
    next: NextFunction,
  ) {
    const token = req.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      // Allow request to proceed, but req.user will be undefined.
      // Controllers needing auth MUST check req.user.
      // Alternatively, throw UnauthorizedException here if all routes require auth.
      return next();
    }

    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      // Attach user info to the request object
      req.user = { user_id: decodedToken.uid };
      next();
    } catch (error) {
      console.error('Firebase Auth Error:', error);
      // Decide how to handle invalid tokens (e.g., clear req.user, send 401/403)
      // For now, let it proceed without user, similar to missing token case.
      // Consider sending res.status(401).send('Unauthorized'); if strict auth needed.
      next();
    }
  }
}
