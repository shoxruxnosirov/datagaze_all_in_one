import { Injectable } from '@nestjs/common';
import { IProduct } from 'src/comman/types';
import { ProductRepository } from 'src/database/repositories/product.repository';

@Injectable()
export class ProductsService {
  constructor(
    private procuctRepository: ProductRepository
  ) {}

  
  async findAll(): Promise<(IProduct & {serverHost: string | null })[]> {
    return this.procuctRepository.getAllProducts();
  }

  async findOne(id: string): Promise<IProduct & {serverHost: string | null }> {
    return this.procuctRepository.getProduct(id);
  }



  // async create(productData: ProductDto): Promise<IProduct> {
  //   return this.procuctRepository.create(productData);
  // }

  // async update(id: string, productData: ProductData): Promise<IProduct> {
  //   return this.procuctRepository.findByIdAndUpdate(id, productData);
  // }

  // async delete(id: string): Promise<IProduct> {
  //   return this.procuctRepository.findByIdAndDelete(id);
  // }
}