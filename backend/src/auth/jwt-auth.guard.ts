import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as admin from 'firebase-admin';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    if (context.getType() === 'http') {
      const request = context.switchToHttp().getRequest();
      return this.validateRequest(request);
    } else if (context.getType() === 'ws') {
      const client = context.switchToWs().getClient();
      return this.validateWsRequest(client);
    }
    return false;
  }

  private async validateRequest(request: any): Promise<boolean> {
    const token = request.headers.authorization?.split('Bearer ')[1];
    return this.verifyAndAttachUser(token, request);
  }

  private async validateWsRequest(client: any): Promise<boolean> {
    // Socket.io handshake auth or headers
    const token =
      client.handshake?.auth?.token?.split('Bearer ')[1] ||
      client.handshake?.auth?.token || // Support token without Bearer prefix
      client.handshake?.headers?.authorization?.split('Bearer ')[1];

    return this.verifyAndAttachUser(token, client);
  }

  private async verifyAndAttachUser(
    token: string | undefined,
    target: any,
  ): Promise<boolean> {
    if (!token) {
      throw new UnauthorizedException('No token provided');
    }

    try {
      // Verify the Firebase token
      const decodedToken = await admin.auth().verifyIdToken(token);

      // Attach the user to the request/client object
      const user = {
        user_id: decodedToken.uid,
        email: decodedToken.email,
      };

      if (target.user === undefined) {
        target.user = user;
      } else {
        // If it's a request object, target.user might already exist from middleware
        Object.assign(target.user, user);
      }

      return true;
    } catch (error) {
      console.error('Error validating token:', error);
      throw new UnauthorizedException('Invalid token');
    }
  }
}
