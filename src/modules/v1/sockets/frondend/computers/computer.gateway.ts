import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AgentGateway } from '../../agent/agent.gateway';
import { Payload } from 'src/comman/types';
import { JWT_SECRET } from 'src/config/env';
import { JwtService } from '@nestjs/jwt';

type FrontendSocket = Omit<Socket, 'data'> & {
  data: Payload
}

@Injectable()
@WebSocketGateway(3006, { cors: { origin: '*' } }) // Frontend uchun socket
export class FrontendGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private commands = new Map<string, FrontendSocket>();

  constructor(
    private jwtService: JwtService,

    @Inject(forwardRef(() => AgentGateway))
    private readonly agentGateway: AgentGateway
  ) { }

  async handleConnection(socket: FrontendSocket) {
    this.tokenVerifying(socket);
  }

  async handleDisconnect(socket: FrontendSocket) {
    console.log(`CMU ${socket.data.role} uzildi id: ${socket.data.id}`);
  }

  @SubscribeMessage('get_active_agents')
  async handleGetActiveAgents(socket: FrontendSocket) {
    const activeAgents = this.agentGateway.activeAgents();
    socket.emit('active_agents', { agents: activeAgents });
  }

  @SubscribeMessage('command')
  async handleCommand(socket: FrontendSocket, payload: { computerId: string; name: string, command: string }) {
    const result = this.agentGateway.sendCommandToAgent(payload.computerId, { command: payload.command, name: payload.name });
    console.log(result);
    if (result === 'buytuq yuborildi') {
      this.commands.set(`${payload.computerId}_${payload.command}_${payload.name}`, socket);
      setTimeout(() => { this.commands.delete(`${payload.computerId}_${payload.command}_${payload.name}`); }, 5 * 60 * 1000);
    }
  }

  @SubscribeMessage('delete_agent')
  async _deleteAgent(socket: FrontendSocket, payload: { computerId: string }) {
    const result = this.agentGateway.deleteAgent(payload.computerId);
    console.log(result);
    if (result === "agnetni o'chirish buytuq yuborildi") {
      this.commands.set(`${payload.computerId}_deleteAgent`, socket);
      setTimeout(() => { this.commands.delete(`${payload.computerId}_delete_agent`); }, 5 * 60 * 1000)
    }
  }

  async responseCommand(computerId: string, data: any) {
    console.log('frontendga yuborish: ', `${computerId}_${data.command}_${data.name}: ${data.status}`);
    this.commands.get(`${computerId}_${data.command}_${data.name}`)?.emit('data', data);
  }

  async deleteAgent(computerId: string, status: string) {
    this.commands.get(`${computerId}_delete_agent`)?.emit('delete_agent', { computerId, status });
  }

  activeOrInactiveAgnet(activity: 'active_agent' | 'inactive_agent', computerId: string) {
    this.server.emit(activity, { computerId });
  }

  private tokenVerifying(socket: FrontendSocket): boolean {
    const token = socket.handshake.headers['authorization']?.split(' ')[1];
    if (!token) {
      socket.disconnect();
      return false;
    }
    try {
      const decoded: Payload = this.jwtService.verify(token, { secret: JWT_SECRET });
      const payload: Payload = {
        id: decoded.id,
        role: decoded.role
      };
      socket.data = payload;
      console.log(`CMU ${decoded.role} ulandi id: ${payload.id}`);
      return true;
    } catch (err) {
      console.log('Token yaroqsiz!');
      socket.disconnect();
      return false;
    }
  }
}
