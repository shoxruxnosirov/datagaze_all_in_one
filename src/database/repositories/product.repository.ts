import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { Knex } from 'knex';
import { IMessage, IProduct, IServer } from 'src/comman/types';

import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';
import { ConnectDto } from 'src/modules/v1/ssh/dto/dtos';

@Injectable()
export class ProductRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) { }

  async getAllProducts(): Promise<({ id: string, name: string, version: string, icon: string, installed: boolean })[]> {
    return (
      await this.knex('products')
        .leftJoin('servers', 'products.serverId', 'servers.id')
        .select(
          'products.*',
          this.knex.raw('servers.host as serverHost')
        )
    ).map(product => ({
      id: product.id,
      name: product.name,
      version: product.version,
      icon: product.icon,
      installed: product.serverId ? true : false,
    })
    );
  }

  async getProductForDeploy(id: string): Promise<{ fileUrl: string }> {
    return this.knex('products')
      .where('products.id', id)
      .select('products.fileUrl')  // Select only the urlPath column
      .first();
  }

  async getProduct(
    id: string
  ): Promise<
    {
      id: string;
      name: string;
      icon?: string;
      version: string;
      installed: boolean;
      size: number;
      company: string;
      description?: string;
    } & (
      | {
        supportOS: string;
        requiredCpuCore: number;
        requiredRam: number;
        requiredStorage: number;
        requiredNetwork: number;
      }
      | {
        computerCounts: number;
        firstUploadAt?: Date;
        lastUploadAt?: Date;
        serverHost: string;
      }
    )
  > {
    const product: IProduct & { serverhost: string | null } = await this.knex('products')
      .leftJoin('servers', 'products.serverId', 'servers.id')
      .where('products.id', id)
      .select(
        'products.*',
        this.knex.raw('servers.host as serverhost')
      )
      .first();
    if (product === undefined) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    } else {
      const _product: { id: string, name: string, icon?: string, version: string, installed: boolean } = {
        id: product.id,
        name: product.name,
        icon: product.icon,
        version: product.version,
        installed: product.serverId ? true : false,
      }
      if (product.serverhost !== null) {
        return {
          ..._product,
          size: product.size,
          company: product.company,
          description: product.description,
          computerCounts: product.computerCount,
          firstUploadAt: product.firstUploadAt,
          lastUploadAt: product.lastUploadAt,
          serverHost: product.serverhost,
        }
      } else {
        return {
          ..._product,
          size: product.size,
          company: product.company,
          description: product.description,
          supportOS: product.supportOS,
          requiredCpuCore: product.requiredCpuCore,
          requiredRam: product.requiredRam,
          requiredStorage: product.requiredStorage,
          requiredNetwork: product.requiredNetwork,
        }
      }
    }
  }

  // async addServerAndUpdateProduct(serverData: ConnectDto, productId: string) {
  //   return this.knex.transaction(async (trx) => {
  //     // 1. `servers` jadvaliga yangi ma'lumot qo'shamiz
  //     const [server] = await trx('servers')
  //       .insert(serverData)
  //       .returning(['id']); // ID ni qaytarib olamiz (PostgreSQL ishlatilsa)

  //     // 2. `products` jadvalidagi `server_id` ni yangilaymiz
  //     await trx('products')
  //       .where({ id: productId })
  //       .update({ serverId: server.id });

  //     return server;
  //   });
  // }

  async addServerAndUpdateProduct(serverData: ConnectDto, productId: string): Promise<void> {
    const result = await this.knex
      .with('new_server', (qb) => {
        qb.insert(serverData).into('servers').returning('*');
      })
      .update({ serverId: this.knex.raw('(SELECT id FROM new_server)') })
      .from('products')
      .where('id', productId)
      .returning([
        'products.*',
        this.knex.raw('(SELECT id FROM new_server) AS serverId'),
      ]);

    if (!result.length) {
      throw new WsException('Product not found');
    }
    // return {
    //   product: {
    //     id: result[0].id,
    //     name: result[0].name,
    //     icon: result[0].icon,
    //     version: result[0].version,
    //     installed: Boolean(result[0].serverId),
    //     size: result[0].size,
    //     company: result[0].company,
    //     supportOS: result[0].supportOS,
    //     requiredCpuCore: result[0].requiredCpuCore,
    //     requiredRam: result[0].requiredRam,
    //     requiredStorage: result[0].requiredStorage,
    //     requiredNetwork: result[0].requiredNetwork,
    //   },
    //   server: {
    //     id: result[0].serverId, // Yangi yaratilgan server ID
    //   },
    // };
  }

  async updateServerForProduct(productId: string, serverData: ConnectDto): Promise<IMessage> {
    const result: IServer[] = await this.knex('servers')
      .update(serverData)
      .where('id', function () {
        this.select('serverId')
          .from('products')
          .where('id', productId);
      })
      .returning('*');

    if (!result.length) {
      throw new HttpException('Server or Product not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: 'success',
      message: 'Server updated successfully',
    };
  }

  async getServerCredentials(productId: string): Promise<IServer> {
    const server = await this.knex('products')
      .join('servers', 'products.serverId', 'servers.id')
      .where('products.id', productId)
      .select('servers.*')
      .first();

    if (!server) {
      throw new WsException(`Server not found by produectId: ${productId}`);
    }

    return server;
  }

  async deleteServerForProduct(
    id: string
  ): Promise<
    {
      id: string;
      name: string;
      icon?: string;
      version: string;
      installed: boolean;
      size: number;
      company: string;
      description?: string;
      supportOS: string;
      requiredCpuCore: number;
      requiredRam: number;
      requiredStorage: number;
      requiredNetwork: number;
    }
  > {
    const result = await this.knex
      .with('deleted_server', (qb) => {
        qb.from('servers')
          .where('id', this.knex('products').where('id', id).select('serverId'))
          .delete();
      })
      .select('products.*')
      .from('products')
      .where('products.id', id)
      .first();

    if (!result) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: result.id,
      name: result.name,
      icon: result.icon,
      version: result.version,
      installed: false,
      size: result.size,
      company: result.company,
      supportOS: result.supportOS,
      requiredCpuCore: result.requiredCpuCore,
      requiredRam: result.requiredRam,
      requiredStorage: result.requiredStorage,
      requiredNetwork: result.requiredNetwork,
    };
  }
}