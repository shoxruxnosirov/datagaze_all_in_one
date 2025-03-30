import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards, ParseUUIDPipe, UploadedFiles, Res, UseInterceptors, Req } from '@nestjs/common';
import { ProductsService } from './product.service';
import { Message, ProductList, ProductOne, Role } from 'src/comman/types';
import { Roles } from 'src/comman/decorators/roles.decorator';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { ConnectDto } from '../ssh/dto/dtos';
import { Response } from 'express';

import { FileUploadInterceptor } from 'src/comman/interceptors/product-upload.interceptor';
import { CreateProductDtoForSwagger } from './dto/add.productForSwagger.dto';
import { CreateProductDto } from './dto/addProcuct.dto';

@Controller('api/products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
  ) { }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get all products' })
  @ApiBearerAuth()
  async getAll(): Promise<ProductList[]> {
    return this.productsService.findAll();
  }

  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get product' })
  @ApiParam({ name: 'id', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  async getOne(
    @Param('id', new ParseUUIDPipe({ version: '4' })) id: string
  ): Promise<ProductOne> {
    return this.productsService.findOne(id);
  };


  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload product files and metadata' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: CreateProductDtoForSwagger })
  @UseInterceptors(FileUploadInterceptor.getInterceptor())
  async uploadFiles(
    @UploadedFiles() files: { icon?: Express.Multer.File[]; server?: Express.Multer.File[]; agent?: Express.Multer.File[] },
    @Body() body: CreateProductDto,
    @Res() res: Response
  ): Promise<Response> {
    const data = await this.productsService.saveData(files, body);
    return res.status(201).json(data);
  }

  @Delete(':productId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete product' })
  @ApiParam({ name: 'productId', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  async deleteProduct(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) id: string
  ): Promise<Message> {
    return this.productsService.deleteProduct(id);
  }


  @Delete(':productId/server')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete server for product' })
  @ApiParam({ name: 'productId', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  async deleteServerForProduct(
    @Param('productId', new ParseUUIDPipe({ version: '4' })) id: string
  ): Promise<ProductOne> {
    return this.productsService.deleteServerForProduct(id);
  }

  @Put(':productId/server')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update server for product' })
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
  ): Promise<Message> {
    return this.productsService.updateServerForProduct(productId, serverData);
  }

}