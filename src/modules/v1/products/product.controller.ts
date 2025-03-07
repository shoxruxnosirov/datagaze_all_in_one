import { Controller, Get, Post, Body, Param, Put, Delete, UseGuards } from '@nestjs/common';
import { ProductsService } from './product.service';
import { IProduct, Role } from 'src/comman/types';
// import { SshConnection } from '../ssh/ssh.connection';
import { Roles } from 'src/comman/decorators/roles.decorator';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam } from '@nestjs/swagger';
import { RolesGuard } from 'src/comman/guards/roles.guard';

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
  @ApiOperation({ summary: 'Get all products' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', required: true, example: '123e4567-e89b-12d3-a456-426614174000' })
  async getOne(@Param('id') id: string): Promise<{ id: string, name: string, icon?: string, version: string, size: number, company: string, description?: string, supportOS: string, requiredCpuCore: number, requiredRam: number, requiredStorage: number, requiredNetwork: number } | { id: string, name: string, icon?: string, version: string, size: number, company: string, description?: string, supportOS: string, computerCounts: number, firstUploadAt?: Date, lastUploadAt?: Date, serverHost: string }> {
    return this.productsService.findOne(id);
  }

  // @Post()
  // async transferFile(@Body() body: { localPath: string; remotePath: string }): Promise<string> {
  //   return this.sshConnection.cpFile(body.localPath, body.remotePath);
  // }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() productData: Product): Promise<Product> {
  //   return this.productsService.update(id, productData);
  // }

  // @Delete(':id')
  // async delete(@Param('id') id: string): Promise<Product> {
  //   return this.productsService.delete(id);
  // }
}