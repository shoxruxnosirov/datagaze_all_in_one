import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    // OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';

import { Server, Socket } from 'socket.io';
import { forwardRef, Inject, UseGuards } from '@nestjs/common';
// import { WebSocketRolesGuard } from 'src/comman/guards/socket.roles.guard';
import { JwtService } from '@nestjs/jwt';
import { IPayloadAgent } from 'src/comman/types';
import { AGENT_TOKEN_SECRET, JWT_SECRET } from 'src/config/env';
import { WsException } from '@nestjs/websockets';
import { AgentGuard } from 'src/comman/guards/agent.guard';
import { FrontendGateway } from '../../computer/gateway/computer.gateway';


@WebSocketGateway(3005, { cors: { origin: '*' } })
export class AgentGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private jwtService: JwtService,

        @Inject(forwardRef(() => FrontendGateway))
        private frondendSocket: FrontendGateway
    ) { }

    private computerIdAndSocket = new Map<string, Socket>();
    // private socketAndSession = new Map<Socket, Session>

    @UseGuards(AgentGuard)
    async handleConnection(socket: Socket) {

        const token = socket.handshake.headers['authorization']?.split(' ')[1];
        console.log("token: ", token);

        if (!token) {
            socket.emit('data', {
                messsage: 'Token yo‘q, uzur chaqarib yuborildingiz!'
            });
            console.log('Token yo‘q, uzur chaqarib yuborildingiz!');
            socket.disconnect();
            return;
        }

        try {
            const decoded: IPayloadAgent = this.jwtService.verify(token, { secret: AGENT_TOKEN_SECRET });
            const payload: IPayloadAgent = {
                computerId: decoded.computerId,
                key: decoded.key,
            };

            this.computerIdAndSocket.set(payload.computerId, socket);

            socket.emit('data', {
                message: 'muvofaqiyatli ulandingiz!!!'
            });
            console.log(`SocketClient ulandi: ${socket.id}`);

        } catch (err) {
            // throw new WsException('Yaroqsiz token');
            socket.emit('data', {
                messsage: 'Token yaroqsiz, uzur chaqarib yuborildingiz!'
            });

            console.log('Token yaroqsiz!');

            socket.disconnect();
        }
    }

    async handleDisconnect(socket: Socket) {
        console.log(`SocketClient uzildi: ${socket.id}`);

        for (const [computerId, _socket] of this.computerIdAndSocket) {
            if (_socket === socket) {
                this.computerIdAndSocket.delete(computerId);
                console.log('computerIdAndSocket.size: ', this.computerIdAndSocket.size);
                break;
            }
        }
    }


    @SubscribeMessage('response')
    async deletedApp(
        socket: Socket,
        data: { command: string; name: string, status: string }
    ) {
        // console.log("delete buyrug'idan qaytgan data:", data);
        for (const [computerId, _socket] of this.computerIdAndSocket) {
            if (_socket === socket) {

                this.frondendSocket.responseCommand(computerId, data)
                // console.log("delete buyrug'idan qaytgan data:", data);
                break;
            }
        }
    }

    @SubscribeMessage('delete_agent')
    async _deleteAgent(
        socket: Socket,
        data: { status: string }
    ) {
        // console.log("delete buyrug'idan qaytgan data:", data);
        for (const [computerId, _socket] of this.computerIdAndSocket) {
            if (_socket === socket) {

                this.frondendSocket.deleteAgent(computerId, data.status)
                break;
            }
        }
    }


    sendCommandToAgent(computerId: string, commandData: { command: string; name: string }): string {
        const socket = this.computerIdAndSocket.get(computerId);
        if (socket) {
            socket.emit('command', commandData);
            // console.log('coputerId: ', computerId, '  commandData: ', commandData);
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
            // console.log('coputerId: ', computerId, '  commandData: ', commandData);
            return `agnetni o'chirish buytuq yuborildi`;
        } else {
            return 'computer tarmoqda emas. keyinroq';
            // keyinroq ulanganda bu buyruqni yuborish uchun saqlab qolish kerak
        }
    }

}
