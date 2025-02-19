import { Module } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../database/database.module';
import { AdminRepository } from 'src/repositories/admin.repository';

@Module({
  imports: [DatabaseModule],
  providers: [AdminService, JwtService, AdminRepository],
  controllers: [AdminController],
  exports: [JwtService],
})
export class AdminModule {}
