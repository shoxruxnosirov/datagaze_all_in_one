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

@Injectable()
@WebSocketGateway(3006, { cors: { origin: '*' } }) // Frontend uchun socket
export class FrontendGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private commands = new Map<string, Socket>();

  constructor(
    @Inject(forwardRef(() => AgentGateway))
    private readonly agentGateway: AgentGateway

  ) { } 

  async handleConnection(socket: Socket) {
    console.log(`✅ Frontend foydalanuvchi ulandi: ${socket.id}`);
  }

  async handleDisconnect(socket: Socket) {
    console.log(`❌ Frontend foydalanuvchi uzildi: ${socket.id}`);
  }

  // **Frontend buyruq jo‘natganda agentga uzatish**
  @SubscribeMessage('command')
  async handleCommand(client: Socket, payload: { computerId: string; name: string, command: string }) {
    const result = this.agentGateway.sendCommandToAgent(payload.computerId, { command: payload.command, name: payload.name });
    console.log(result);
    if(result === 'buytuq yuborildi') {
      this.commands.set(`${payload.computerId}_${payload.command}_${payload.name}`, client);
      setTimeout(() => { this.commands.delete(`${payload.computerId}_${payload.command}_${payload.name}`); }, 5 * 60 * 1000)
    }
  }

  @SubscribeMessage('deleteAgent')
  async _deleteAgent(client: Socket, payload: { computerId: string }) {
    const result = this.agentGateway.deleteAgent(payload.computerId);
    console.log(result);
    if(result === "agnetni o'chirish buytuq yuborildi") {
      this.commands.set(`${payload.computerId}_deleteAgent`, client);
      setTimeout(() => { this.commands.delete(`${payload.computerId}_deleteAgent`); }, 5 * 60 * 1000)
    }
  }

  async responseCommand(computerId: string, data: any) {
    console.log('frontendga yuborish: ', `${computerId}_${data.command}_${data.name}: ${data.status}`);
    this.commands.get(`${computerId}_${data.command}_${data.name}`)?.emit('data', data);
  }

  async deleteAgent(computerId: string, status: string) {
    this.commands.get(`${computerId}_deleteAgent`)?.emit('deleteAgent', { computerId, status });
  }

  // @SubscribeMessage('delete_app')
  // async handleCommand(client: Socket, payload: { computerId: string; appName: string }) {
  //   const result = this.agentGateway.sendCommandToAgent(payload.computerId, { method: "delete", appName: payload.appName });

  //   console.log(result);
  // }
}
