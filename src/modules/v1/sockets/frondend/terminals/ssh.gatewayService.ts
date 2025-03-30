import {
    Injectable,
    // InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Client, SFTPWrapper, ClientChannel } from 'ssh2';

import { Socket } from 'socket.io';

import { FrontendSocketTerminal, Message, Server, TerminalSession } from 'src/comman/types';
import { ConnectDto } from '../../../ssh/dto/dtos';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class SshGatewayConnection {

    private async connectToServer(
        connectConfig: ConnectDto,
        term: {
            socket: FrontendSocketTerminal,
            conn: Client,
            sessionId: string,
            session: TerminalSession
        }
    ): Promise<void> {
        const { socket, conn, sessionId, session } = term;

        return new Promise((resolve, reject) => {
            session.shell.end = () => {
                conn.end();
                reject(
                    new WsException('connection jarayonda to\'xtatildi')
                )
            }
            conn.on('ready', () => {
                // socket.emit('alert', {
                //     message: `${connectConfig.host}:${connectConfig.port} serverga ulandi\n`,
                // });
                socket.emit('open_terminal', { sessionId });
                resolve();
            });

            conn.on('timeout', () => {
                console.error('⏳ SSH ulanish timeout bo‘ldi');
                reject(new WsException('SSH timeout'));
            });

            conn.on('error', (err: Error) => {
                console.log(`ssh connectionda xatolik err: ${err.message}`);
                socket.emit('error', { sessionId, message: `Serverda xatolik yuzaga keldi: ${err.message}\n` });
                // socket.disconnect();
                reject(
                    // 'stoped'
                    new WsException(
                        `Server is not reachable. Please check the network connection. err: ${err.message}`,
                    ),
                );
            });

            conn.connect(connectConfig);
        });
    }

    // private async disconnectFromServer(conn: Client, socket: Socket): Promise<IMessage> {
    //     return new Promise((resolve, reject) => {
    //         conn.removeAllListeners('error');
    //         conn.on('close', () => {
    //             socket.emit('alert', { message: "Fayllar muvofaqiyatli o'tkzildi" });
    //             resolve({
    //                 status: 'success',
    //                 message: 'Disconnected successfully.',
    //             });
    //         });
    //         conn.on('error', (err: Error) => {
    //             socket.emit('error', { message: `fayl o'tkazilib yopishda err: ${err.message}` });
    //             // conn.end();
    //             reject(
    //                 new HttpException(
    //                     {
    //                         status: 'error',
    //                         message: 'Error occurred while disconnecting: ' + err.message,
    //                     },
    //                     HttpStatus.INTERNAL_SERVER_ERROR,
    //                 )
    //             );
    //         });
    //         conn.end();
    //     });
    // }

    async deployProject(
        config: {
            localProjectPath: string;
            serverCredentials: ConnectDto;
        },
        term: {
            socket: FrontendSocketTerminal,
            conn: Client,
            sessionId: string,
            session: TerminalSession
        },
        installScript?: string
    ): Promise<void> {
        // const { socket, conn, sessionId, session } = term;
        await this.connectToServer(config.serverCredentials, term);

        const osType = await this.findOsType(term);
        // await this.uploadAndInstallNodeJS(conn, osType, socket, sessionId);
        // // await this.uploadDirectory(sftp, config.localProjectPath, remoteProjectPath, sessionId);
        await this.uploadProduct(config.localProjectPath, osType, term, installScript); // startCommand);
        // await this.disconnectFromServer(conn, socket);
        term.socket.emit('data', { sessionId: term.sessionId, output: 'terminaldan foydalnishing mumkin!\r\n' });
    }

    private async findOsType(term: {
        socket: FrontendSocketTerminal,
        conn: Client,
        sessionId: string,
        session: TerminalSession
    }): Promise<string> {
        const { socket, conn, sessionId, session } = term;
        return new Promise((resolve, reject) => {
            session.shell.end = () => {
                conn.end();
                reject(
                    new WsException(
                        `Ulanilgan server OS turini aniqlashda  to\'xtatildi`,
                    ),
                )
            }

            conn.exec(
                'uname -s 2>/dev/null || systeminfo | findstr /B /C:"OS Name"',
                (err: Error, stream: ClientChannel) => {
                    if (err) {
                        socket.emit('error', {
                            sessionId,
                            message: `Ulanilgan server OS turini aniqlashda xatolik yuzaga keldi err: ${err.message}`,
                        });
                        // socket.disconnect();
                        // reject('unknown');
                        reject(new WsException(`OS turini aniqlashda xatolik err: ${err.message}`));
                        // return;
                    }

                    session.shell.end = () => {
                        console.log('session.shell.end findOsType');
                        if (stream) {
                            stream.end();
                            stream.destroy();
                        }
                        conn.end();
                        socket.emit('alert', { sessionId, message: 'os turni anilqlashda execda to\'xtatildi!' });
                        reject(new WsException(`Ulanilgan server OS turini aniqlashda exec da to\'xtatildi`));
                    }

                    let osType = '';

                    if (stream) {
                    stream.on('data', (data) => {
                        osType += data.toString();
                    });

                    stream.on('close', () => {
                        osType = osType.trim();
                        socket.emit('alert', {
                            sessionId,
                            message: `${osType} OS turidagi server ekanligi aniqlandi\n`
                        });
                        resolve(osType);
                    });

                    stream.on('error', (error: Error) => {
                        socket.emit('error', {
                            sessionId,
                            message: `Server OS turini aniqlashda xatolik yuzaga keldi err: ${error.message}\n`,
                        });
                        // socket.disconnect();
                        // reject('unknown');
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
            socket: FrontendSocketTerminal,
            conn: Client,
            sessionId: string,
            session: TerminalSession
        },
        installScript?: string
    ): Promise<string> {
        const { socket, conn, sessionId, session } = term;
        return new Promise((resolve, reject) => {
            let remoteFile: string = '';
            // let remoteProjectPath: string = '';

            session.shell.end = () => {
                conn.end();
                console.log(`Product uploads o'tish jarayonidan oldin to\'xtatildi`);
                reject(new WsException(`Product uploads o'tish jarayonidan oldin to\'xtatildi`));
            }

            if (osType === 'Windows') {
                remoteFile = 'C:\\Users\\Administrator\\Downloads\\' + path.basename(localProjectPath);
                // remoteProjectPath = 'C:';
            } //if (osType === 'Linux')
            else {
                remoteFile = path.basename(localProjectPath);
                // remoteProjectPath = `~`;
            }

            conn.sftp((err: Error, sftp: SFTPWrapper) => {
                if (err) {
                    socket.emit('error', {
                        message: `Product uploads SFTP ulanish xatosi err: ${err.message} \n`,
                    });
                    // socket.disconnect();
                    // reject('Product uploads SFTP err');
                    reject(new WsException(`Product uploads SFTP ulanish xatosi err: ${err.message}`));
                }

                session.shell.end = async () => {
                    console.log('sesson.shell.end uploadProduct da chaqirildi');
                    readStream.destroy();
                    writeStream.destroy();
                    await this.deleteRemoteFile(sftp, remoteFile);
                    sftp.end();
                    reject(new WsException(`Product uploads o'tish jarayonida to\'xtatildi`));
                }

                const fileSize = fs.statSync(localProjectPath).size;
                let uploadedSize = 0;

                const writeStream = sftp?.createWriteStream?.(remoteFile);
                if (!writeStream) {
                    reject('stopped');
                    return;
                }
                const readStream = fs.createReadStream(localProjectPath);

                let progress = 0..toFixed(2);
                const barLength = 40;
                let filledLength = Math.round((+progress / 100) * barLength);
                let progressBar = `[${"#".repeat(filledLength)}${"-".repeat(barLength - filledLength)}]`;

                console.log(`\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m`);

                socket.emit('uploading', { sessionId, eventName: "Product uploading", progress });
                socket.emit('data', { sessionId, output: `\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m` });

                readStream?.on('data', (chunk) => {

                    uploadedSize += chunk.length;
                    progress = ((uploadedSize / fileSize) * 100).toFixed(2);
                    filledLength = Math.round((+progress / 100) * barLength);
                    progressBar = `[${"#".repeat(filledLength)}${"-".repeat(barLength - filledLength)}]`;

                    console.log(`\x1b[A\x1b[K\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m`);
                    // socket.emit('data', { sessionId, output: `\x1b[A\x1b[K\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m` });

                    socket.emit('uploading', { sessionId, eventName: "Product uploading", progress });
                    socket.emit('data', { sessionId, output: `\x1b[2K\x1b[G\x1b[01;34mProduct uploading: ${progressBar} ${progress}%\x1b[0m` });
                });

                writeStream?.on('close', () => {

                    writeStream?.destroy();
                    readStream?.destroy();
                    sftp?.end();

                    if (!writeStream.writableEnded) {
                        return;
                    } 

                    console.log(`\x1b[A\x1b[K\x1b[01;34m📦 Product serverga yuklandi\x1b[0m`);
                    // socket.emit('data', { sessionId, output: `\x1b[A\x1b[K\x1b[01;34m📦 Product serverga yuklandi.\x1b[0m` });

                    socket.emit('uploading', { sessionId, eventName: "Product uploading", progress: 100..toFixed(2) });
                    socket.emit('data', { sessionId, output: `\x1b[2K\x1b[G\x1b[01;34m📦 Product serverga yuklandi.\x1b[0m\r\n` });


                    conn.exec(
                        installScript, // osType === 'Linux' ? linuxCommands : windowsCommands,
                        (err: Error, stream: ClientChannel) => {
                            if (err) {
                                socket.emit('error', { sessionId, message: `Productni arxivdan ochishda Error: ${err.message}\n` });
                                // socket.disconnect();
                                reject(
                                    new WsException(
                                        'installing da xatolik?'
                                        // `Productni arxivdan ochishda xato yuzaga keldi err: ${err.message}`,
                                    )
                                );
                            }
                            session.shell.end = () => {
                                conn.exec(osType === 'windows' ? `powershell -Command "Remove-Item -Path '${remoteFile}' -Force"` : `sudo rm -f "${remoteFile}"`, (err: Error, stream: SFTPWrapper) => {

                                    if (err) {
                                        // resolve qilib jarayonni ushlab qolish kerakdir balki
                                        reject(
                                            new WsException(
                                                `installing jarayonini to\'xtatishda xatolik: ${err.message}`
                                            )
                                        );
                                    }
                                })
                                reject(new WsException('exec da stopped'));
                            }
                            stream.on('data', (data: Buffer) => {
                                const formattedData = data.toString();//.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
                                socket.emit('data', { sessionId, output: formattedData });
                                console.log('📌 Output (product arxivdan ochish):', data.toString());
                            });
                            stream.stderr.on('data', (data: Buffer) => {
                                const errorMsg = data.toString();
                                console.error('⚠️ Xato:', errorMsg);

                                // Agar jiddiy xatolik bo‘lsa, jarayonni to‘xtatamiz
                                if (
                                    errorMsg.includes('command not found') ||
                                    errorMsg.includes('Permission denied')
                                ) {
                                    socket.emit('error', { message: `Product arxivdan ochish Error: ${err.message}\n` });
                                    // socket.disconnect();
                                    reject(
                                        new WsException(
                                            `productni arxivdan ochishda stream.stder.on err: ${err.message}`,
                                        )
                                    );
                                } else {
                                    socket.emit('alert', { message: `Product arxivdan ochishda warring: ${err.message}\n` });
                                }
                            });

                            stream.on('close', () => {
                                // console.log(`\x1b[A\x1b[KProduct path: "${path.join(remoteProjectPath, 'product')}"\x1b[0m`);
                                // socket.emit('data', { sessionId, output: `\x1b[2K\x1b[GProduct path: "${path.join(remoteProjectPath, 'product')}"\x1b[0m` });
                                resolve('success');
                            });
                        },
                    );

                    // resolve('success');

                });

                // ✅ Xatolik yuz bersa oqimni yopish
                writeStream?.on('error', (err: Error) => {
                    console.error('Write stream xatosi:', err);
                    writeStream.destroy();
                    readStream.destroy();
                    sftp.end();
                });

                writeStream && readStream.pipe(writeStream);
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
