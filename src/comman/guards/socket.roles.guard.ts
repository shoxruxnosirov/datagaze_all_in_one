import {
    Injectable,
    CanActivate,
    ExecutionContext,
    ForbiddenException,
    UnauthorizedException,
  } from '@nestjs/common';
  import { JwtService } from '@nestjs/jwt';
  import { Socket } from 'socket.io';
  import { JWT_SECRET } from 'src/config/env';
  import { Role } from './roles.enum';
  import { IPayload } from '../types';
  
  @Injectable()
  export class WebSocketRolesGuard implements CanActivate {
    constructor(private readonly jwtService: JwtService) {}
  
    canActivate(context: ExecutionContext): boolean {
      const client: Socket = context.switchToWs().getClient<Socket>();
      const token = client.handshake.auth?.token; // Tokenni clientdan olish
  
      if (!token) {
        throw new ForbiddenException('Token topilmadi');
      }
  
      try {
        const decoded: IPayload = this.jwtService.verify(token, { secret: JWT_SECRET });
        const userRole: Role = decoded.role;
  
        // Faqat `superadmin` va `admin` lar kirishi mumkin
        const allowedRoles: Role[] = [Role.SUPER_ADMIN, Role.ADMIN];
        if (!allowedRoles.includes(userRole)) {
          throw new ForbiddenException("Sizga ruxsat yo'q");
        }
  
        // Foydalanuvchi ma'lumotlarini socketga saqlaymiz
        client.data.user = { id: decoded.id, role: decoded.role };
  
        return true;
      } catch (err) {
        throw new UnauthorizedException('Yaroqsiz token');
      }
    }
  }
  