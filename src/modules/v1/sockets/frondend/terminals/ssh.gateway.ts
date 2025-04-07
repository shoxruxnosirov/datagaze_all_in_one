import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Client, Channel } from 'ssh2';
import { randomUUID } from 'crypto';
import * as pty from 'node-pty';
import { SshGatewayConnection } from './ssh.gatewayService';
import { ProductRepository } from 'src/database/repositories/product.repository';
import {
  FrontendSocketTerminal,
  Payload,
  Role,
  Server as ServerCredential,
  TerminalSession,
} from 'src/comman/types';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/config/env';
import { ConnectDto } from 'src/modules/v1/product/dto/update.serverConnect.dto';
import { isNullOrUndefined } from 'util';

@WebSocketGateway({ cors: true })
export class SshGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(
    private sshGatewayConn: SshGatewayConnection,
    private productRepository: ProductRepository,
    private jwtService: JwtService,
  ) { }

  handleConnection(socket: FrontendSocketTerminal) {
    this.tokenVerifying(socket);
    console.log(`SocketClient ulandi: ${socket.id}`);
  }

  handleDisconnect(socket: FrontendSocketTerminal) {
    console.log(`SocketClient uzildi: ${socket.id}`);

    for (const session of socket.data.sessions.values()) {
      session.shell?.end?.();
      session.ptyTerm?.kill();
    }
    socket.data.sessions.clear();
  }

  @SubscribeMessage('open_own_terminal')
  openTerminal(socket: FrontendSocketTerminal) {
    const sessionId = randomUUID();
    const session: TerminalSession = {
      socket,
      shell: null,
      ptyTerm: null,
      conn: null
    };
    this.connectBackEndTerm(socket, sessionId, session);
    socket.data.sessions.set(sessionId, session);
    socket.emit('open_terminal', { sessionId });
  }

  @SubscribeMessage('deploy_product')
  async deployingProject(
    socket: FrontendSocketTerminal,
    config: { productId: string; serverCredentials: ConnectDto },
  ) {
    const { serverFilePath, installScript } = await this.productRepository.getProductForDeploy(
      config.productId,
    );

    const sessionId = randomUUID();
    const conn: Client = new Client();
    const session: TerminalSession = {
      socket,
      shell: {
        write(command: string) {
          if (command === '\x03') {
            this.handleSSHDisconnect(socket, { sessionId });
          }
        },
        // end() {
        //   conn.end();
        //   console.log(' aynan bu buyruq hech ham chaqirmaydi ');
        // },
      },
      ptyTerm: null,
      conn,
    };

    socket.data.sessions.set(sessionId, session);
    try {
      await this.connectToServer(config.serverCredentials, {
        socket,
        conn,
        sessionId,
        session,
      });
      await this.sshGatewayConn.deployProject(
        {
          localProjectPath: serverFilePath,
          serverCredentials: config.serverCredentials,
        },
        {
          socket,
          conn,
          sessionId,
          session,
        },
        installScript,
      );

      await this.productRepository.addServerAndUpdateProduct(
        config.serverCredentials,
        config.productId,
      );

      this.connectShell(socket, conn, sessionId, session); //, installScript);
    } catch (error: unknown) {
      if (error instanceof Error) {
        socket.emit('error', { sessionId, message: error.message });
      } else {
        socket.emit('error', { sessionId, message: error });
      }
      console.log('gataway 122 error ', error);

      this.handleSSHDisconnect(socket, {sessionId});
    }
  }

  @SubscribeMessage('ssh_connect')
  async handleConnect(socket: FrontendSocketTerminal, data: { productId: string }) {
    const sessionId = randomUUID();
    const session: TerminalSession = {
      socket,
      shell: null,
      ptyTerm: null,
      conn: null
    }
    socket.data.sessions.set(sessionId, session);
    
    try {
      const server: ServerCredential = await this.productRepository.getServerCredentials(
        data.productId,
      );
      delete server.id;
      const conn = new Client();
      session.conn = conn;
      await this.connectToServer(server, { socket, conn, sessionId, session });
      this.connectShell(socket, conn, sessionId, session);
    } catch (error: unknown) {
      if (error instanceof Error) {
        socket.emit('error', { sessionId, message: error.message });
      } else {
        socket.emit('error', { sessionId, message: error });
      }
      console.log('gataway 158 error ', error);
      this.handleSSHDisconnect(socket, {sessionId});
    }
  }

  @SubscribeMessage('command')
  handleCommand(socket: FrontendSocketTerminal, data: { sessionId: string; command: string }) {
    const session = socket.data.sessions.get(data.sessionId);
    if (session) {
      if (session.shell) {
        session.shell.write(data.command);
      } else if (session.ptyTerm) {
        session.ptyTerm.write(data.command);
      } else {
        socket.emit('error', { sessionId: data.sessionId, message: 'terminal topilmadi...' });
      }
    } else {
      socket.emit('error', { sessionId: data.sessionId, message: 'SSH sessiya topilmadi' });
    }
  }

  @SubscribeMessage('close_terminal')
  handleSSHDisconnect(socket: FrontendSocketTerminal, data: { sessionId: string }) {
    const session: TerminalSession | undefined = socket.data.sessions.get(data.sessionId);
    if (session) {
      // session.shell?.end?.();
      const shell = session.shell;
      if (shell) {
        shell.end?.();
        session.conn?.end();
        session.conn = null;
        console.log('shell ulanish yopildi');
      }
      session.ptyTerm?.kill();
      socket.emit('closed_terminal', { sessionId: data.sessionId });
      socket.data.sessions.delete(data.sessionId);
      console.log(`terminal yopildi: ${data.sessionId}`);
    }
  }

  private connectBackEndTerm(
    socket: FrontendSocketTerminal,
    sessionId: string,
    session: TerminalSession,
  ) {
    const shell = process.platform === 'win32' ? 'powershell.exe' : 'bash';
    const term = pty.spawn(shell, [], {
      name: 'xterm-color',
      cols: 80,
      rows: 20,
      cwd: process.env.HOME,
      env: process.env,
    });

    term.onData((data) => {
      socket.emit('data', { sessionId, output: data.toString() });
    });

    term.onExit(({ exitCode, signal }) => {
      console.log(`Terminal exited with code: ${exitCode}, signal: ${signal}`);
      socket.emit('closed_terminal', { sessionId, exitCode, signal });
      term?.kill();
      socket.data.sessions.delete(sessionId);
    });

    session.ptyTerm = term;
  }

  private connectShell(
    socket: FrontendSocketTerminal,
    conn: Client,
    sessionId: string,
    session: TerminalSession
    // installScript?: string,
  ) {
    conn.shell(
      {
        term: 'xterm-256color', //'xterm',
        cols: 80,
        rows: 20,
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

          session.shell = stream;

          socket.data.sessions.set(sessionId, session);

          stream.on('data', (data: Buffer) => {
            const output = data.toString();
            socket.emit('data', { sessionId, output });
          });

          stream.on('error', (err: Error) => {
            socket.emit('error', { sessionId, message: err.message });
          });

          stream.on('close', () => {
            session.shell = null;
            socket.emit('alert', { sessionId, message: 'ssh Terminal yopildi' });
            conn.end();
            session.conn = null;
            this.connectBackEndTerm(socket, sessionId, session);
          });

          socket.emit('alert', { sessionId, message: 'ssh Terminal ochildi' });
        }
      },
    );
  }

  private async connectToServer(
    connectConfig: ConnectDto,
    term: {
      socket: FrontendSocketTerminal;
      conn: Client;
      sessionId: string;
      session?: TerminalSession;
    },
  ): Promise<void> {
    const { socket, conn, sessionId, session } = term;
    return new Promise((resolve, reject) => {

      if (session?.shell) {
        session.shell.end = () => {
          // conn.end();
          // session.conn = null;
          reject(new WsException("connection jarayonda to'xtatildi"));
        };
      }

      const rejectConnectForTimeout = () => {
        console.error('⏳ SSH ulanish timeout bo‘ldi');
        reject(new WsException('SSH timeout'));
      };

      const rejectConnectForError = (err: Error) => {
        console.log(`ssh connectionda xatolik err: ${err.message}`);
        socket.emit('error', {
          sessionId,
          message: `Serverda xatolik yuzaga keldi: ${err.message}\n`,
        });
        reject(new WsException(`ssh connectionda xatolik err: ${err.message}`));
      }

      conn.on('timeout', rejectConnectForTimeout);

      conn.on('error', rejectConnectForError);

      conn.on('ready', () => {
        socket.emit('open_terminal', { sessionId });
        socket.emit('data', {
          sessionId: term.sessionId,
          output: `${connectConfig.username}:${connectConfig.host} serverga ulandi\r\n`,
        });

        conn.off('timeout', rejectConnectForTimeout);
        conn.off('error', rejectConnectForTimeout);

        conn.on('timeout', () => {
          console.error('⏳ SSH ulanish timeout bo‘ldi');
          this.handleSSHDisconnect(socket, { sessionId });
        });

        conn.on('error', (err: Error) => {
          console.log(`ssh connectionda xatolik err: ${err.message}`);
          socket.emit('error', {
            sessionId,
            message: `Serverda xatolik yuzaga keldi: ${err.message}\n`,
          });
          this.handleSSHDisconnect(socket, { sessionId });
        });

        resolve();
      });

      conn.on('close', () => {
        console.log(`SSH sessiya yopildi: ${sessionId}`);
        // socket.emit('closed_terminal', { sessionId });
        // this.handleSSHDisconnect(socket, { sessionId });
      });

      conn.connect({
        ...connectConfig,
        readyTimeout: 10000,
        keepaliveInterval: 5000,
        keepaliveCountMax: 3,
      })
    });
  }

  private tokenVerifying(socket: FrontendSocketTerminal): boolean {
    const token = socket.handshake.headers['authorization']?.split(' ')[1];

    console.log('terminal token: ', token);
    if (!token) {
      socket.disconnect();
      return false;
    }
    try {
      const decoded: Payload = this.jwtService.verify(token, { secret: JWT_SECRET });
      const payload: Payload = {
        id: decoded.id,
        role: decoded.role,
      };
      if (!(payload.role === Role.SUPER_ADMIN || payload.role === Role.ADMIN)) {
        console.log("Ruxsat yo'q!");
        socket.disconnect();
        return false;
      }
      console.log(`TUU ${decoded.role} ulandi id: ${payload.id}`);
      socket.data = { sessions: new Map() };
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log('Token yaroqsiz! or err.message: ' + err.message);
      } else {
        console.log(`token yaroqsiz? or err: ${err}`);
      }
      socket.disconnect();
      return false;
    }
  }
}
