import { forwardRef, Module } from '@nestjs/common';
import { ComputersService } from './computer.service';
import { ComputersController } from './computer.controller';

import { DatabaseModule } from '../../../database/workWithDB/database.module';
import { ComputerRepository } from 'src/database/repositories/computer.repository';
import { AdminModule } from '../admin/admin.module';
import { JwtService } from '@nestjs/jwt';
import { FrontendGateway } from '../sockets/frondend/computers/computer.gateway';
import { AgentsModule } from '../agent/agent.module';

@Module({
  imports: [DatabaseModule, AdminModule, forwardRef(() => AgentsModule)],
  controllers: [ComputersController],
  providers: [ComputersService, ComputerRepository, JwtService, FrontendGateway],
  exports: [FrontendGateway]
})
export class ComputersModule { }
