import { Injectable } from '@nestjs/common';

import { ConnectConfig } from 'ssh2';

import { SshConnection } from './ssh.connection';
import { SshRepository } from 'src/database/repositories/ssh.repository';
import { IMessage, IProduct, IServer } from 'src/comman/types';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { ConnectDto } from './dto/dtos';

@Injectable()
export class SshService {

    constructor(
        private sshRepository: SshRepository,
        private connectServer: SshConnection,
        // private productRepository: ProductRepository
    ) {}

    async storeSshCredentials(data: {connectConfig: ConnectConfig, productData: IProduct}) {
        // const connectMs: IMessage = await this.connectServer.connectToServer(data.connectConfig);
        
        await this.connectServer.deployProject({
            localProjectPath: data.productData.file_url,
            // remoteProjectPath: data.productData.download_path,
            // startCommand: 'npm run start',
            serverCredentials: data.connectConfig
        });

        const newServer: IServer = await this.sshRepository.storeSshCredentials(data.connectConfig);


        return { server_id: newServer.id};
    }

    async deployProject(config: {
        localProjectPath: string;
        // remoteProjectPath: string;
        // startCommand: string;
        serverCredentials: ConnectDto
      }) {
        await this.connectServer.deployProject(config);
        const newServer: IServer = await this.sshRepository.storeSshCredentials(config.serverCredentials);
        return newServer;
      }

    async checkSshStatus(serverId: string) {
        const server = await this.sshRepository.getSshStatus(serverId);
        const ssh_status = await this.connectServer.checkSshStatus();
        return {
            status: 'success',
            server_id: server.id,
            last_checked: server.last_checked,
            ssh_status,
        }
    }

    async autoConnect(serverId: string): Promise<IMessage> {
        const {id, last_checked, ...serverData} = await this.sshRepository.getServerData(serverId);
        return this.connectServer.autoConnect(serverData);
    }

}
