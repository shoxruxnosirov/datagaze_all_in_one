import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';

import { AGENT_UPDATE_SECRET_KEY } from 'src/config/env';
import { PayloadAgent, RequestUpdateAgent } from '../types';

@Injectable()
export class AgentUpdateGuard implements CanActivate {

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<RequestUpdateAgent>();
    const token = request.headers.authorization;

    if (!token) {
      throw new UnauthorizedException('agent update Token topilmadi');
    }

    if (token !== AGENT_UPDATE_SECRET_KEY) {
      throw new UnauthorizedException('agnet update Token xato');
    }

    return true;
  }
}
