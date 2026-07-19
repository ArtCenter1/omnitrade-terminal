/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-argument */
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as admin from 'firebase-admin';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest();
    return this.validateRequest(request);
  }

  private async validateRequest(request: any): Promise<boolean> {
    const token = request.headers.authorization?.split('Bearer ')[1];

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Security Enhancement: Pass true as the second argument to check for token revocation
      const decodedToken = await admin.auth().verifyIdToken(token, true);

      // Attach the user to the request object
      request.user = {
        user_id: decodedToken.uid,
        email: decodedToken.email,
        // Add any other user properties you need
      };

      return true;
    } catch (error) {
      this.logger.error('Error validating token:', error);
      const firebaseError = error as { code?: string; message?: string };
      if (firebaseError.code === 'auth/id-token-revoked') {
        throw new UnauthorizedException('Token revoked');
      }
      throw new UnauthorizedException('Invalid token');
    }
  }
}
