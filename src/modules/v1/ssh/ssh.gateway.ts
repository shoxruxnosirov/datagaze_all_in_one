import {
    OnGatewayConnection,
    OnGatewayDisconnect,
    // OnGatewayInit,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Client, Channel, ConnectConfig, SFTPWrapper, ClientChannel } from 'ssh2';
import { randomUUID } from 'crypto';
import * as pty from 'node-pty';
import { SshGatewayConnection } from './ssh.gatewayService';
import { ConnectDto } from './dto/dtos';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { UseGuards } from '@nestjs/common';
import { WebSocketRolesGuard } from 'src/comman/guards/socket.roles.guard';
import { IServer } from 'src/comman/types';
import { skip } from 'rxjs';

const filePath = 'example.txt';

interface Session {
    socket: Socket;
    shell: Channel | null;
    ptyTerm: pty.IPty | null;
    skipFunc: {
        skipSlashNs: ((value: number) => void) | null
        skipData: ((value: number) => void) | null
    };
    // conn?: Client | null;
}

@WebSocketGateway({ cors: true })
export class SshGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer() server: Server;

    constructor(
        private sshGatewayConn: SshGatewayConnection,
        private procuctRepository: ProductRepository
    ) { }

    private sessions = new Map<string, Session>();

    // private prompt = `$USER@$HOSTNAME:$(echo $PWD | sed "s|^$HOME|~|")$ `;
    // private prompt = `"\x1b[A\x1b[K\x1b[01;32m$USER@$HOSTNAME\x1b[00m:\x1b[01;34m$(echo $PWD | sed "s|^$HOME|~|")\x1b[00m\x1b[37m$\x1b[00m "`
    // private prompt = "\x1b[A\x1b[K\x1b[01;32m${USER}@${HOSTNAME}\x1b[00m:\x1b[01;34m$(echo ${PWD} | sed 's|^${HOME}|~|')\x1b[00m \x1b[37m$\x1b[00m ";
    // private prompt = "\\x1b[A\\x1b[K\\x1b[01;32m$(whoami)@$(hostname)\\x1b[00m:\\x1b[01;34m$(pwd | sed 's|^$HOME|~|')\\x1b[00m \\x1b[37m$\\x1b[00m ";
    // private prompt = "\\033[01;32m$USER@$(hostname -s)\\033[00m:\\033[01;34m$(echo $PWD | sed \"s|^$HOME|~|\")\\033[00m$ "
    // private prompt = `"\x1b[A\x1b[K\x1b[01;32m$USER@$HOSTNAME\x1b[00m:\x1b[01;34m$(echo $PWD | sed "s|^$HOME|~|")\x1b[00m\x1b[37m$\x1b[00m "`
    // private prompt = `"\\x1b[A\\x1b[K\\x1b[01;32m$USER@$HOSTNAME\\x1b[00m:\\x1b[01;34m$(echo $PWD | sed 's|^$HOME|~|')\\x1b[00m\\x1b[37m$\\x1b[00m "`;
    // private prompt = `"\\x1b[A\\x1b[K\\x1b[01;32m$USER@$HOSTNAME\\x1b[00m:\\x1b[01;34m$(echo $PWD | sed "s|^$(eval echo ~$USER)|~|")\\x1b[00m\\x1b[37m$\\x1b[00m"`;


    @UseGuards(WebSocketRolesGuard)
    async handleConnection(socket: Socket) {
        // const adminId: string = socket.handshake.headers['adminId'].toString();
        console.log(`SocketClient ulandi: ${socket.id}`);
    }

    async handleDisconnect(socket: Socket) {
        console.log(`Client uzildi: ${socket.id}`);

        // for (const [key, session] of this.sessions) {
        //     if (session.socket === socket) {
        //         session.shell?.end();
        //         session.ptyTerm?.kill();
        //         session.conn?.end();
        //         this.sessions.delete(key);
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
        const { fileUrl } = await this.procuctRepository.getProductForDeploy(config.productId);
        const conn: Client = new Client();
        await this.sshGatewayConn.deployProject(
            {
                localProjectPath: fileUrl,
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
    async handleConnect(socket: Socket, data: { productId: string }) {

        const server: IServer = await this.procuctRepository.getServerCredentials(data.productId);
        const sessionId = randomUUID();
        const conn = new Client();

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
    handleCommand(socket: Socket, { sessionId, command }) {
        const session = this.sessions.get(sessionId);
        command = command.split('\n').join(' && ');
        if (session) {
            // console.log(`${sessionId}: ${command}`);
            if (session.shell) {
                session.skipFunc.skipSlashNs?.(1);
                session.skipFunc.skipData?.(0);
                session.shell.write(`${command}\n`);
                // session.shell.write(`${command} ; echo -e ${this.prompt}\n`);
            } else if (session.ptyTerm) {
                session.ptyTerm.write(`${command}\n`);
            } else {
                socket.emit('error', { sessionId, message: 'terminal topilmadi...' });
            }
        } else {
            socket.emit('error', { sessionId, message: 'SSH sessiya topilmadi' });
        }
    }

    @SubscribeMessage('close_terminal')
    handleSSHDisconnect(socket: Socket, data: { sessionId: string }) {
        const session: Session | undefined = this.sessions.get(data.sessionId);
        if (session) {
            session.shell?.end();
            session.ptyTerm?.kill();
            socket.emit('closed_terminal', { sessionId: data.sessionId });
            this.sessions.delete(data.sessionId);
            // socket.disconnect();
            console.log(`terminal yopildi: ${data.sessionId}`);
        }
    }

    private connectBackEndTerm(socket: Socket, sessionId: string) {
        const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
        const term = pty.spawn(shell, [], {
            name: 'xterm-color',
            cols: 100,
            rows: 30,
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

            // socket.disconnect();
        });

        this.sessions.set(sessionId, {
            socket,
            shell: null,
            ptyTerm: term,
            skipFunc: {
                skipSlashNs: null,
                skipData: null
            }
        });//, clearLine: null });
    }


    @SubscribeMessage('auto_complete')
    autoComplateCommand(socket: Socket, { sessionId, command }) {
        const session = this.sessions.get(sessionId);
        // command = command.split('\n').join(' && ');
        if (session) {
            // console.log(`${sessionId}: ${command}`);
            if (session.shell) {
                session.skipFunc.skipSlashNs?.(0);
                session.skipFunc.skipData?.(2);
                session.shell.write(`${command}`);
                // session.skipFunc.skipSlashNs?.(0);
                // session.shell.write(`${command} ; echo -e ${this.prompt}\n`);
            } else if (session.ptyTerm) {
                session.ptyTerm.write(`${command}`);
            } else {
                socket.emit('error', { sessionId, message: 'terminal topilmadi...' });
            }
        } else {
            socket.emit('error', { sessionId, message: 'SSH sessiya topilmadi' });
        }
    }
    // @SubscribeMessage('auto_complete')
    // autoComplateCommand(socket: Socket, data: { sessionId: string, command: string }) {
    //     const session: Session | undefined = this.sessions.get(data.sessionId);
    //     if (session) {
    //         const input = data.command.split(' ').pop();
    //         session.conn.exec(`compgen -o plusdirs -- ${input}`, (err: Error, stream: ClientChannel) => {
    //             if (err) {
    //                 socket.emit('error', { sessionId: data.sessionId, message: err.message });
    //                 return;
    //             }

    //             let command = '';
    //             stream.on('data', data => {
    //                 command += data.toString();
    //             });

    //             stream.on('close', () => {
    //                 const commands = command.trim().split('\n');

    //                 if (commands.length > 1) {
    //                     socket.emit('data', { sessionId: data.sessionId, output: commands.join(' ') + '\n' });
    //                 } else { }
    //                 socket.emit('auto_complete', { sessionId: data.sessionId, command: command.trim() });
    //                 console.log('Natija:', command.trim());
    //             });
    //         });
    //     }
    // }

    private connectShell(socket: Socket, conn: Client, sessionId: string) {
        conn.shell(
            {
                term: 'xterm',
                cols: 100,
                rows: 30,
                echo: false,
                pty: false,
                env: { LANG: 'en_US.UTF-8' },
            },
            (err: Error, stream: Channel) => {
                if (err) {
                    conn.end();
                    socket.emit('error', { sessionId, message: err.message });
                } else {
                    let skipSlashNsCount = 1;
                    let skipDataCount = 0;
                    this.sessions.set(sessionId, {
                        socket,
                        shell: stream,
                        ptyTerm: null,
                        skipFunc: {
                            skipSlashNs: (value) => { skipSlashNsCount = value; },
                            skipData: (value) => { skipDataCount = value; }
                        }
                    });

                    function _skipData(sessionId: string, output: string) {
                        if (skipDataCount > 0) {
                            skipDataCount--;
                            return;
                        } else {
                            socket.emit('data', { sessionId, output });
                        }
                    }

                    stream.on('data', (data: Buffer) => {
                        const output = data.toString();
                        // socket.emit('data', { sessionId, output });
                        console.log('outputt', output);
                        if (skipSlashNsCount > 0) {
                            if (output.includes('\n')) {
                                const resposes = output.split('\n');
                                if (resposes.length > skipSlashNsCount) {
                                    const respose = resposes.slice(skipSlashNsCount).join('\n');
                                    skipSlashNsCount = 0;
                                    _skipData(sessionId, respose);
                                } else {
                                    // console.log('skipSlashNs:', skipSlashNs);
                                    // console.log
                                    skipSlashNsCount -= (resposes.length - 1);
                                }
                                // const lastIndex = output.lastIndexOf('\n');
                                // socket.emit('data', { sessionId, output: `${_line}${output.slice(0, lastIndex)}` });
                                // console.log(`${_line}${output.slice(0, lastIndex)}`); 
                                // _line = output.slice(lastIndex + 1);   
                            }
                        } else {
                            _skipData(sessionId, output);
                            // socket.emit('data', { sessionId, output });
                        }
                    });

                    stream.on('error', (err: Error) => {
                        socket.emit('error', { sessionId, message: err.message });
                    });

                    stream.on('close', () => {
                        // this.sessions.delete(sessionId);
                        socket.emit('alert', { sessionId, message: 'ssh Terminal yopildi' });
                        conn.end();
                        this.connectBackEndTerm(socket, sessionId);
                    });

                    socket.emit('alert', { sessionId, message: 'ssh Terminal ochildi' });
                }
            });
    }
}
