// src/ssh/connect.service.ts
import { HttpException, HttpStatus, Injectable, InternalServerErrorException } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Writable } from 'stream';
import { Client, ConnectConfig, SFTPWrapper, ClientChannel } from 'ssh2';

import { IMessage, IServer } from 'src/comman/types';
import { ConnectDto } from './dto/dtos';
import { Response } from 'express';
import { Readable } from 'stream';

@Injectable()
export class SshConnection {
  private sshClient: Client;
  private isConnected: boolean = false;
  constructor() {
    this.sshClient = new Client;
  }

  async connectToServer(connectConfig: ConnectDto, res: Response): Promise<Client> {
    return new Promise((resolve, reject) => {
      this.sshClient.on('ready', () => {
        res.write(`${connectConfig.host}:${connectConfig.port} serverga ulanish muvofaqqiyatli amalga oshirildi\n`)
        resolve(this.sshClient);
      });
      
      this.sshClient.on('error', (err: Error) => {
        res.write(`Serverda xatolik yuzaga keldi: ${err.message}\n`);
        res.end();
        reject(new HttpException(
          {
            status: 'error',
            message: 'Server is not reachable. Please check the network connection.'
          },
          HttpStatus.BAD_REQUEST,
        ));
      }).connect(connectConfig);
    });
  }

  async checkSshStatus(): Promise<'online' | 'offline'> {
    try {
      await this.sshClient.list('/');
      return 'online';
    } catch (error) {
      return 'offline';
    }
  }

  async autoConnect(connectConfig: ConnectConfig): Promise<IMessage> {
    if (await this.checkSshStatus() === 'offline') {
      await this.sshClient.connect(connectConfig);
    }
    return {
      status: 'success',
      message: 'connection active'
    }
  }

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

