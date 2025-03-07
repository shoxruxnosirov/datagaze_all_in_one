import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    // OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Client, Channel } from 'ssh2';
import { randomUUID } from 'crypto';
import * as pty from 'node-pty';
import { SshGatewayConnection } from './ssh.gatewayService';
import { ConnectDto } from './dto/dtos';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { UseGuards } from '@nestjs/common';
import { WebSocketRolesGuard } from 'src/comman/guards/socket.roles.guard';
import { IServer } from 'src/comman/types';

interface Session {
    socket: Socket;
    shell: Channel | null;
    ptyTerm: pty.IPty | null;
}

@WebSocketGateway({ cors: true })
export class SshGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private sshGatewayConn: SshGatewayConnection,
        private procuctRepository: ProductRepository
    ) { }

    private sessions = new Map<string, Session>();
    // private socketAndSessions = new Map<Socket, Session>();

    @UseGuards(WebSocketRolesGuard)
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

    @SubscribeMessage('open_own_terminal')
    openTerminal(socket: Socket) {
        const sessionId = randomUUID(); // Unikal ID yaratish
        this.connectBackEndTerm(socket, sessionId);
        socket.emit('open_terminal', { sessionId });
    }

    @SubscribeMessage('deploy_product')
    async deployingProject(
        socket: Socket,
        config: { productId: string; serverCredentials: ConnectDto },
    ) {
        const sessionId = randomUUID(); // Unikal ID yaratish
        socket.emit('open_terminal', { sessionId });
        this.sessions.set(sessionId, { socket, shell: null, ptyTerm: null });
        const product = await this.procuctRepository.getProduct(config.productId);

        const conn = new Client();

        // console.log('config: ', config);
        await this.sshGatewayConn.deployProject(
            {
                localProjectPath: product.fileUrl,
                serverCredentials: config.serverCredentials
            },
            socket,
            conn,
            sessionId
        );

        this.procuctRepository.addServerAndUpdateProduct(config.serverCredentials, config.productId);
        this.connectShell(socket, conn, sessionId);
    }

    @SubscribeMessage('ssh_connect')
    async handleConnect(socket: Socket, data: {productId: string}) {

        const server: IServer = await this.procuctRepository.getServerCredentials(data.productId);
        const sessionId = randomUUID(); 
        const conn = new Client();

        conn.on('ready', () => {
            this.connectShell(socket, conn, sessionId);
        });
        conn.connect({
            host: server.host,
            port: server.port,
            username: server.username,
            password: server.password,
            privateKey: server.privateKey,
        } as ConnectDto);
    }

    @SubscribeMessage('command')
    handleCommand(socket: Socket, { sessionId, command }) {
        const session = this.sessions.get(sessionId);
        if (session) {
            // console.log(`${sessionId}: ${command}`);
            if (session.shell) {
                session.shell.write(`${command}\n`);
            } else if (session.ptyTerm) {
                session.ptyTerm.write(`${command}\n`);
            } else {
                socket.emit('error', { sessionId, message: 'SSH sessiya topilmadi.....' });
            }
        } else {
            socket.emit('error', { sessionId, message: 'SSH sessiya topilmadi' });
        }
    }

    // 🔹 Clientdan "ssh_disconnect" eventi kelganda SSH ulanishni yopamiz
    @SubscribeMessage('close_terminal')
    handleSSHDisconnect(socket: Socket, data: {sessionId: string}) {
        console.log('disconnect: ', data);
        const session: Session | undefined = this.sessions.get(data.sessionId);
        console.log('close session: ', session);
        if (session) {
            session.shell?.end();
            session.ptyTerm?.kill();
            socket.emit('closed_terminal', { sessionId: data.sessionId });
            this.sessions.delete(data.sessionId);
            socket.disconnect();
            console.log(`SSH uzildi: ${socket.id}`);
        }
    }

    private connectBackEndTerm(socket: Socket, sessionId: string) {
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        const term = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 24,
            cwd: process.env.HOME,
            env: process.env,
        });


        term.onData((data) => {
            console.log(data.toString());
            socket.emit('data', { sessionId, output: data.toString() });
        });

        term.onExit(({ exitCode, signal }) => {
            console.log(`Terminal exited with code: ${exitCode}, signal: ${signal}`);
            socket.emit('closed_terminal', { sessionId, exitCode, signal });
            this.sessions.delete(sessionId);

            socket.disconnect();
        });

        this.sessions.set(sessionId, { socket, shell: null, ptyTerm: term });
    }

    private connectShell(socket: Socket, conn: Client, sessionId: string) {
        conn.shell((err: Error, stream: Channel) => {
            if (err) {
                conn.end();
                socket.emit('error', { sessionId, message: err.message });
            } else {
                const session: Session | undefined = this.sessions.get(sessionId);
                if (session) {
                    session.shell = stream;
                } else {
                    socket.emit('open_terminal', { sessionId });
                    this.sessions.set(sessionId, { socket, shell: stream, ptyTerm: null });
                }

                stream.on('data', (data: Buffer) => {
                    console.log(data.toString());
                    socket.emit('data', { sessionId, output: data.toString() });
                });

                stream.on('error', (err: Error) => {
                    socket.emit('error', { sessionId, message: err.message });
                });

                stream.on('close', () => {
                    // this.sessions.delete(sessionId);
                    socket.emit('alert', { sessionId, message: 'ssh Terminal yopildi' });
                    // const session: Session | undefined = this.sessions.get(sessionId);
                    // if(session) {
                    conn.end();
                    this.connectBackEndTerm(socket, sessionId);
                    // }
                });

                socket.emit('alert', { sessionId, message: 'ssh Terminal ochildi' });
            }
        });
    }
}
