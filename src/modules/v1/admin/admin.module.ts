import { Module } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { DatabaseModule } from '../../../database/workWithDB/database.module';
import { AdminRepository } from 'src/database/repositories/admin.repository';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { RolesGuardForRefreshToken } from 'src/comman/guards/refreshToken.guard';

@Module({
  imports: [DatabaseModule],
  providers: [AdminService, JwtService, AdminRepository, RolesGuard, RolesGuardForRefreshToken],
  controllers: [AdminController],
  exports: [AdminRepository],
})
export class AdminModule {}
