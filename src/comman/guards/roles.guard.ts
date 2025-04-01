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
import { GuardRequest, Payload, Role } from '../types';
import { AdminRepository } from 'src/database/repositories/admin.repository';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly adminRepository: AdminRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!roles) {
      return true;
    }

    const request = context.switchToHttp().getRequest<GuardRequest>();
    const token = request.headers.authorization?.split(' ')[1];

    if (!token) {
      throw new UnauthorizedException('Token topilmadi');
    }

    try {
      const decoded: Payload = this.jwtService.verify(token, { secret: JWT_SECRET });
      const userRole: Role = decoded.role;

      if (userRole === Role.ADMIN) {
        try {
          await this.adminRepository.getOneAdmin(decoded.id);
        } catch (err: unknown) {
          if(err instanceof Error) {
            throw new ForbiddenException('You do not have permission to access this resource');
          } else {
            throw err;
          }
        }
      }

      const payload: Payload = {
        id: decoded.id,
        role: decoded.role,
      };
      request.user = payload;

      if (!roles.includes(userRole)) {
        throw new ForbiddenException("Sizga ruxsat yo'q");
      }
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err instanceof ForbiddenException) {
          throw err;
        } else {
          throw new UnauthorizedException('Yaroqsiz token');
        }
      } else {
        throw err;
      }
    }
  }
}