  private async disconnectFromServer(conn: Client): Promise<IMessage> {
    return new Promise((resolve, reject) => {
      conn.removeAllListeners('error');
      conn.on('close', () => {
        this.isConnected = false;
        resolve({
          status: 'success',
          message: 'Disconnected successfully.',
        });
      });

      conn.on('error', (err: Error) => {
        reject(
          new HttpException(
            {
              status: 'error',
              message: 'Error occurred while disconnecting: ' + err.message,
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          )
        );
      });

      conn.end();
    });
  }

  // private async uploadDirectory(sftp: SFTPWrapper, localPath: string, remotePath: string): Promise<void> {
  //   // Masofadagi papkani yaratish (agar mavjud bo'lmasa)
  //   await new Promise((resolve, reject) => {
  //     sftp.mkdir(remotePath, (err) => {
  //       if (err && err.code !== 4) reject(err); // Agar boshqa xatolik bo‘lsa
  //       else resolve(true); // Agar papka mavjud bo‘lsa, davom etamiz
  //     });
  //   });

  //   const files = await fs.promises.readdir(localPath, { withFileTypes: true });

  //   for (const file of files) {
  //     const localFilePath = path.join(localPath, file.name);
  //     const remoteFilePath = path.join(remotePath, file.name);

  //     if (file.isDirectory()) {
  //       await this.uploadDirectory(sftp, localFilePath, remoteFilePath);
  //     } else {
  //       // Faylni yuklash
  //       await new Promise((resolve, reject) => {
  //         sftp.fastPut(localFilePath, remoteFilePath, (err) => {
  //           if (err) reject(err);
  //           else resolve(true);
  //         });
  //       });
  //     }
  //   }
  // }

  async deployProject(config: {
    localProjectPath: string;
    serverCredentials: ConnectDto
  }, res: Response): Promise<string | any> {

    // return new Promise(async (resolve, reject) => {

    const conn = await this.connectToServer(config.serverCredentials, res);

    const osType = await this.findOsType(conn, res);

    console.log('nodejs ni o\'rnaish');

    // await this.uploadAndInstallNodeJS(conn, osType, res);

    const startCommand: string = 'npm run start';  //'config.startCommand'

    // await this.uploadDirectory(sftp, config.localProjectPath, remoteProjectPath);
    await this.uploadProduct(conn, config.localProjectPath, osType, res, startCommand);

    await this.disconnectFromServer(conn);
  }


  private async findOsType(conn: Client, res: Response): Promise<string> {
    return new Promise((resolve, reject) => {
      conn.exec('uname -s 2>/dev/null || systeminfo | findstr /B /C:"OS Name"', (err: Error, stream: ClientChannel) => {
        if (err) {
          res.write(`Ulanilgan server OS turini aniqlashda xatolik yuzaga keldi\n`);
          res.end();
          reject(
            new HttpException(
              {
                status: 'error',
                message: 'OS turini aniqlashda xatolik: ' + err.message,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
          // return;
        }

        let osType = '';

        stream.on('data', (data) => {
          osType += data.toString();
        });

        stream.on('close', () => {
          osType = osType.trim();
          res.write(`${osType} OS turidagi server ekanligi aniqlandi\n`);

          resolve(osType);
        });

        stream.on('error', (error: Error) => {
          res.write(`Ulanilgan server OS turini aniqlashda xatolik yuzaga keldi ! \n`);
          res.end();
          reject(
            new HttpException(
              {
                status: 'error',
                message: 'Stream xatosi: ' + error.message,
              },
              HttpStatus.INTERNAL_SERVER_ERROR,
            ),
          );
        });
      });
    });
  }


  // private async uploadAndInstallNodeJS(conn: Client, osType: string): Promise<string> {
  //   return new Promise((resolve, reject) => {
  //     if (osType.includes('Linux')) {
  //       console.log('🔹 Server: Linux');
  //       this.uploadNodeJs(conn, 'Linux', { resolve, reject });
  //     } else if (osType.includes('Windows')) {
  //       console.log('🔹 Server: Windows');
  //       this.uploadNodeJs(conn, 'Windows', { resolve, reject });
  //     } else {
  //       console.log('⚠️ Noma’lum operatsion tizim!');
  //       reject(new HttpException(
  //         {
  //           status: 'error',
  //           message: 'server os type windows yoki Linux emas'
  //         },
  //         HttpStatus.INTERNAL_SERVER_ERROR,
  //       ));
  //     }
  //   })
  // }

  private async uploadAndInstallNodeJS(conn: Client, osType: string, res: Response) {
    return new Promise((resolve, reject) => {
      let remoteFile: string;
      let localFilePath: string;
      if (osType === 'Windows') {
        remoteFile = `C:\\Users\\Administrator\\Downloads\\nodejs.zip`;
        localFilePath = path.join(process.cwd(), 'products', 'nodejs', 'node_v22.14.0_64.zip');
      } else //if (osType === 'Linux')
      {
        remoteFile = `node.tar.xz`;
        localFilePath = path.join(process.cwd(), 'products', 'nodejs', 'node_v22.14.0_64.tar.xz');
      }

      console.log('localFilePath:', localFilePath);
      // Faylni serverga yuborish
      conn.sftp((err: Error, sftp: SFTPWrapper) => {
        if (err) {
          res.write('Nodejs uploads SFTP ulanish xatosi: ' + err.message + '\n');
          res.end();

          reject(new HttpException(
          {
            status: 'error',
            message: 'Nodejs uploads SFTP ulanish xatosi: ' + err.message
          },
          HttpStatus.INTERNAL_SERVER_ERROR,
        ))
      };

        const fileSize = fs.statSync(localFilePath).size;
        let uploadedSize = 0;
        console.log(`Uploading: 0%`);

        const readStream = fs.createReadStream(localFilePath);
        const writeStream: Writable = sftp.createWriteStream(remoteFile);

        readStream.on('data', (chunk) => {
          uploadedSize += chunk.length;
          const progress = ((uploadedSize / fileSize) * 100).toFixed(2);
          console.log(`Uploading: ${progress}%`);

          // SSE orqali progressni front-end'ga uzatish
          res.write(`upload:  NodeJs ${progress}\n\n`);
        });

        writeStream.on('close', () => {
          console.log('📦 Fayl serverga yuklandi. Endi o‘rnatilmoqda...');
          // res.write(`data: 100\n\n`);
          res.write(`Nodejs ko'chirilib o'tkazildai o'rnatilish boshlandi\n`);

          const linuxCommands = `
                        # sudo rm -rf /usr/local/nodejs_temp
                        # sudo mkdir -p /usr/local/nodejs_temp
              
                        # sudo rm -rf /usr/local/node_v22.14.0_64
              
                        # Node.js arxivini ochish
                        # sudo tar -xf ${remoteFile} -C /usr/local/nodejs_temp/
            sudo tar -xf ${remoteFile} -C /usr/local/
  
                        # Ochilgan katalog nomini aniqlash
                        # NODE_DIR=$(ls -d /usr/local/nodejs_temp/*/ | head -n 1)
              
                        # /usr/local/nodejs papkani yaratamiz
                        # sudo rm -rf /usr/local/nodejs
                        # sudo mkdir -p /usr/local/nodejs
              
                        # Node.js katalogini kerakli joyga ko'chirish
                        # sudo mv "$NODE_DIR" /usr/local/nodejs
              
                        # sudo rm -rf /usr/local/nodejs_temp
              
            # PATH ga qo'shish (bash va zsh uchun)
            echo 'export PATH=/usr/local/node_v22.14.0_64/bin:$PATH' | sudo tee -a /etc/profile.d/nodejs.sh > /dev/null
  
            # O'zgarishlarni tatbiq qilish
            source /etc/profile.d/nodejs.sh
  
            # Node.js versiyasini tekshirish
            node -v
          `
          // const windowsCommands = `
          //   powershell -Command "
          //   # C:\\nodejs katalogi mavjudligini tekshirish va yaratish
          //   if (-Not (Test-Path 'C:\\nodejs')) {
          //       New-Item -ItemType Directory -Path 'C:\\nodejs' | Out-Null
          //   }

          //   # Node.js zip faylini ochish (ichidagi katalog nomini aniqlash uchun avval vaqtincha joyga ochamiz)
          //   $extractPath = 'C:\\nodejs_temp'
          //   if (Test-Path $extractPath) {
          //       Remove-Item -Recurse -Force $extractPath
          //   }
          //   New-Item -ItemType Directory -Path $extractPath | Out-Null
          //   Expand-Archive -Path '${remoteFile}' -DestinationPath $extractPath -Force

          //   # Ochilgan katalog nomini topish
          //   $nodeDir = Get-ChildItem -Path $extractPath | Select-Object -ExpandProperty Name

          //   # Agar eski Node.js katalogi mavjud bo‘lsa, uni o‘chirib tashlash
          //   if (Test-Path 'C:\\nodejs') {
          //       Remove-Item -Recurse -Force 'C:\\nodejs'
          //   }

          //   # Yangi katalogni to‘g‘ri joyga ko‘chirish
          //   Move-Item -Path "$extractPath\\$nodeDir" -Destination 'C:\\nodejs'

          //   # Tozalik uchun vaqtinchalik katalogni o‘chirish
          //   Remove-Item -Recurse -Force $extractPath

          //   # Avvalgi PATH qiymatini olish
          //   $oldPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::Machine)

          //   # Agar PATH ichida 'C:\\nodejs\\bin' bo‘lmasa, qo‘shamiz
          //   if ($oldPath -notlike '*C:\\nodejs\\bin*') {
          //       $newPath = $oldPath + ';C:\\nodejs\\bin'
          //       [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::Machine)
          //   }

          //   # Joriy sessiyada ham ishlashi uchun PATH ni yangilash
          //   $env:Path += ';C:\\nodejs\\bin'

          //   # Node.js versiyasini tekshirish
          //   node -v
          //   "
          // `;

          const windowsCommands = `
            powershell -Command "Expand-Archive -Path ${remoteFile} -DestinationPath C: -Force
            
            # Avvalgi PATH qiymatini olish
            $oldPath = [System.Environment]::GetEnvironmentVariable('Path', [System.EnvironmentVariableTarget]::Machine)
  
            # Agar PATH ichida 'C:\\nodejs\\bin' bo‘lmasa, qo‘shamiz
            if ($oldPath -notlike '*C:\\nodejs\\bin*') {
                $newPath = $oldPath + ';C:\\nodejs\\bin'
                [System.Environment]::SetEnvironmentVariable('Path', $newPath, [System.EnvironmentVariableTarget]::Machine)
            }
  
            # Joriy sessiyada ham ishlashi uchun PATH ni yangilash
            $env:Path += ';C:\\nodejs\\bin'
  
            # Node.js versiyasini tekshirish
            node -v
            "
          `;


          // OS turiga qarab buyruqni bajarish
          conn.exec(osType === 'Linux' ? linuxCommands : windowsCommands, (err: Error, stream: ClientChannel) => {
            if (err) {
              res.write(`Nodejs ni o'rnatishda xato yuzaga keldi\n`);
              reject(new HttpException(
                {
                  status: 'error',
                  message: 'nodejs install O‘rnatish xatosi: ' + err.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
              ));
            }


            stream.on('data', (data: Buffer) => {
              res.write(data.toString() + '\n');
              console.log('📌 Output:', data.toString())
            });

            stream.stderr.on('data', (data: Buffer) => {
              res.write(`Nodejs ni o'rnatishda kichik xato: ` + data.toString() + '\n');
              const errorMsg = data.toString();
              console.error('⚠️ Xatoo:', errorMsg);

              // Agar jiddiy xatolik bo‘lsa, jarayonni to‘xtatamiz
              if (errorMsg.includes('command not found') || errorMsg.includes('Permission denied')) {
                res.write(`Nodejs ni o'rnatishda xato: ` + data.toString() +'\n');
                res.end();
                reject(new HttpException(
                  {
                    status: 'error',
                    message: 'nodejs download stream.stder.on : ' + errorMsg
                  },
                  HttpStatus.INTERNAL_SERVER_ERROR,
                ));
              } else {
                res.write(`Nodejs ni o'rnatishda kichik xato: ` + data.toString() + '\n');
              }
            });

            stream.on('close', () => {
              console.log('✅ Node.js o‘rnatildi!');
              res.write(`Nodejs ni o'rnatildi !\n`);
              resolve('success');
            });
          });
        });

        readStream.pipe(writeStream);
      });
    });
  }

  private async uploadProduct(conn: Client, localProjectPath: string, osType: string, res: Response, srartCommend: string): Promise<string> {
    return new Promise((resolve, reject) => {
      let remoteFile: string = '';
      let remoteProjectPath: string = '';

      if (osType === 'Windows') {
        localProjectPath = path.join(localProjectPath, 'product.zip');
        remoteFile = 'C:\\Users\\Administrator\\Downloads\\product.zip';
        remoteProjectPath = 'C:';
      } else //if (osType === 'Linux') 
      {
        localProjectPath = path.join(localProjectPath, 'product.tar.xz');
        remoteFile = `product.tar.xz`;
        remoteProjectPath = '/var/www';
      }

      console.log("remoteFile: ", remoteFile);

      console.log("remoteProjectPath: ", remoteProjectPath);

      // Faylni serverga yuborish
      conn.sftp((err: Error, sftp:SFTPWrapper) => {
        if (err) {
          res.write(`Product ko'chirib o'tkazish uchun ulanishda xatolik\n`);
          res.end();
          reject(new HttpException(
            {
              status: 'error',
              message: 'Product uploads SFTP ulanish xatosi: ' + err.message
            },
            HttpStatus.INTERNAL_SERVER_ERROR,
          ));
        }

        const fileSize = fs.statSync(localProjectPath).size;
        let uploadedSize = 0;

        const readStream = fs.createReadStream(localProjectPath);
        const writeStream = sftp.createWriteStream(remoteFile);

        readStream.on('data', (chunk) => {
          uploadedSize += chunk.length;
          const progress = ((uploadedSize / fileSize) * 100).toFixed(2);
          console.log(`Uploading: ${progress}%`);
  
          // SSE orqali progressni front-end'ga uzatish
          res.write(`upload:  Product ${progress}\n\n`);
        });



        writeStream.on('close', () => {
          console.log('📦 Fayl serverga yuklandi. Endi arxivdan ochilmoqda...');
          res.write(`Product uploading comlated \n`);

          const linuxCommands = `
                      #!/bin/bash
            
                      # Vaqtinchalik katalog yaratish
                      # mkdir -p ~/temp_extract
            
                      # Agar remoteProjectPath mavjud bo‘lmasa, yaratamiz
                      # sudo rm -rf "${remoteProjectPath}"
                      # sudo mkdir -p "${remoteProjectPath}"
            
                      # ZIP faylni ochish
                      # sudo tar -xJf "${remoteFile}" -C ~/temp_extract
                      # sudo tar -xJf "${remoteFile}" -C ${remoteProjectPath}
            sudo tar -xf ${remoteFile} -C ${remoteProjectPath}
  
                      # Arxiv ichidagi fayllarni ko‘chirish
                      # sudo mv ~/temp_extract/* "${remoteProjectPath}"
            
                      # Vaqtinchalik ochilgan katalogni tozalash
                      # sudo rm -rf ~/temp_extract
            
                      # pm2-5.4.3.tgz faylini npm cashga qo'shish
                      # npm cache add "${remoteProjectPath}/product/pm2-5.4.3.tgz" 
                      # sudo        npm cache add ${remoteProjectPath}/product/pm2-5.4.3.tgz
                      # npm cache add ${remoteProjectPath}/product/pm2-5.4.3.tgz

                      # npm config set cache ./npm-cache
            
                      # pm2-5.4.3.tgz faylini global o‘rnatish
                      # sudo        npm install -g ${remoteProjectPath}/product/pm2-5.4.3.tgz
                      # npm install -g ${remoteProjectPath}/product/pm2-5.4.3.tgz
            
                      # O'rnatilganligini tekshirish
                      # sudo pm2 --version
          
            # Loyiha PM2 orqali ishga tushiriladi (avtomatik yuklanadigan qilib sozlaymiz)
            cd ${remoteProjectPath}/product
  
                      # shu yerda ishga tushurish uchun  startCommandan foydalanish mumkin
                      # sudo       pm2 start server.js --name my-nest-app --watch 
                      # pm2 start server.js --name my-nest-app --watch
            
            sudo npm cache add ${remoteProjectPath}/product/pm2-5.4.3.tgz 
            sudo npm install -g ${remoteProjectPath}/product/pm2-5.4.3.tgz 
            sudo pm2 start server.js --name my-nest-app --watch
  
                        # node server.js

                        # PM2 ni avtomatik yuklanadigan qilish
                        # sudo        pm2 save
                        # pm2 save
                        # sudo        pm2 startup
                        # pm2 startup

                        # touch ~/file.txt
                        # /usr/local/node_v22.14.0_64/bin/npm -v > ~/file.txt

          `;


          // const windowsCommands = `
          //   powershell -Command "
          //   # ZIP faylni vaqtincha ochish uchun katalog yaratamiz
          //   $tempExtractPath = 'C:\\temp_extract'
          //   if (Test-Path $tempExtractPath) {
          //       Remove-Item -Recurse -Force $tempExtractPath
          //   }
          //   New-Item -ItemType Directory -Path $tempExtractPath | Out-Null

          //   # ZIP faylni vaqtincha katalogga ochish
          //   Expand-Archive -Path '${remoteFile}' -DestinationPath $tempExtractPath -Force

          //   # Agar remoteProjectPath mavjud bo‘lmasa, uni yaratamiz
          //   if (-Not (Test-Path '${remoteProjectPath}')) {
          //       New-Item -ItemType Directory -Path '${remoteProjectPath}' | Out-Null
          //   }

          //   # Fayllarni ko‘chirish
          //   Move-Item -Path \"$tempExtractPath\\*\" -Destination \"${remoteProjectPath}\" -Force

          //   # Vaqtinchalik katalogni tozalash
          //   Remove-Item -Recurse -Force $tempExtractPath

          //   # pm2-5.4.3.tgz faylini global o‘rnatish
          //   npm install -g \"${remoteProjectPath}\\pm2-5.4.3.tgz\" --offline

          //   # O'rnatilganligini tekshirish
          //   pm2 --version

          //   # Loyiha PM2 orqali ishga tushiriladi
          //   cd \"${remoteProjectPath}\"
          //   pm2 start npm --name my-nest-app -- run start:prod

          //   # PM2 ni avtomatik yuklanadigan qilish
          //   pm2 save
          //   pm2 startup
          // "
          // `;

          const windowsCommands = `

            powershell -Command "Expand-Archive -Path ${remoteFile} -DestinationPath ${remoteProjectPath} -Force"

            npm cache add ${remoteProjectPath}\\product\\pm2-5.4.3.tgz

            npm install -g "${remoteProjectPath}\\product\\pm2-5.4.3.tgz"

            pm2 --version

            cd "${remoteProjectPath}\\product"

            pm2 start npm --name my-nest-app -- run start:prod

            pm2 save
            pm2 startup
          `;


          `
          # C:\\install_project.ps1
            param (
                [string]$remoteFile,
                [string]$remoteProjectPath
            )
  
            # ZIP faylni vaqtincha ochish uchun katalog yaratamiz
            $tempExtractPath = 'C:\\temp_extract'
            if (Test-Path $tempExtractPath) {
                Remove-Item -Recurse -Force $tempExtractPath
            }
            New-Item -ItemType Directory -Path $tempExtractPath | Out-Null
  
            # ZIP faylni vaqtincha katalogga ochish
            Expand-Archive -Path $remoteFile -DestinationPath $tempExtractPath -Force
  
            # Agar remoteProjectPath mavjud bo‘lmasa, uni yaratamiz
            if (-Not (Test-Path $remoteProjectPath)) {
                New-Item -ItemType Directory -Path $remoteProjectPath | Out-Null
            }
  
            # Fayllarni ko‘chirish
            Move-Item -Path \"$tempExtractPath\\*\" -Destination \"$remoteProjectPath\" -Force
  
            # Vaqtinchalik katalogni tozalash
            Remove-Item -Recurse -Force $tempExtractPath
          `;
          // const windowsCommand = `powershell -ExecutionPolicy Bypass -File "C:\\install_project.ps1" -remoteFile "${remoteFile}" -remoteProjectPath "${remoteProjectPath}"`;

          // OS turiga qarab buyruqni bajarish
          conn.exec(osType === 'Linux' ? linuxCommands : windowsCommands, (err: Error, stream: ClientChannel) => {
            if (err) {
              res.write(`Product deloying Error: ${err.message}\n`);
              reject(new HttpException(
                {
                  status: 'error',
                  message: 'productni axrivdan ochishda xatolik: ' + err.message,
                },
                HttpStatus.INTERNAL_SERVER_ERROR,
              ));
            }


            stream.on('data', (data: Buffer) => console.log('📌 Output:', data.toString()));
            stream.stderr.on('data', (data: Buffer) => {
              const errorMsg = data.toString();
              console.error('⚠️ Xato:', errorMsg);

              // Agar jiddiy xatolik bo‘lsa, jarayonni to‘xtatamiz
              if (errorMsg.includes('command not found') || errorMsg.includes('Permission denied')) {
                res.write(`Product deploying Error: ${err.message}\n`);
                reject(
                  new HttpException(
                    {
                      status: 'error',
                      message: 'productni arxivdan ochishda yoki loyihani saqlashda stream.stder.on : ' + errorMsg
                    },
                    HttpStatus.INTERNAL_SERVER_ERROR,
                  )
                );
              } else {
                res.write(`Product deploying warring: ${err.message}\n`);
              }
            });

            stream.on('close', () => {
              console.log('✅ product ishlashni boshladi');
              res.write(`Product deploying comlated \n`);
              resolve('success');
            });
          });
        });

        readStream.pipe(writeStream);
      });

    });
  }

}
