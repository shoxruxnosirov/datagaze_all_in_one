// src/ssh/connect.service.ts
import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

import { Client, ConnectConfig, SFTPWrapper } from 'ssh2';
import { IMessage, IServer } from 'src/comman/types';
// import { ConnectDto } from './dto/dtos';

@Injectable()
export class SshConnection {
  private sshClient: Client;
  private isConnected: boolean = false;
  constructor() {
    this.sshClient = new Client;
  }

  async connectToServer(connectConfig: ConnectConfig): Promise<IMessage> {
    return new Promise((resolve, reject) => {
      this.sshClient.on('ready', () => {
        this.isConnected = true;
        resolve({
          "status": "success",
          "message": "Connected successfully.",
        });
      }).on('error', (err: Error) => {
        reject(new HttpException(
          {
            status: 'error',
            message: 'Server is not reachable. Please check the network connection.',
          },
          HttpStatus.BAD_REQUEST,
        ));
      }).connect(connectConfig);
    });
  }

  // async checkSshStatus(): Promise<'online' | 'offline'> {
  //   try {
  //     await this.sshClient.list('/');
  //     return 'online';
  //   } catch (error) {
  //     return 'offline';
  //   }
  // }

  // async autoConnect(connectConfig: ConnectConfig): Promise<IMessage> {
  //   if (await this.checkSshStatus() === 'offline') {
  //     await this.sshClient.connect(connectConfig);
  //   }
  //   return {
  //     status: 'success',
  //     message: 'connection active'
  //   }
  // }

  // async uploadFile(localFilePath: string, remoteFilePath: string): Promise<IMessage> {
  //   return new Promise((resolve, reject) => {
  //     this.conn.sftp((err: Error, sftp: SFTPWrapper) => {
  //       if (err) reject(new InternalServerErrorException(`SSH Connection Failed: ${err.message}`));
  //       const readStream = fs.createReadStream(localFilePath);
  //       const writeStream = sftp.createWriteStream(remoteFilePath);
  //       writeStream.on('close', () => {
  //         resolve({
  //           message: 'File Uploaded Successfully',
  //           status: 'success'
  //         });
  //       });
  //       readStream.pipe(writeStream);
  //     });
  //   });
  // }

  // async cpFile(localFilePath: string, remoteFilePath: string): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     this.sshClient.sftp((err: Error, sftp: SFTPWrapper) => {
  //       if (err) {
  //         reject(new InternalServerErrorException(`SSH ulanishda xatolik: ${err.message}`));
  //       }

  //       sftp.fastPut(localFilePath, remoteFilePath, (err: Error) => {
  //         if (err) {
  //           reject(new InternalServerErrorException(`SSH ulanishda xatolik: ${err.message}`));
  //         }
  //         resolve(`File uploaded to ${remoteFilePath}`);
  //       });
  //     });
  //   })
  // }

  async disconnectFromServer(): Promise<IMessage> {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        return reject(
          new HttpException(
            {
              status: 'error',
              message: 'No active SSH connection to disconnect.',
            },
            HttpStatus.BAD_REQUEST,
          ),
        );
      }

      this.sshClient.on('close', () => {
        this.isConnected = false;
        resolve({
          status: 'success',
          message: 'Disconnected successfully.',
        });
      });

