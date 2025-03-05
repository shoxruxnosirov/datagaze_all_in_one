import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';

import { Knex } from 'knex';
import { IProduct, IServer } from 'src/comman/types';

import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';
import { ConnectDto } from 'src/modules/v1/ssh/dto/dtos';

@Injectable()
export class ProductRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) { }

  async getAllProducts(): Promise<(IProduct & {serverHost: string | null })[]> {
    return this.knex('products')
      .leftJoin('servers', 'products.serverId', 'servers.id')
      .select(
        'products.*',
        this.knex.raw('servers.host as serverHost')
      );
  }
  

  async getProduct(id: string): Promise<IProduct & { serverHost: string | null }> {
    return this.knex('products')
      .leftJoin('servers', 'products.serverId', 'servers.id')
      .where('products.id', id)
      .select(
        'products.*',
        this.knex.raw('servers.host as serverHost')
      )
      .first();
  }

  async addServerAndUpdateProduct(serverData: ConnectDto, productId: string) {
    return this.knex.transaction(async (trx) => {
      // 1. `servers` jadvaliga yangi ma'lumot qo'shamiz
      const [server] = await trx('servers')
        .insert(serverData)
        .returning(['id']); // ID ni qaytarib olamiz (PostgreSQL ishlatilsa)

      // 2. `products` jadvalidagi `server_id` ni yangilaymiz
      await trx('products')
        .where({ id: productId })
        .update({ serverId: server.id });

      return server;
    });
  }
  
}