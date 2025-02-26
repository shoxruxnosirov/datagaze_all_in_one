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
import { IGuardRequest, IPayload } from '../types';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<IGuardRequest>();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new ForbiddenException('Token topilmadi');
    }

    try {
      const decoded: IPayload = this.jwtService.verify(token, { secret: JWT_SECRET });
      const userRole: Role = decoded.role;
      const payload: IPayload = {
        id: decoded.id,
        role: decoded.role,
      };
      request.user = payload;

      if (!roles.includes(userRole)) {
        throw new ForbiddenException("Sizga ruxsat yo'q");
      }
      return true;
    } catch (err) {
      throw new UnauthorizedException('Yaroqsiz token');
    }
  }
}
