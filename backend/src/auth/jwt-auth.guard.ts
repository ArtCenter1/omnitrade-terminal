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
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return this.validateRequest(request);
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      return this.validateRequest(client.handshake, client);
    }
    return false;
  }

  private async validateRequest(request: any, client?: any): Promise<boolean> {
    // Security: If user is already attached (e.g., by middleware), avoid redundant verification
    if (request.user?.user_id) {
      return true;
    }

    const authHeader = request.headers?.authorization;
    const token = authHeader?.startsWith('Bearer ')
      ? authHeader.split(' ')[1]
      : null;

    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify the Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Attach the user to the request object
      const user = {
        user_id: decodedToken.uid,
        email: decodedToken.email,
      };
      request.user = user;

      // If this is a WebSocket connection, also attach user to the client object
      if (client) {
        client.user = user;
      }

      return true;
    } catch (error) {
      // Security: Sanitize error logs to avoid information leakage
      // But keep error object in internal logs for debugging
      this.logger.error('Error validating token', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
