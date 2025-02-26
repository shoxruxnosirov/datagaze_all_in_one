// src/products/products.module.ts
import { Module } from '@nestjs/common';
import { ProductsController } from './product.controller';
import { ProductsService } from './product.service';
import { ProductRepository } from 'src/database/repositories/product.repository';
// import { RolesGuard } from 'src/comman/guards/roles.guard';
import { JwtService } from '@nestjs/jwt';

@Module({
  imports: [],
  controllers: [ProductsController],
  providers: [ProductsService, ProductRepository, JwtService],
  exports: [JwtService]
})
export class ProductsModule {}