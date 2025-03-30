import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    // OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    // WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Client, Channel } from 'ssh2';
import { randomUUID } from 'crypto';
import * as pty from 'node-pty';
import { SshGatewayConnection } from './ssh.gatewayService';
import { ConnectDto } from '../../../ssh/dto/dtos';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { FrontendSocketTerminal, Payload, Role, Server as ServerCredential, TerminalSession } from 'src/comman/types';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/config/env';

// type FrontendSocketTerminal = Omit<Socket, 'data'> & {
//     data: { sessions: Set<string> }
// }

@WebSocketGateway({ cors: true })
export class SshGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private sshGatewayConn: SshGatewayConnection,
        private productRepository: ProductRepository,
        private jwtService: JwtService,
    ) { }

    // private sessions = new Map<string, TerminalSession>();

    async handleConnection(socket: FrontendSocketTerminal) {
        this.tokenVerifying(socket);
        // console.log(`SocketClient ulandi: ${socket.id}`);
    }

    async handleDisconnect(socket: FrontendSocketTerminal) {
        console.log(`SocketClient uzildi: ${socket.id}`);

        for (const [key, session] of socket.data.sessions) {
            session.shell?.end();
            session.ptyTerm?.kill();
        }
        socket.data.sessions.clear();
    }

    @SubscribeMessage('open_own_terminal')
    openTerminal(socket: FrontendSocketTerminal) {
        const sessionId = randomUUID(); // Unikal ID yaratish
        const session = {
            socket,
            shell: null,
            ptyTerm: null,
            // skipFunc: {
            //     skipSlashNs: null,
            //     skipData: null
            // }
        }
        this.connectBackEndTerm(socket, sessionId, session);
        // this.sessions.set(sessionId, session);
        socket.data.sessions.set(sessionId, session);
        socket.emit('open_terminal', { sessionId });
    }

    @SubscribeMessage('deploy_product')
    async deployingProject(
        socket: FrontendSocketTerminal,
        config: { productId: string; serverCredentials: ConnectDto },
    ) {
        // config.serverCredentials.readyTimeout =  20000;
        const { serverFilePath, installScript } = await this.productRepository.getProductForDeploy(config.productId);

        const sessionId = randomUUID();
        const conn: Client = new Client();
        const session: TerminalSession = {
            socket,
            shell: {
                write() { },
                end() {
                    conn.end();
                    console.log(" hali end tayinlanmagan ");
                },
            },
            ptyTerm: null
        };
        // this.sessions.set(sessionId, session);
        socket.data.sessions.set(sessionId, session);
        try {
            await this.sshGatewayConn.deployProject(
                {
                    localProjectPath: serverFilePath,
                    serverCredentials: config.serverCredentials
                },
                {
                    socket,
                    conn,
                    sessionId,
                    session
                },
                installScript
            );


            //delete config.serverCredentials.readyTimeout =  20000;
            await this.productRepository.addServerAndUpdateProduct(config.serverCredentials, config.productId);

            this.connectShell(socket, conn, sessionId, installScript);

        } catch (error) {
            // if(error.message.includes())
            socket.emit('error', { sessionId, message: error.message });
            console.log('gataway 140 error ', error);
            return;
        }

    }

    @SubscribeMessage('ssh_connect')
    async handleConnect(socket: FrontendSocketTerminal, data: { productId: string }) {

        console.log('serve Credential: ssh_connect');
        const server: ServerCredential = await this.productRepository.getServerCredentials(data.productId);
        const sessionId = randomUUID();
        const conn = new Client();
        console.log('server Credential: ', server);

        conn.on('ready', () => {
            this.connectShell(socket, conn, sessionId);
            socket.emit('open_terminal', { sessionId });
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
    handleCommand(socket: FrontendSocketTerminal, { sessionId, command }) {
        const session = socket.data.sessions.get(sessionId);
        if (session) {
            if (session.shell) {
                // session.skipFunc.skipSlashNs?.(0);
                // session.skipFunc.skipData?.(0);
                session.shell.write(command);
                // session.shell.write(`${command} ; echo -e ${this.prompt}\n`);
            } else if (session.ptyTerm) {
                session.ptyTerm.write(command);
            } else {
                socket.emit('error', { sessionId, message: 'terminal topilmadi...' });
            }
        } else {
            socket.emit('error', { sessionId, message: 'SSH sessiya topilmadi' });
        }
    }

    @SubscribeMessage('close_terminal')
    handleSSHDisconnect(socket: FrontendSocketTerminal, data: { sessionId: string }) {
        const session: TerminalSession | undefined = socket.data.sessions.get(data.sessionId);
        if (session) {
            session.shell?.end();
            session.ptyTerm?.kill();
            socket.emit('closed_terminal', { sessionId: data.sessionId });
            socket.data.sessions.delete(data.sessionId);
            // socket.disconnect();
            console.log(`terminal yopildi: ${data.sessionId}`);
        }
    }

    private connectBackEndTerm(socket: FrontendSocketTerminal, sessionId: string, session: TerminalSession) {
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        const term = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 80,
            rows: 20,
            cwd: process.env.HOME,
            env: process.env,
        });


        term.onData((data) => {
            // console.log(data.toString());
            socket.emit('data', { sessionId, output: data.toString() });
        });

        term.onExit(({ exitCode, signal }) => {
            console.log(`Terminal exited with code: ${exitCode}, signal: ${signal}`);
            socket.emit('closed_terminal', { sessionId, exitCode, signal });
            term?.kill();
            socket.data.sessions.delete(sessionId);
        });

        session.ptyTerm = term;

        // this.sessions.set(sessionId, {
        //     socket,
        //     shell: null,
        //     ptyTerm: term,
        //     skipFunc: {
        //         skipSlashNs: null,
        //         skipData: null
        //     }
        // });//, clearLine: null });
    }

    private connectShell(socket: FrontendSocketTerminal, conn: Client, sessionId: string, installScript?: string) {
        conn.shell(
            {
                term: 'xterm',
                cols: 80,
                rows: 20,
                echo: false,
                pty: false,
                env: { LANG: 'en_US.UTF-8' },
            },
            (err: Error, stream: Channel) => {
                if (err) {
                    conn.end();
                    socket.emit('error', { sessionId, message: err.message });
                } else {
                    // if(installScript) {
                    //     console.log('insScr: ', installScript);
                    //     stream.write(installScript + '\r\n');
                    // }

                    // let skipSlashNsCount = 0;
                    // let skipDataCount = 0;

                    const session = {
                        socket,
                        shell: stream,
                        ptyTerm: null,
                        // skipFunc: {
                        //     skipSlashNs: (value:number) => { skipSlashNsCount = value; },
                        //     skipData: (value: number) => { skipDataCount = value; }
                        // }
                    }

                    // this.sessions.set(sessionId, session);
                    socket.data.sessions.set(sessionId, session);

                    // function _skipData(sessionId: string, output: string) {
                    //     if (skipDataCount > 0) {
                    //         skipDataCount--;
                    //         return;
                    //     } else {
                    //         console.log(output);
                    //         socket.emit('data', { sessionId, output });
                    //     }
                    // }

                    stream.on('data', (data: Buffer) => {
                        const output = data.toString();
                        socket.emit('data', { sessionId, output });
                        // if (skipSlashNsCount > 0) {
                        //     if (output.includes('\n')) {
                        //         const resposes = output.split('\n');
                        //         if (resposes.length > skipSlashNsCount) {
                        //             const respose = resposes.slice(skipSlashNsCount).join('\n');
                        //             skipSlashNsCount = 0;
                        //             _skipData(sessionId, respose);
                        //         } else {
                        //             skipSlashNsCount -= (resposes.length - 1);
                        //         }
                        //         // const lastIndex = output.lastIndexOf('\n');
                        //         // socket.emit('data', { sessionId, output: `${_line}${output.slice(0, lastIndex)}` });
                        //         // console.log(`${_line}${output.slice(0, lastIndex)}`); 
                        //         // _line = output.slice(lastIndex + 1);   
                        //     }
                        // } else {
                        //     _skipData(sessionId, output);
                        //     // socket.emit('data', { sessionId, output });
                        // }
                    });

                    stream.on('error', (err: Error) => {
                        socket.emit('error', { sessionId, message: err.message });
                    });

                    stream.on('close', () => {
                        // this.sessions.delete(sessionId);
                        session.shell = null;
                        socket.emit('alert', { sessionId, message: 'ssh Terminal yopildi' });
                        conn.end();
                        this.connectBackEndTerm(socket, sessionId, session);
                    });

                    socket.emit('alert', { sessionId, message: 'ssh Terminal ochildi' });
                }
            }
        );
    }

    private tokenVerifying(socket: FrontendSocketTerminal): boolean {
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
            if (!(payload.role === Role.SUPER_ADMIN || payload.role === Role.ADMIN)) {
                console.log('Ruxsat yo\'q!');
                socket.disconnect();
                return false;
            }
            socket.data = { sessions: new Map() };
            console.log(`T ${decoded.role} ulandi id: ${payload.id}`);
            return true;
        } catch (err) {
            console.log('Token yaroqsiz!');
            socket.disconnect();
            return false;
        }
    }
}
