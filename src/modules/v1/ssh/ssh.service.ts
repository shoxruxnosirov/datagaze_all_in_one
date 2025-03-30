import { Injectable } from '@nestjs/common';

import { Response } from 'express';

import { SshConnection } from './ssh.connection';
import { SshRepository } from 'src/database/repositories/server.repository';
import { Message, Product, Server } from 'src/comman/types';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { ConnectDto } from './dto/dtos';

@Injectable()
export class SshService {
  constructor(
    private sshRepository: SshRepository,
    private connectServer: SshConnection,
    private productRepository: ProductRepository,
  ) {}

  async deployProject(
    config: {
      productId: string;
      serverCredentials: ConnectDto;
    },
    res: Response,
  ) {
    const { serverFilePath } = await this.productRepository.getProductForDeploy(config.productId);
    await this.connectServer.deployProject(
      { localProjectPath: serverFilePath, serverCredentials: config.serverCredentials },
      res,
    );
    const newServer: Server = await this.sshRepository.storeSshCredentials(
      config.serverCredentials,
    );
    return newServer;
  }
}
