import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/config/env';
import { Role } from './roles.enum';
import { IGuardRequest, IPayload, IPayloadAgent, IRequestAgent } from '../types';

@Injectable()
export class AgentGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<IRequestAgent>();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ForbiddenException('Token topilmadi');
    }

    try {
      const decoded: IPayloadAgent = this.jwtService.verify(token, { secret: JWT_SECRET });
      const payload: IPayloadAgent = {
        computerId: decoded.computerId,
        key: decoded.key,
      };
      request.agent = payload;

      return true;
    } catch (err) {
      throw new UnauthorizedException('Yaroqsiz token');
    }
  }
}