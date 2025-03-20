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
  async handleCommand(client: Socket, payload: { computerId: string; appName: string, method:string }) {
    const result = this.agentGateway.sendCommandToAgent(payload.computerId, { method: payload.method, appName: payload.appName });
    this.commands.set(`${payload.computerId}_${payload.method}_${payload.appName}`, client);
    console.log(result);
  }

  async responseCommand(computerId:string, method: string, appName: string, data: any) {
    console.log('frontendga yuborish: ', `${computerId}_${method}_${appName}` );
    this.commands.get(`${computerId}_${method}_${appName}`)?.emit('data', data);
  }

  // @SubscribeMessage('delete_app')
  // async handleCommand(client: Socket, payload: { computerId: string; appName: string }) {
  //   const result = this.agentGateway.sendCommandToAgent(payload.computerId, { method: "delete", appName: payload.appName });

  //   console.log(result);
  // }
}
