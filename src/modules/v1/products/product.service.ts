import { Injectable } from '@nestjs/common';
import { IProduct } from 'src/comman/types';
import { ProductRepository } from 'src/database/repositories/product.repository';

@Injectable()
export class ProductsService {
  constructor(
    private procuctRepository: ProductRepository
  ) { }


  async findAll(): Promise<({ id: string, name: string, version: string, icon: string, installed: boolean })[]> {
    return this.procuctRepository.getAllProducts();
  }

  async findOne(id: string): Promise<{id: string, name: string, icon?: string, version: string, installed: boolean} & ({  size: number, company: string, description?: string, supportOS: string, requiredCpuCore: number, requiredRam: number, requiredStorage: number, requiredNetwork: number } | { size: number, company: string, description?: string, supportOS: string, computerCounts: number, firstUploadAt?: Date, lastUploadAt?: Date, serverHost: string })> {
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