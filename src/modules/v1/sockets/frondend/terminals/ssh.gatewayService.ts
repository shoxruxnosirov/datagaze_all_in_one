import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Client, SFTPWrapper, ClientChannel } from 'ssh2';

import { FrontendSocketTerminal, TerminalSession } from 'src/comman/types';
import { WsException } from '@nestjs/websockets';
import { ConnectDto } from 'src/modules/v1/product/dto/update.serverConnect.dto';

@Injectable()
export class SshGatewayConnection {
  async deployProject(
    config: {
      localProjectPath: string;
      serverCredentials: ConnectDto;
    },
    term: {
      socket: FrontendSocketTerminal;
      conn: Client;
      sessionId: string;
      session: TerminalSession;
    },
    installScript?: string,
  ): Promise<void> {
    const osType = await this.findOsType(term);
    await this.uploadProduct(config.localProjectPath, osType, term, installScript);
    term.socket.emit('data', {
      sessionId: term.sessionId,
      output: 'terminaldan foydalnishing mumkin!\r\n',
    });
  }

  private async findOsType(term: {
    socket: FrontendSocketTerminal;
    conn: Client;
    sessionId: string;
    session: TerminalSession;
  }): Promise<string> {
    const { socket, conn, sessionId, session } = term;
    return new Promise((resolve, reject) => {
      if (session.shell) {
        session.shell.end = () => {
          conn.end();
          reject(new WsException(`Ulanilgan server OS turini aniqlashda  to'xtatildi`));
        };
      }

      conn.exec(
        'uname -s 2>/dev/null || systeminfo | findstr /B /C:"OS Name"',
        (err: Error, stream: ClientChannel) => {
          if (err) {
            socket.emit('error', {
              sessionId,
              message: `Ulanilgan server OS turini aniqlashda xatolik yuzaga keldi err: ${err.message}`,
            });
            reject(new WsException(`OS turini aniqlashda xatolik err: ${err.message}`));
          }

          if (session.shell) {
            session.shell.end = () => {
              console.log('session.shell.end findOsType');
              if (stream) {
                stream.end();
                stream.destroy();
              }
              conn.end();
              socket.emit('alert', {
                sessionId,
                message: "os turni anilqlashda execda to'xtatildi!",
              });
              reject(new WsException(`Ulanilgan server OS turini aniqlashda exec da to'xtatildi`));
            };
          }

          let osType = '';

          if (stream) {
            stream.on('data', (data: Buffer) => {
              osType += data.toString();
            });

            stream.on('close', () => {
              osType = osType.trim();
              socket.emit('alert', {
                sessionId,
                message: `${osType} OS turidagi server ekanligi aniqlandi\n`,
              });
              resolve(osType);
            });

            stream.on('error', (error: Error) => {
              socket.emit('error', {
                sessionId,
                message: `Server OS turini aniqlashda xatolik yuzaga keldi err: ${error.message}\n`,
              });
              reject(
                new WsException(
                  `Ulanilgan server OS turini aniqlashda xatolik yuzaga keldi err: ${error.message} \n`,
                ),
              );
            });
          } else {
            reject(
              new WsException(
                `terminal hali tayinlanmagan stream ham undifined bo'lib qolishi mumkin ekan`,
              ),
            );
          }
        },
      );
    });
  }

