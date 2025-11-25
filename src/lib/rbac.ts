import { NextRequest, NextResponse } from 'next/server';
import { verifyTokenFromRequest, JWTPayload } from './auth';

type Role = 'STUDENT' | 'TEACHER' | 'SCHOOL' | 'ADMIN';

export interface AuthenticatedRequest extends NextRequest {
  user?: JWTPayload;
}

export function requireAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await verifyTokenFromRequest(request);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
        { status: 401 }
      );
    }

    const authenticatedRequest = request as AuthenticatedRequest;
    authenticatedRequest.user = user;
    
    return handler(authenticatedRequest);
  };
}

export function requireRoles(roles: Role[]) {
  return (handler: (request: AuthenticatedRequest) => Promise<NextResponse>) => {
    return async (request: NextRequest) => {
      const user = await verifyTokenFromRequest(request);
      
      if (!user) {
        return NextResponse.json(
          { error: 'Unauthorized. Please log in.', code: 'UNAUTHORIZED' },
          { status: 401 }
        );
      }

      if (!roles.includes(user.role)) {
        return NextResponse.json(
          { 
            error: `Forbidden. Required roles: ${roles.join(', ')}`, 
            code: 'FORBIDDEN' 
          },
          { status: 403 }
        );
      }

      const authenticatedRequest = request as AuthenticatedRequest;
      authenticatedRequest.user = user;
      
      return handler(authenticatedRequest);
    };
  };
}

export function optionalAuth(
  handler: (request: AuthenticatedRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const user = await verifyTokenFromRequest(request);
    
    const authenticatedRequest = request as AuthenticatedRequest;
    if (user) {
      authenticatedRequest.user = user;
    }
    
    return handler(authenticatedRequest);
  };
}
