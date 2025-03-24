import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { AgentGateway } from '../../agent/gateway/agent.gateway';
// import { StdioNull } from 'child_process';

@Injectable()
@WebSocketGateway(3006, { cors: { origin: '*' } }) // Frontend uchun socket
export class FrontendGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private commands = new Map<string, Socket>()

  constructor(
    @Inject(forwardRef(() => AgentGateway))
    private readonly agentGateway: AgentGateway

  ) { } // AgentGateway bilan ishlaymiz

  async handleConnection(socket: Socket) {
    console.log(`✅ Frontend foydalanuvchi ulandi: ${socket.id}`);
  }

  async handleDisconnect(socket: Socket) {
    console.log(`❌ Frontend foydalanuvchi uzildi: ${socket.id}`);
  }

  // **Frontend buyruq jo‘natganda agentga uzatish**
  @SubscribeMessage('command')
  async handleCommand(client: Socket, payload: { computerId: string; name: string, command:string }) {
    const result = this.agentGateway.sendCommandToAgent(payload.computerId, { command: payload.command, name: payload.name });
    this.commands.set(`${payload.computerId}_${payload.command}_${payload.name}`, client);
    console.log(result);
  }

  async responseCommand(computerId:string, data: any) {
    console.log('frontendga yuborish: ', `${computerId}_${data.command}_${data.name}: ${data.status}` );
    this.commands.get(`${computerId}_${data.command}_${data.name}`)?.emit('data', data);
  }

  // @SubscribeMessage('delete_app')
  // async handleCommand(client: Socket, payload: { computerId: string; appName: string }) {
  //   const result = this.agentGateway.sendCommandToAgent(payload.computerId, { method: "delete", appName: payload.appName });

  //   console.log(result);
  // }
}
