import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';
import { AgentGateway } from '../../agent/gateway/agent.gateway';

@Injectable()
@WebSocketGateway(3006, { cors: { origin: '*' } }) // Frontend uchun socket
export class FrontendGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly agentGateway: AgentGateway) { } // AgentGateway bilan ishlaymiz

  async handleConnection(socket: Socket) {
    console.log(`✅ Frontend foydalanuvchi ulandi: ${socket.id}`);
  }

  async handleDisconnect(socket: Socket) {
    console.log(`❌ Frontend foydalanuvchi uzildi: ${socket.id}`);
  }

  // **Frontend buyruq jo‘natganda agentga uzatish**
  @SubscribeMessage('delete_app')
  async handleCommand(client: Socket, payload: { computerId: string; appName: string }) {
    const result = this.agentGateway.sendCommandToAgent(payload.computerId, { method: "delete", appName: payload.appName });

    console.log(result);
  }
}
