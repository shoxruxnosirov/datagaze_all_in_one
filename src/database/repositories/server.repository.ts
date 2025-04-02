import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';

import { Knex } from 'knex';

import { Server } from 'src/comman/types';
import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';
import { ConnectDto } from 'src/modules/v1/product/dto/update.serverConnect.dto';

@Injectable()
export class SshRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async getSshStatus(serverId: string): Promise<Server> {
    const server: Server | undefined = await this.knex<Server>('servers')
      .where({ id: serverId })
      .first();
    if (!server) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Server not found in the database.',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return server;
  }

  async storeSshCredentials(connectConfig: ConnectDto): Promise<Server> {
    const serverData = await this.knex<Server>('servers').insert(connectConfig).returning('*');
    if (serverData.length !== 0) {
      return serverData[0];
    } else {
      throw new HttpException(
        {
          status: 'error',
          message: 'ulanish muvofaqiyatli saqlashda muammo',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  async getServerData(serverId: string): Promise<Server> {
    const serverData: Server | undefined = await this.knex<Server>('servers')
      .where({ id: serverId })
      .first();
    if (serverData) {
      return serverData;
    } else {
      throw new HttpException(
        {
          status: 'error',
          message: 'Server not found in the database.',
        },
        HttpStatus.NOT_FOUND,
      );
    }
  }
}