      this.sshClient.end();
    });
  }

  async uploadDirectory(sftp: SFTPWrapper, localPath: string, remotePath: string): Promise<void> {
    // Masofadagi papkani yaratish (agar mavjud bo'lmasa)
    await new Promise((resolve, reject) => {
      sftp.mkdir(remotePath, (err) => {
        if (err && err.code !== 4) reject(err); // Agar boshqa xatolik bo‘lsa
        else resolve(true); // Agar papka mavjud bo‘lsa, davom etamiz
      });
    });

    const files = await fs.promises.readdir(localPath, { withFileTypes: true });

    for (const file of files) {
      const localFilePath = path.join(localPath, file.name);
      const remoteFilePath = path.join(remotePath, file.name);

      if (file.isDirectory()) {
        await this.uploadDirectory(sftp, localFilePath, remoteFilePath);
      } else {
        // Faylni yuklash
        await new Promise((resolve, reject) => {
          sftp.fastPut(localFilePath, remoteFilePath, (err) => {
            if (err) reject(err);
            else resolve(true);
          });
        });
      }
    }
  }

  async deployProject(config: {
    localProjectPath: string;
    remoteProjectPath: string;
    startCommand: string;
  }): Promise<string> {
    return new Promise((resolve, reject) => {

      this.sshClient.sftp(async (err, sftp) => {
        if (err) {
          this.sshClient.end();
          return reject(`SFTP Error: ${err.message}`);
        }

        try {
          // Papkani yuklash
          await this.uploadDirectory(sftp, config.localProjectPath, config.remoteProjectPath);
          console.log('Files uploaded successfully');

          await this.uploadAndInstallNodeJS();

          // Masofada `npm install` va start qilish
          this.sshClient.exec(`cd ${config.remoteProjectPath} && npm install && ${config.startCommand}`, (err, stream) => {
            if (err) {
              this.sshClient.end();
              return reject(`Command Execution Error: ${err.message}`);
            }

            let output = '';
            stream
              .on('data', (data) => {
                output += data.toString();
                console.log('OUTPUT:', data.toString());
              })
              .on('close', (code, signal) => {
                // this.sshClient.end();
                if (code === 0) {
                  resolve(`Deployment successful. Output: ${output}`);
                } else {
                  reject(`Deployment failed with code: ${code} and signal: ${signal}`);
                }
              });
          });
        } catch (uploadErr) {
          // this.sshClient.end();
          reject(`File Upload Error: ${uploadErr.message}`);
        }
      });
    });
  }

  async uploadAndInstallNodeJS(): Promise<string> {
    return new Promise((resolve, rejact) => {
      this.sshClient.exec('uname -s 2>/dev/null || systeminfo | findstr /B /C:"OS Name"', (err: Error, stream) => {
        if (err) throw err;
  
        let osType = '';
  
        stream.on('data', (data) => {
          osType += data.toString();
        });
  
        stream.on('close', async () => {
          osType = osType.trim();
  
          if (osType.includes('Linux')) {
            console.log('🔹 Server: Linux');
            this.uploadNodeJs('', '', 'Linux', {resolve, rejact});
          } else if (osType.includes('Windows')) {
            console.log('🔹 Server: Windows');
            this.uploadNodeJs('','','Windows', {resolve, rejact});
            
          } else {
            console.log('⚠️ Noma’lum operatsion tizim!');
            // conn.end();
          }
        });
        //   this.sshClient.exec(
        //     `
        //     curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash - &&
        //     sudo apt-get install -y nodejs &&
        //     node -v
        //     `,
        //     (err, stream) => {
        //       if (err) return reject(`Node.js install error: ${err.message}`);
  
        //       stream
        //         .on('data', (data) => {
        //           console.log('Node.js Install Output:', data.toString());
        //         })
        //         .on('close', (code) => {
        //           if (code === 0) resolve();
        //           else reject('Node.js installation failed');
        //         });
        //     },
        //   );
        // });
      });
    })
  }

   // ✅ Linux serverga Node.js o‘rnatish
   private async uploadNodeJs(file_path: string, remoteFile: string, osType: 'Linux' | 'Windows', {resolve, rejact}) {
      // const remoteFile = `/home/${SERVER_CONFIG.username}/node.tar.xz`;

      // Faylni serverga yuborish
      this.sshClient.sftp((err, sftp) => {
        if (err) rejact(err.message);

        const readStream = fs.createReadStream(file_path);
        const writeStream = sftp.createWriteStream(remoteFile);

        writeStream.on('close', () => {
          console.log('📦 Fayl serverga yuklandi. Endi o‘rnatilmoqda...');
          this.sshClient.exec(
            osType === 'Linux' 
            ? 
            `tar -xf ${remoteFile} && sudo mv node-v*-linux-x64 /usr/local/nodejs && echo 'export PATH=/usr/local/nodejs/bin:$PATH' >> ~/.bashrc && source ~/.bashrc && node -v`
            : `powershell -Command "Expand-Archive -Path ${remoteFile} -DestinationPath C:\\nodejs" && echo "✅ Node.js Windows uchun o‘rnatildi."`,
        
            (err, stream) => {
              if (err) rejact(err.message);
              stream.on('data', (data) => console.log(data.toString()));
              stream.on('close', () => resolve('success'));
            }
          );
        });

        readStream.pipe(writeStream);
      });
    }




}
