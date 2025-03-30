import {
    Injectable,
    // InternalServerErrorException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Client, SFTPWrapper, ClientChannel } from 'ssh2';

import { Socket } from 'socket.io';

import { Message, Server, TerminalSession } from 'src/comman/types';
import { ConnectDto } from '../../../ssh/dto/dtos';
import { WsException } from '@nestjs/websockets';

@Injectable()
export class SshGatewayConnection {
    //   private sshClient: Client;
    constructor() {
        // this.sshClient = new Client;
    }

    private async connectToServer(
        connectConfig: ConnectDto,
        term: {
            socket: Socket,
            conn: Client,
            sessionId: string,
            session: TerminalSession
        }
    ): Promise<void> {
        // console.log('connectData: ', connectConfig);
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
            socket: Socket,
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
        socket: Socket,
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
                                `terminal hali tayinlanmagan \n`,
                            ),
                        );
                    }

                },
            );
        });
    }

    // private async uploadAndInstallNodeJS(conn: Client, osType: string, socket: Socket, sessionId: string) {
    //     return new Promise((resolve, reject) => {
    //         let remoteFile: string;
    //         let localFilePath: string;
    //         if (osType === 'Windows') {
    //             remoteFile = `C:\\Users\\Administrator\\Downloads\\nodejs.zip`;
    //             localFilePath = path.join(process.cwd(), 'products', 'nodejs', 'node_v22.14.0_64.zip');
    //         } //if (osType === 'Linux')
    //         else {
    //             remoteFile = `node.tar.xz`;
    //             localFilePath = path.join(process.cwd(), 'products', 'nodejs', 'node_v22.14.0_64.tar.xz');
    //         }

    //         // console.log('localFilePath:', localFilePath);
    //         // Faylni serverga yuborish
    //         conn.sftp((err: Error, sftp: SFTPWrapper) => {
    //             if (err) {
    //                 socket.emit('error', {
    //                     message: `Nodejs uploads SFTP ulanish xatosi err: ${err.message} \n`,
    //                 });
    //                 // socket.disconnect();
    //                 reject(new WsException(`Nodejs uploads SFTP ulanish xatosi err: ${err.message}\n`));
    //             }

    //             const fileSize = fs.statSync(localFilePath).size;
    //             let uploadedSize = 0;

    //             let progress = 0..toFixed(2);
    //             const barLength = 40;
    //             let filledLength = Math.round((+progress / 100) * barLength);
    //             let progressBar = `[${"#".repeat(filledLength)}${"-".repeat(barLength - filledLength)}]`;

    //             console.log(`\x1b[01;34mNodeJs uploading ${progressBar} ${progress}%\x1b[0m`);
    //             socket.emit('uploading', { sessionId, eventName: "Nodejs uploading", progress });
    //             socket.emit('data', { sessionId, output: `\x1b[2K\x1b[G\x1b[01;34mNodeJs uploading ${progressBar} ${progress}%\x1b[0m` });

    //             const readStream = fs.createReadStream(localFilePath);
    //             const writeStream: Writable = sftp.createWriteStream(remoteFile);

    //             readStream.on('data', (chunk) => {
    //                 uploadedSize += chunk.length;
    //                 progress = ((uploadedSize / fileSize) * 100).toFixed(2);
    //                 filledLength = Math.round((+progress / 100) * barLength);
    //                 const progressBar = `[${"#".repeat(filledLength)}${"-".repeat(barLength - filledLength)}]`;

    //                 console.log(`\x1b[A\x1b[K\x1b[01;34mNodeJs uploading ${progressBar} ${progress}%\x1b[0m`);

    //                 socket.emit('uploading', { sessionId, eventName: "Nodejs uploading", progress });
    //                 socket.emit('data', { sessionId, output: `\x1b[2K\x1b[G\x1b[01;34mNodeJs uploading ${progressBar} ${progress}%\x1b[0m` });
    //             });

    //             writeStream.on('close', () => {
    //                 console.log(`\x1b[A\x1b[K\x1b[01;34m📦 Nodejs serverga yuklandi. Endi o‘rnatilmoqda...\x1b[0m`);

    //                 socket.emit('uploading', { sessionId, eventName: "Nodejs uploading", progress: 100..toFixed(2) });
    //                 socket.emit('installing', { sessionId, eventName: "Nodejs installing", progress: 0..toFixed(2) });
    //                 socket.emit('data', { sessionId, output: `\x1b[2K\x1b[G\x1b[01;34m📦 NodeJs serverga yuklandi. Endi o‘rnatilmoqda...\x1b[0m` });

    //                 readStream.destroy();
    //                 writeStream.destroy();
    //                 sftp.end();

    //                 // resolve('success');

    //                 const linuxCommands = `
    //         # sudo 
    //         tar -xf ${remoteFile} -C ~

    //         # PATH ga qo'shish (bash va zsh uchun)
    //         # echo 'export PATH=~/node_v22.14.0_64/bin:$PATH' | tee -a /etc/profile.d/nodejs.sh > /dev/null
    //         echo 'export PATH=~/node_v22.14.0_64/bin:$PATH' >> ~/.bashrc


    //         # O'zgarishlarni tatbiq qilish
    //         # source /etc/profile.d/nodejs.sh
    //         source ~/.bashrc

    //         # Node.js versiyasini tekshirish
    //         # node -v
    //       `;
    //                 const windowsCommands = `
    //         powershell -Command "Expand-Archive -Path ${remoteFile} -DestinationPath C: -Force

    //         # Avvalgi PATH qiymatini olish
    //         $oldPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::Machine)

    //         # Agar PATH ichida 'C:\\nodejs\\bin' bo‘lmasa, qo‘shamiz
    //         if ($oldPath -notlike '*C:\\nodejs\\bin*') {
    //             $newPath = $oldPath + ';C:\\nodejs\\bin'
    //             [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::Machine)
    //         }

    //         # Joriy sessiyada ham ishlashi uchun PATH ni yangilash
    //         $env:Path += ';C:\\nodejs\\bin'

    //         # Node.js versiyasini tekshirish
    //         node -v
    //         "
    //       `;

    //                 // OS turiga qarab buyruqni bajarish
    //                 conn.exec(
    //                     osType === 'Linux' ? linuxCommands : windowsCommands,
    //                     (err: Error, stream: ClientChannel) => {
    //                         if (err) {
    //                             socket.emit('error', {
    //                                 message: `Nodejs ni o'rnatishda xato yuzaga keldi: ${err.message}\n`,
    //                             });
    //                             // socket.disconnect();
    //                             reject(
    //                                 new WsException(`Nodejs ni o'rnatishda xato yuzaga keldi err: ${err.message}`),
    //                             );
    //                         }

    //                         stream.on('data', (data: Buffer) => {
    //                             console.log(`\x1b[A\x1b[K📦 Nodejs version: ${data.toString()} \x1b[0m`);
    //                             socket.emit('installing', { sessionId, eventName: "Nodejs installing", progress: 100..toFixed(2) });
    //                             socket.emit('data', { sessionId, output: `\x1b[2K\x1b[G📦 Nodejs version: ${data.toString()} \x1b[0m` });
    //                         });

    //                         stream.stderr.on('data', (data: Buffer) => {
    //                             const errorMsg = data.toString();
    //                             console.error('⚠️ Xatoo:', errorMsg);

    //                             // Agar jiddiy xatolik bo‘lsa, jarayonni to‘xtatamiz
    //                             if (
    //                                 errorMsg.includes('command not found') ||
    //                                 errorMsg.includes('Permission denied')
    //                             ) {
    //                                 socket.emit('error', {
    //                                     message: `Nodejs ni o'rnatishda err: ${data.toString()}\n`,
    //                                 });
    //                                 // socket.disconnect();
    //                                 reject(new WsException(`nodejs download stream.stder.on. err: ${err.message}`));
    //                             } else {
    //                                 socket.emit('alert', {
    //                                     message: `Nodejs ni o'rnatishda alert. alert: ${data.toString()}\n`,
    //                                 });
    //                             }
    //                         });

    //                         stream.on('close', () => {
    //                             console.log('✅ Node.js o‘rnatildi!');
    //                             socket.emit('data', { sessionId, output: `\x1b[2K\x1b[GNodejs ni o'rnatildi !\x1b[0m` });
    //                             resolve('success');
    //                         });
    //                     },
    //                 );
    //             });

    //             // ✅ Xatolik yuz bersa oqimni yopish
    //             writeStream.on('error', (err) => {
    //                 console.error('Write stream xatosi:', err);
    //                 writeStream.destroy();
    //                 readStream.destroy();
    //                 sftp.end();
    //             });

    //             readStream.pipe(writeStream);
    //         });
    //     });
    // }

    private async uploadProduct(
        localProjectPath: string,
        osType: string,
        term: {
            socket: Socket,
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

            // console.log('remoteFile: ', remoteFile);
            // console.log('remoteProjectPath: ', remoteProjectPath);

            // Faylni serverga yuborish
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
                    // try {
                    //     readStream.destroy();
                    //     writeStream.destroy();
                    // } catch (err) {
                    //     console.error("Stream'larni yopishda xatolik:", err);
                    // }

                    // try {
                    //     await this.deleteRemoteFile(sftp, remoteFile);
                    // } catch (err) {
                    //     console.error("Faylni o‘chirishda xatolik:", err);
                    // }

                    // try {
                    //     sftp.end();
                    // } catch (err) {
                    //     console.error("SFTP sessiyasini yopishda xatolik:", err);
                    // }

                    // reject('stopped');

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
                    // return;
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
                    console.log(`\x1b[A\x1b[K\x1b[01;34m📦 Product serverga yuklandi\x1b[0m`);
                    // socket.emit('data', { sessionId, output: `\x1b[A\x1b[K\x1b[01;34m📦 Product serverga yuklandi.\x1b[0m` });

                    socket.emit('uploading', { sessionId, eventName: "Product uploading", progress: 100..toFixed(2) });
                    socket.emit('data', { sessionId, output: `\x1b[2K\x1b[G\x1b[01;34m📦 Product serverga yuklandi.\x1b[0m\r\n` });

                    writeStream?.destroy();
                    readStream?.destroy();
                    sftp?.end();
                    resolve('success');


                    //             const linuxCommands = `
                    //     #sudo
                    //     # rm -rf "${remoteProjectPath}"
                    //     #sudo
                    //     # mkdir -p "${remoteProjectPath}"

                    //     #sudo
                    //     tar -xf ${remoteFile} -C ${remoteProjectPath}

                    //     # cd ${remoteProjectPath}/product

                    //     # npm cache add ${remoteProjectPath}/product/pm2-5.4.3.tgz 
                    //     # npm install -g ${remoteProjectPath}/product/pm2-5.4.3.tgz 
                    //     # pm2 start server.js --name my-nest-app --watch

                    //     # node -v
                    //     # npm -v

                    //     # pm2 save
                    //     # pm2 startup
                    //   `;

                    //             const windowsCommands = `
                    //     powershell -Command "
                    //     if (Test-Path -Path ${remoteProjectPath}) {
                    //         Remove-Item -Path ${remoteProjectPath} -Recurse -Force
                    //     }
                    //     New-Item -ItemType Directory -Path ${remoteProjectPath} | Out-Null
                    //     Expand-Archive -Path ${remoteFile} -DestinationPath ${remoteProjectPath} -Force
                    //     "

                    //     # npm cache add ${remoteProjectPath}\\product\\pm2-5.4.3.tgz

                    //     # # npm install -g ${remoteProjectPath}\\product\\pm2-5.4.3.tgz
                    //     # powershell -Command "Start-Process powershell -ArgumentList 'npm install -g ${remoteProjectPath}\\product\\pm2-5.4.3.tgz' -Verb RunAs -Wait"

                    //     # pm2 --version

                    //     # cd ${remoteProjectPath}\\product

                    //     # pm2 start npm --name my-nest-app -- run start:prod

                    //     # pm2 save

                    //     # # pm2 startup
                    //     # powershell -Command "Start-Process powershell -ArgumentList 'pm2 startup' -Verb RunAs -Wait"
                    //   `;

                    // const notExec = ' ';

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
                                reject('stopped');
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

                });

                // ✅ Xatolik yuz bersa oqimni yopish
                writeStream?.on('error', (err: Error) => {
                    // console.error('Write stream xatosi:', err);
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
