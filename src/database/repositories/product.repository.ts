import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { WsException } from '@nestjs/websockets';

import { Knex } from 'knex';
import { Message, Server, ProductOne, Product, ProductList } from 'src/comman/types';

import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';
import { CreateProductDto } from 'src/modules/v1/product/dto/addProcuct.dto';
import { ConnectDto } from 'src/modules/v1/ssh/dto/dtos';

@Injectable()
export class ProductRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  async getAllProducts(): Promise<ProductList[]> {
    const result = await this.knex<Product>('products').select('*');
    return result.map((product) => ({
      id: product.id,
      name: product.name,
      icon: product.icon,
      version: product.serverVersion,
      installed: product.serverId ? true : false,

      publisher: product.publisher,
      agentVersion: product.agentVersion,
      serverFileSize: product.serverFileSize,
      agentFileSize: product.agentFileSize,
    }));
  }

  async getProductForDeploy(
    id: string,
  ): Promise<{ serverFilePath: string; installScript?: string }> {
    try {
      const result = await this.knex<Product>('products')
        .select(['serverFilePath', 'installScript'])
        .where({ id })
        .first();

      if (!result) {
        throw new NotFoundException(`Admin with id ${id} not found.`);
      } else {
        return result;
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error instanceof NotFoundException) {
          throw error;
        } else {
          throw new BadRequestException(`Database error: ${error.message}`);
        }
      } else {
        // console.log('get product for deploy err: ' + error);
        throw new BadRequestException(`Database error: ${error}`);
      }
    }
  }

  async getProduct(id: string): Promise<ProductOne> {
    const product = (await this.knex<Product>('products')
      .leftJoin('servers', 'products.serverId', 'servers.id')
      .where('products.id', id)
      .select('products.*', this.knex.raw('servers.host as serverhost'))
      .first()) as Product & { serverhost: string | null };

    if (product === undefined) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    } else {
      const _product = {
        id: product.id,
        name: product.name,
        icon: product.icon,
        version: product.serverVersion,
        installed: product.serverId ? true : false,
      };
      if (product.serverhost !== null) {
        return {
          ..._product,
          size: product.serverFileSize,
          company: product.publisher,
          description: product.description,
          computerCounts: product.computerCount,
          firstUploadAt: product.firstUploadAt,
          lastUploadAt: product.lastUploadAt,
          serverHost: product.serverhost,
        };
      } else {
        return {
          ..._product,
          size: product.serverFileSize,
          company: product.publisher,
          description: product.description,
          supportOS: product.supportOS,
          requiredCpuCore: product.requiredCpuCore,
          requiredRam: product.requiredRam,
          requiredStorage: product.requiredStorage,
          requiredNetwork: product.requiredNetwork,
        };
      }
    }
  }

  async addServerAndUpdateProduct(serverData: ConnectDto, productId: string): Promise<void> {
    const result = await this.knex
      .with('new_server', (qb) => {
        qb.insert(serverData).into('servers').returning(['id']);
      })
      .update({ serverId: this.knex.raw('(SELECT id FROM new_server)') })
      .from<Product>('products')
      .where('id', productId)
      .returning('*');

    if (!result.length) {
      throw new WsException('Product not found');
    }

    // const [newServer] = await this.knex<Server>('servers')
    //     .insert(serverData)
    //     .returning(['id']);

    // if (!newServer) {
    //     throw new WsException('Server yaratilmadi');
    // }

    // const result = await this.knex<Product>('products')
    //     .where('id', productId)
    //     .update({ serverId: newServer.id })
    //     .returning('*');

    // if (!result.length) {
    //     throw new WsException('Product not found');
    // }
  }

  async updateServerForProduct(productId: string, serverData: ConnectDto): Promise<Message> {
    const result = await this.knex<Server>('servers')
      .update(serverData)
      .where('id', this.knex.select('serverId').from('products').where('id', productId))
      .returning('*');

    if (!result.length) {
      throw new HttpException('Server or Product not found', HttpStatus.NOT_FOUND);
    }

    return {
      status: 'success',
      message: 'Server updated successfully',
    };
  }

  async getServerCredentials(productId: string): Promise<Server> {
    const server = await this.knex<Product>('products')
      .join<Server>('servers', 'products.serverId', 'servers.id')
      .where('products.id', productId)
      .select<Server>('servers.*')
      .first();

    if (!server) {
      throw new WsException(`Server not found by produectId: ${productId}`);
    }

    return server;
  }

  async deleteServerForProduct(id: string): Promise<ProductOne> {
    const result = await this.knex
      .with('deleted_server', (qb) => {
        qb.from('servers')
          .where('id', this.knex('products').where('id', id).select('serverId'))
          .delete();
      })
      .select<Product>('products.*')
      .from<Product>('products')
      .where('products.id', id)
      .first();

    if (!result) {
      throw new HttpException('Product not found', HttpStatus.NOT_FOUND);
    }

    return {
      id: result.id,
      name: result.name,
      icon: result.icon,
      version: result.serverVersion,
      installed: false,
      size: result.serverFileSize,
      company: result.publisher,
      supportOS: result.supportOS,
      requiredCpuCore: result.requiredCpuCore,
      requiredRam: result.requiredRam,
      requiredStorage: result.requiredStorage,
      requiredNetwork: result.requiredNetwork,
    };
  }

  async deleteProduct(id: string): Promise<Message> {
    const result = await this.knex<Product>('products').where({ id }).del().returning('*');

    if (result.length === 0) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Product not found',
        },
        HttpStatus.NOT_FOUND,
      );
    }

    return {
      status: 'success',
      message: 'remove product account successfull',
    };
  }

  async create(productData: CreateProductDto): Promise<Message & { id: string }> {
    try {
      const [insertedId] = await this.knex<Product>('products').insert(productData).returning('id');

      return {
        message: 'Mahsulot muvaffaqiyatli qo‘shildi!',
        status: 'success',
        id: insertedId.id,
      };
    } catch (error: unknown) {
      if (error instanceof Error) {
        throw new BadRequestException(`Xatolik: ${error.message}`);
      } else {
        console.log(error);
        throw new Error('bu xatolik chiqmasa frontga bormaydi');
      }
    }
  }
}
