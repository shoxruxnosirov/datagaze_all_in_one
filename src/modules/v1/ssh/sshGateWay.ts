import { OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit, SubscribeMessage, WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Client, Channel, ConnectConfig } from 'ssh2';
import { randomUUID } from 'crypto';

interface Session {
    socket: Client;
    shell: Channel;
}

@WebSocketGateway({ cors: true })
export class SshGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;
    private sessions = new Map<string, Session>();
    // private socketAndSessions = new Map<Socket, Session>();

    async handleConnection(socket: Socket) {
        // const adminId: string = socket.handshake.headers['adminId'].toString();
        console.log(`SocketClient ulandi: ${socket.id}`);
    }

    async handleDisconnect(socket: Socket) {
        console.log(`Client uzildi: ${socket.id}`);

        // let sessionId: string = '';
        // for (const [key, session] of this.sessions) {
        //     if (session.socket === socket) { 
        //         sessionId = key;;
        //         break; 
        //     }
        // }
    }

    @SubscribeMessage('ssh_connect')
    handleConnect(socket: Socket, { host, port, username, password, privateKey }) {
        const sessionId = randomUUID(); // Unikal ID yaratish
        const conn = new Client();

        conn.on('ready', () => {
            conn.shell((err: Error, stream: Channel) => {
                if (err) {
                    conn.end();
                    socket.emit('ssh_error', { sessionId, message: err.message });
                } else {
                    this.sessions.set(sessionId, { socket, shell: stream });

                    stream.on('data', (data: Buffer) => {
                        socket.emit('ssh_output', { sessionId, output: data.toString() });
                    });

                    stream.on('error', (err: Error) => {
                        socket.emit('ssh_error', { sessionId, message: 'Shell xatoligi: ' + err.message });
                    });

                    stream.on('close', () => {
                        this.sessions.delete(sessionId);
                        socket.emit('ssh_disconnected', { sessionId, message: 'Terminal yopildi' });
                    });

                    socket.emit('ssh_opened', { sessionId, message: 'Terminal ochildi' });
                }
            });
        });

        conn.connect({ host, port, username, password, privateKey });
    }


    @SubscribeMessage('ssh_command')
    handleCommand(socket: Socket, { sessionId, command }) {
        const session = this.sessions.get(sessionId);
        if (session) {
            console.log("comanda bajarish qismi ishlamoqda !!!");
            session.shell.write(`${command}\n`);
        } else {
            socket.emit('ssh_error', { sessionId, message: 'SSH sessiya topilmadi' });
        }
    }

    // 🔹 Clientdan "ssh_disconnect" eventi kelganda SSH ulanishni yopamiz
    @SubscribeMessage('ssh_disconnect')
    handleSSHDisconnect(socket: Socket, sessionId: string ) {
        const sshConnection: Client = this.sessions.get(sessionId);
        if (sshConnection) {
            sshConnection.ssh.end();
            //   this.clientAndSshConnect.delete(socket);
            //   socket.emit('ssh_disconnected', { message: 'SSH sessiya yopildi' });
            console.log(`SSH uzildi: ${sshConnection.id}`);
        }
    }
}
