import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseUUIDPipe, UploadedFiles, Res, UseInterceptors, Req } from '@nestjs/common';
import { ProductsService } from './product.service';
import { IMessage, IProduct, Role } from 'src/comman/types';
// import { SshConnection } from '../ssh/ssh.connection';
import { Roles } from 'src/comman/decorators/roles.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { ConnectDto } from '../ssh/dto/dtos';
import { Response } from 'express';

import { FileFieldsInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import * as fs from 'fs';
import { FileUploadInterceptor } from 'src/comman/interceptors/product-upload.interceptor';
import { BeforeUploadInterceptor } from 'src/comman/interceptors/beforeUpload.interceptor';

@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    // private readonly sshConnection: SshConnection
  ) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get all products' })
  @ApiBearerAuth()
  async getAll(): Promise<({ id: string, name: string, version: string, icon: string, installed: boolean })[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get product' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
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
    return this.productsService.findOne(id);
  };


  @Post('upload')
  @UseInterceptors(BeforeUploadInterceptor, FileUploadInterceptor.getInterceptor())
  async uploadFiles(@UploadedFiles() files, @Body() body: { name: string; publisher: string; serverVersion: string; agentVersion: string; installScript: string; updateScript: string; deleteScript: string }, @Req() req, @Res() res: Response) {

    console.log('@Body() body: ', body);
    
    if (!files.icon || !files.server || !files.agent) {
      return res.status(400).json({ message: '3 ta faylni ham jo‘nat!' });
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
    const iconPath = `./uploads/icons/${files.icon[0].filename}`;
    const serverFilePath = `./uploads/products/${body.name}/server/${body.serverVersion}/${files.server[0].filename}`;
    const agentFilePath = `./uploads/products/${body.name}/agent/${body.agentVersion}/${files.agent[0].filename}`;

    // Fayl hajmlari
    // const iconSize = fs.statSync(`.${iconPath}`).size;
    const serverFileSize = fs.statSync(`${serverFilePath}`).size;
    const agentFileSize = fs.statSync(`${agentFilePath}`).size;

    const dataToSave = {
      name: body.name,
      icon: iconPath,
      serverVersion: body.serverVersion,
      agentVersion: body.agentVersion,
      serverFilePath,
      serverFileSize,
      agentFilePath,
      agentFileSize,
      publisher:body.publisher
    };

    const savedRecord = await this.productsService.saveData(dataToSave);

    res.json({
      message: 'Fayllar saqlandi!',
      data: 'savedRecord',
    });
  }

  @Delete(':productId/server')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Delete server for product' })
  @ApiBearerAuth()
  @ApiParam({ name: 'productId', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  async deleteServerForProduct(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) id: string
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
    return this.productsService.deleteServerForProduct(id);
  }

  @Put(':productId/server')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update server for product' })
  @ApiBearerAuth()
  @ApiParam({ name: 'productId', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        host: { default: '34.203.244.210', type: 'string', description: 'server host' },
        port: { default: '22', type: 'string', description: 'server port' },
        username: { default: 'ubuntu', type: 'string', description: 'server username' },
        password: { default: 'New_admin_pass_123', type: 'string', description: 'server password' },
      }
    },
  })
  async updateServerForProduct(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) productId: string,
    @Body() serverData: ConnectDto
  ): Promise<IMessage> {
    return this.productsService.updateServerForProduct(productId, serverData);
  }


  // @Post()
  // async transferFile(@Body() body: { localPath: string; remotePath: string }): Promise<string> {
  //   return this.sshConnection.cpFile(body.localPath, body.remotePath);
  // }

  // @Put(':id')
  // async update(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string, @Body() productData: Product): Promise<Product> {
  //   return this.productsService.update(id, productData);
  // }

  // @Delete(':id')
  // @UseGuards(RolesGuard)
  // @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  // @ApiOperation({ summary: 'Delete procuct' })
  // @ApiBearerAuth()
  // @ApiParam({ name: 'id', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  // async delete(@Param('id', new ParseUUIDPipe({ version: '4' })) id: string): Promise<Product> {
  //   return this.productsService.delete(id);
  // }
}