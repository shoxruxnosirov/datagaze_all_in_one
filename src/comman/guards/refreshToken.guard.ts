import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

import { JwtService } from '@nestjs/jwt';
import { REFRESH_TOKEN_SECRET } from 'src/config/env';
import { Role } from './roles.enum';
import { IGuardRequest, IPayload } from '../types';
import { AdminRepository } from 'src/database/repositories/admin.repository';

@Injectable()
export class RolesGuardForRefreshToken implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly adminRepository: AdminRepository,
  ) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {
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
      const decoded: IPayload = this.jwtService.verify(token, { secret: REFRESH_TOKEN_SECRET });
      const userRole: Role = decoded.role;

      if (userRole === Role.ADMIN) {
        try {
          await this.adminRepository.getOneAdmin(decoded.id)
        } catch (err) {
          throw new ForbiddenException('You do not have permission to access this resource');
        }
      }

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
