import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';
import { AGENT_TOKEN_SECRET } from 'src/config/env';
import { PayloadAgent, RequestAgent } from '../types';

@Injectable()
export class AgentGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestAgent>();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token topilmadi');
    }

    try {
      const decoded: PayloadAgent = this.jwtService.verify(token, { secret: AGENT_TOKEN_SECRET });
      const payload: PayloadAgent = {
        computerId: decoded.computerId,
        key: decoded.key,
      };
      request.agent = payload;

      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new UnauthorizedException(err.message);
      } else {
        throw err;
      }
    }
  }
}
