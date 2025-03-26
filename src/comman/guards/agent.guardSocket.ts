// import {
//   Injectable,
//   CanActivate,
//   ExecutionContext,
//   UnauthorizedException
// } from '@nestjs/common';
// import { JwtService } from '@nestjs/jwt';
// import { JWT_SECRET } from 'src/config/env';
// import { Socket } from 'socket.io';
// import { IPayloadAgent } from '../types';
// import { WsException } from '@nestjs/websockets';

// @Injectable()
// export class AgentGuardSocket implements CanActivate {
//   constructor(private readonly jwtService: JwtService) {}

//   canActivate(context: ExecutionContext): boolean {
//     const client = context.switchToWs().getClient<Socket>(); // WebSocket clientni olish
//     const token = client.handshake.headers['authorization']?.split(' ')[1];

//     if (!token) {
//       throw new WsException('Token topilmadi!');
//     }

//     try {
//       const decoded: IPayloadAgent = this.jwtService.verify(token, { secret: JWT_SECRET });
//       client.data = { agent: decoded }; // Token decoded ma’lumotini client.data ichiga saqlash
//       return true;
//     } catch (err) {
//       throw new WsException('Noto‘g‘ri yoki yaroqsiz token!');
//     }
//   }
// }
