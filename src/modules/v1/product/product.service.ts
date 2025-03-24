import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { IMessage, IProduct, IServer } from 'src/comman/types';
import { ProductRepository } from 'src/database/repositories/product.repository';
import { ConnectDto } from '../ssh/dto/dtos';

import * as fs from 'fs';

@Injectable()
export class ProductsService {
  constructor(
    private procuctRepository: ProductRepository
  ) { }


  async findAll(): Promise<({ id: string, name: string, version: string, icon: string, installed: boolean, publisher: string, agentVersion: string, serverFileSize: string, agentFileSize: string })[]> {
    return this.procuctRepository.getAllProducts();
  }

  async findOne(
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
    return this.procuctRepository.getProduct(id);
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
    return this.procuctRepository.deleteServerForProduct(id);
  }
  async deleteProduct(
    id: string
  ): Promise<IMessage> {
    return this.procuctRepository.deleteProduct(id);
  }

  async updateServerForProduct(productId: string, serverData: ConnectDto): Promise<IMessage> {
    return this.procuctRepository.updateServerForProduct(productId, serverData);
  }



  async saveData(files, body): Promise<any> {

    if (!files.icon || !files.server || !files.agent) {
      throw new HttpException(
        {
          status: 'error',
          message: '3 ta faylni ham jo‘nating!'
        },
        HttpStatus.BAD_REQUEST
      );
    }

    const baseFolder = `./uploads/products/${body.name}`;
    const serverFolder = `${baseFolder}/server/${body.serverVersion}`;
    const agentFolder = `${baseFolder}/agent/${body.agentVersion}`;

    if (!fs.existsSync(baseFolder)) fs.mkdirSync(baseFolder, { recursive: true });
    if (!fs.existsSync(serverFolder)) fs.mkdirSync(serverFolder, { recursive: true });
    if (!fs.existsSync(agentFolder)) fs.mkdirSync(agentFolder, { recursive: true });

    fs.renameSync(files.server[0].path, `${serverFolder}/${files.server[0].filename}`);
    fs.renameSync(files.agent[0].path, `${agentFolder}/${files.agent[0].filename}`);


    // Fayl yo‘llari
    const iconPath = `/icons/${files.icon[0].filename}`;
    const serverFilePath = `./uploads/products/${body.name}/server/${body.serverVersion}/${files.server[0].filename}`;
    const agentFilePath = `./uploads/products/${body.name}/agent/${body.agentVersion}/${files.agent[0].filename}`;

    // Fayl hajmlari
    // const iconSize = fs.statSync(`.${iconPath}`).size;
    const serverFileSize =  Math.floor(fs.statSync(`${serverFilePath}`).size / (1024 * 1024));
    const agentFileSize =  Math.floor(fs.statSync(`${agentFilePath}`).size / (1024 * 1024));

    const dataToSave = {
      name: body.name,
      icon: iconPath,
      serverVersion: body.serverVersion,
      agentVersion: body.agentVersion,
      serverFilePath,
      serverFileSize,
      agentFilePath,
      agentFileSize,
      publisher: body.publisher,
      installScript: body.installScript,
      updateScript: body.updateScript,
      deleteScript: body.deleteScript
    };

    return this.procuctRepository.create(dataToSave);

    // return {
    //   message: 'Fayllar saqlandi!',
    //   data: 'savedRecord',
    // };
  }

  // async update(id: string, productData: ProductData): Promise<IProduct> {
  //   return this.procuctRepository.findByIdAndUpdate(id, productData);
  // }

  // async delete(id: string): Promise<IProduct> {
  //   return this.procuctRepository.findByIdAndDelete(id);
  // }
}