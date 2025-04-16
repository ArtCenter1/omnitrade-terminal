import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as admin from 'firebase-admin';

// Adjust the path to your service account key JSON file
import * as serviceAccount from '../../../omnitrade-firebase-adminsdk.json'; // Corrected path (3 levels up)

// Initialize Firebase Admin SDK only once
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount as admin.ServiceAccount), // Cast to satisfy type checking
  });
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
