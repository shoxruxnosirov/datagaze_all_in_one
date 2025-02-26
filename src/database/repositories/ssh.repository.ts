import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';

import { Knex } from 'knex';

import { ConnectConfig } from 'ssh2';


import { AuthType, IServer } from 'src/comman/types';
import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';
import { ConnectDto } from 'src/modules/v1/ssh/dto/dtos';
// import { ConnectDto } from 'src/modules/v1/ssh/dto/dtos';

@Injectable()
export class SshRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) { }

  // async connect(server_credential: ConnectDto) {
  //     const result = await this.knex<IServer>('Servers')
  //         .insert(server_credential)
  //         .returning('*');

  //     return result;

  // }
  async getSshStatus(serverId: string): Promise<IServer> {
    const server: IServer | undefined = await this.knex<IServer>('servers').where({ id: serverId }).first();
    if(!server) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Server not found in the database.',
        },
        HttpStatus.NOT_FOUND,
      )
    }

    // await this.knex('servers').where({ id: server.id }).update({ last_checked: Date.now() }).returning('*');
    return server;
  }

  // async getSshFailureLogs(serverId: string) {
  //   return await this.knex<IServer>('Servers').where({ server_id: serverId, type: 'error' }).select('*');
  // }

  async storeSshCredentials(connectConfig: ConnectDto): Promise<IServer> {
    const serverData = await this.knex<IServer>('servers').insert(connectConfig).returning('*');
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

  async getServerData(serverId: string): Promise<IServer> {
    const serverData: IServer | undefined = await this.knex<IServer>('servers').where({ id: serverId }).first();
    if(serverData){
      return serverData;
    } else {
      throw new HttpException(
        {
          status: 'error',
          message: 'Server not found in the database.',
        },
        HttpStatus.NOT_FOUND,
      )
    }
  }
  // async autoLogin(serverId: string) {
  //   return await this.knex<IServer>('Servers').where({ server_id: serverId }).select('*');
  // }
}