  private async uploadProduct(
    localProjectPath: string,
    osType: string,
    term: {
      socket: FrontendSocketTerminal;
      conn: Client;
      sessionId: string;
      session: TerminalSession;
    },
    installScript?: string,
  ): Promise<string> {
    const { socket, conn, sessionId, session } = term;
    return new Promise((resolve, reject) => {
      let remoteFile: string = '';
      if (session.shell) {
        session.shell.end = () => {
          conn.end();
          console.log(`Product uploads o'tish jarayonidan oldin to'xtatildi`);
          reject(new WsException(`Product uploads o'tish jarayonidan oldin to'xtatildi`));
        };
      }

      if (osType === 'Windows') {
        remoteFile = 'C:\\Users\\Administrator\\Downloads\\' + path.basename(localProjectPath);
      } //if (osType === 'Linux')
      else {
        remoteFile = path.basename(localProjectPath);
      }

      conn.sftp((err: Error, sftp: SFTPWrapper) => {
        if (err) {
          socket.emit('error', {
            message: `Product uploads SFTP ulanish xatosi err: ${err.message} \n`,
          });
          reject(new WsException(`Product uploads SFTP ulanish xatosi err: ${err.message}`));
        }

        if (session.shell) {
          session.shell.end = () => {
            void (async () => {
              console.log('sesson.shell.end uploadProduct da chaqirildi');
              readStream.destroy();
              writeStream.destroy();
              try {
                await this.deleteRemoteFile(sftp, remoteFile);
              } catch (err: unknown) {
                console.log(`o'tkazilgan productni o'chirishda xatolik`, err);
              }
              sftp.end();
              reject(new WsException(`Product uploads o'tish jarayonida to'xtatildi`));
            })();
          };
        }

        const fileSize = fs.statSync(localProjectPath).size;
        let uploadedSize = 0;

        const writeStream = sftp?.createWriteStream?.(remoteFile);
        if (!writeStream) {
          reject(new WsException('stopped'));
          return;
        }
        const readStream = fs.createReadStream(localProjectPath);

        let progress = (0).toFixed(2);
        const barLength = 40;
        let filledLength = Math.round((+progress / 100) * barLength);
        let progressBar = `[${'#'.repeat(filledLength)}${'-'.repeat(barLength - filledLength)}]`;

        console.log(`\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m`);

        socket.emit('uploading', { sessionId, eventName: 'Product uploading', progress });
        socket.emit('data', {
          sessionId,
          output: `\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m`,
        });

        readStream?.on('data', (chunk) => {
          uploadedSize += chunk.length;
          progress = ((uploadedSize / fileSize) * 100).toFixed(2);
          filledLength = Math.round((+progress / 100) * barLength);
          progressBar = `[${'#'.repeat(filledLength)}${'-'.repeat(barLength - filledLength)}]`;

          console.log(
            `\x1b[A\x1b[K\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m`,
          );
          socket.emit('uploading', { sessionId, eventName: 'Product uploading', progress });
          socket.emit('data', {
            sessionId,
            output: `\x1b[2K\x1b[G\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m`,
          });
        });

        writeStream?.on('close', () => {
          writeStream?.destroy();
          readStream?.destroy();
          sftp?.end();

          if (!writeStream.writableEnded) {
            return;
          }

          console.log(`\x1b[A\x1b[K\x1b[01;34m📦 Product serverga yuklandi\x1b[0m`);

          socket.emit('uploading', {
            sessionId,
            eventName: 'Product uploading',
            progress: (100).toFixed(2),
          });
          socket.emit('data', {
            sessionId,
            output: `\x1b[2K\x1b[G\x1b[01;34m📦 Product serverga yuklandi.\x1b[0m\r\n`,
          });

          conn.exec(
            installScript || '', // osType === 'Linux' ? linuxCommands : windowsCommands,
            (err: Error, stream: ClientChannel) => {
              if (err) {
                socket.emit('error', {
                  sessionId,
                  message: `Productni arxivdan ochishda Error: ${err.message}\n`,
                });
                reject(new WsException(`installing da xatolik err: ${err.message}`));
              }
              if (session.shell) {
                session.shell.end = () => {
                  conn.exec(
                    osType === 'windows'
                      ? `powershell -Command "Remove-Item -Path '${remoteFile}' -Force"`
                      : `sudo rm -f "${remoteFile}"`,
                    (err: Error, stream: ClientChannel) => {
                      if (err) {
                        // resolve qilib jarayonni ushlab qolish kerakdir balki
                        reject(
                          new WsException(
                            `installing jarayonini to'xtatishda xatolik: ${err.message}`,
                          ),
                        );
                      }
                      stream.on('data', (data: Buffer) => {
                        console.log('STDOUT:', data.toString());
                      });
                    },
                  );
                  reject(new WsException('exec da stopped'));
                };
              }
              stream.on('data', (data: Buffer) => {
                const formattedData = data.toString();
                socket.emit('data', { sessionId, output: formattedData });
                console.log('📌 Output (product arxivdan ochish):', data.toString());
              });
              stream.stderr.on('data', (data: Buffer) => {
                const errorMsg = data.toString();
                console.error('⚠️ Xato:', errorMsg);

                if (
                  errorMsg.includes('command not found') ||
                  errorMsg.includes('Permission denied')
                ) {
                  socket.emit('error', {
                    sessionId,
                    message: `Product arxivdan ochish Error: ${err.message}\n`,
                  });
                  // socket.disconnect();
                  reject(
                    new WsException(
                      `productni arxivdan ochishda stream.stder.on err: ${err.message}`,
                    ),
                  );
                } else {
                  socket.emit('alert', {
                    sessionId,
                    message: `Product arxivdan ochishda warring: ${err.message}\n`,
                  });
                }
              });

              stream.on('close', () => {
                resolve('success');
              });
            },
          );
        });

        writeStream?.on('error', (err: Error) => {
          console.error('Write stream xatosi:', err);
          writeStream.destroy();
          readStream.destroy();
          sftp.end();
        });

        if (writeStream) {
          readStream.pipe(writeStream);
        }
      });
    });
  }

  private async deleteRemoteFile(sftp: SFTPWrapper, remoteFilePath: string) {
    if (remoteFilePath) {
      return new Promise<void>((resolve, reject) => {
        sftp.unlink(remoteFilePath, (err: Error) => {
          if (err) {
            console.error(`Error deleting file ${remoteFilePath}:`, err);
            reject(err);
          } else {
            console.log(`Partial file ${remoteFilePath} deleted.`);
            resolve();
          }
        });
      });
    }
  }
}
