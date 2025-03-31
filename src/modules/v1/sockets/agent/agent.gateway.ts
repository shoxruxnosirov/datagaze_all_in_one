import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
} from '@nestjs/websockets';

import { forwardRef, Inject } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AgentSocket, PayloadAgent } from 'src/comman/types';
import { AGENT_TOKEN_SECRET } from 'src/config/env';
import { FrontendGateway } from '../frondend/computers/computer.gateway';

@WebSocketGateway(3005, { cors: { origin: '*' } })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  // @WebSocketServer() server: Server;

  constructor(
    private jwtService: JwtService,

    @Inject(forwardRef(() => FrontendGateway))
    private frondendSocket: FrontendGateway,
  ) {}

  private computerIdAndSocket = new Map<string, AgentSocket>();

  handleConnection(socket: AgentSocket) {
    if (this.tokenVerifying(socket)) {
      this.frondendSocket.activeOrInactiveAgnet('active_agent', socket.data.computerId);
    }
  }

  handleDisconnect(socket: AgentSocket) {
    console.log(`Agent computer uzuldi computerId: ${socket.data.computerId}`);
    this.frondendSocket.activeOrInactiveAgnet('inactive_agent', socket.data.computerId);
  }

  @SubscribeMessage('response')
  deletedApp(socket: AgentSocket, data: { command: string; name: string; status: string }) {
    this.frondendSocket.responseCommand(socket.data.computerId, data);
  }

  @SubscribeMessage('delete_agent')
  _deleteAgent(socket: AgentSocket, data: { status: string, message: string }) {
    console.log('agent uchirilidi: ', data);
    this.frondendSocket.deleteAgent(socket.data.computerId, data);
  }

  sendCommandToAgent(computerId: string, commandData: { command: string; name: string }): string {
    const socket = this.computerIdAndSocket.get(computerId);
    if (socket) {
      socket.emit('command', commandData);
      return `buytuq yuborildi`;
    } else {
      return 'computer tarmoqda emas. keyinroq';
      // keyinroq ulanganda bu buyruqni yuborish uchun saqlab qolish kerak
    }
  }

  deleteAgent(computerId: string) {
    const socket = this.computerIdAndSocket.get(computerId);
    if (socket) {
      socket.emit('delete_agent');
      return `agnetni o'chirish buytuq yuborildi`;
    } else {
      return 'computer tarmoqda emas. keyinroq';
      // keyinroq ulanganda bu buyruqni yuborish uchun saqlab qolish kerak
    }
  }

  activeAgents(): string[] {
    console.log('computer IDs:', Array.from(this.computerIdAndSocket.keys()));
    return Array.from(this.computerIdAndSocket.keys());
  }

  private tokenVerifying(socket: AgentSocket): boolean {
    const token = socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
      socket.disconnect();
      return false;
    }
    try {
      console.log('tokenVerifying dan token: ', token);
      const decoded: PayloadAgent = this.jwtService.verify(token, { secret: AGENT_TOKEN_SECRET });
      const payload: PayloadAgent = {
        computerId: decoded.computerId,
        key: decoded.key,
      };
      this.computerIdAndSocket.set(payload.computerId, socket);
      socket.data = payload;
      console.log(`Agent computer ulandi computerId: ${payload.computerId}`);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(`Token yaroqsiz! va computergateway: err.message: ${err.message}`);
      } else {
        console.log(`Token yaroqsiz! va computergateway: err.message: ${err}`);
      }
      socket.disconnect();
      return false;
    }
  }
}
