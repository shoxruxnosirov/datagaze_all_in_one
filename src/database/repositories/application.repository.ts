import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { Knex } from 'knex';
import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';

@Injectable()
export class ApplicationRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) {}

  /** Barcha application larni olish */
  async getAllApplications(): Promise<any[]> {
    return await this.knex('applications').select('*');
  }

  /** ID bo‘yicha application ni olish */
  async getApplicationById(id: number): Promise<any> {
    const application = await this.knex('applications').where('id', id).first();
    if (!application) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }
    return application;
  }

  /** Yangi application qo‘shish */
  async createApplication(data: any): Promise<{ id: number }> {
    const [newApplication] = await this.knex('applications').insert(data).returning(['id']);
    return newApplication;
  }

  /** Application ni yangilash */
  async updateApplication(id: number, data: any): Promise<{ message: string }> {
    const updatedCount = await this.knex('applications').where('id', id).update(data);
    if (!updatedCount) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Application updated successfully' };
  }

  /** Application ni o‘chirish */
  async deleteApplication(id: number): Promise<{ message: string }> {
    const deletedCount = await this.knex('applications').where('id', id).delete();
    if (!deletedCount) {
      throw new HttpException('Application not found', HttpStatus.NOT_FOUND);
    }
    return { message: 'Application deleted successfully' };
  }
}
