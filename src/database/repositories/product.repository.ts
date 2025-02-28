import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';

import { Knex } from 'knex';
import { IProduct, IServer } from 'src/comman/types';

import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';

@Injectable()
export class ProductRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) { }

  async getAllProducts(): Promise<(IProduct & {server_ip: string | null })[]> {
    return this.knex('products')
      .leftJoin('servers', 'products.server_id', 'servers.id')
      .select(
        'products.*',
        this.knex.raw('servers.host as server_ip')
      );
  }
  

  async getProduct(id: string): Promise<IProduct & { server_ip: string | null }> {
    return this.knex('products')
      .leftJoin('servers', 'products.server_id', 'servers.id')
      .where('products.id', id)
      .select(
        'products.*',
        this.knex.raw('servers.host as server_ip')
      )
      .first();
  }


  
}