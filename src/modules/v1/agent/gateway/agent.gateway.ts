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
import { JWT_SECRET } from 'src/config/env';
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
            const decoded: IPayloadAgent = this.jwtService.verify(token, { secret: JWT_SECRET });
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

        for (const [key, _socket] of this.computerIdAndSocket) {
            if (_socket === socket) {
                this.computerIdAndSocket.delete(key);
                console.log('computerIdAndSocket.size: ', this.computerIdAndSocket.size);
                break;
            }
        }
    }


    @SubscribeMessage('deleted_app')
    async deletedApp(
        socket: Socket,
        data: { command: string; name: string, status: string }
    ) {
        // console.log("delete buyrug'idan qaytgan data:", data);
        for (const [key, _socket] of this.computerIdAndSocket) {
            if (_socket === socket) {

                this.frondendSocket.responseCommand(key, 'delete_app', data.name, data)
                console.log("delete buyrug'idan qaytgan data:", data);
                break;
            }
        }
    }

    @SubscribeMessage('installed_app')
    async installedApp(
        socket: Socket,
        data: { command: string; name: string, status: string }
    ) {
        for (const [key, _socket] of this.computerIdAndSocket) {
            if (_socket === socket) {
                this.frondendSocket.responseCommand(key, 'install_app', data.name, data)
                console.log("install buyrug'idan qaytgan data:", data);
                break;
            }
        }
    }


    @SubscribeMessage('update_app')
    async handleConnect(socket: Socket, data: { productId: string }) {
    }

    sendCommandToAgent(computerId: string, commandData: { method: string; appName: string }): string {
        const socket = this.computerIdAndSocket.get(computerId);
        if (socket) {
            if (commandData.method === 'delete_app') {
                socket.emit('delete_app', {
                    name: commandData.appName
                });
                return `buytuq yuborildi`;
            } else if (commandData.method === 'install_app') {
                socket.emit('install_app', {
                    name: commandData.appName
                });
                return `buytuq yuborildi`;
            } else {
                return "boshqa method";
            }
        } else {
            return 'computer tarmoqda emas. keyinroq';
            // keyinroq ulanganda bu buyruqni yuborish uchun saqlab qolish kerak
        }
        // const agentSocket = this.agents.get(agentId);
        // if (agentSocket) {
        //     agentSocket.emit('execute', { command });
        //     return true;
        // }
        // return false;
    }

}
