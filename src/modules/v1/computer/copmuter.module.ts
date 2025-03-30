import { Module } from '@nestjs/common';
import { ComputersService } from './computer.service';
import { ComputersController } from './computer.controller';

import { DatabaseModule } from '../../../database/workWithDB/database.module';
import { ComputerRepository } from 'src/database/repositories/computer.repository';
import { AdminModule } from '../admin/admin.module';
import { AgentGateway } from '../sockets/agent/agent.gateway';
import { JwtService } from '@nestjs/jwt';
import { FrontendGateway } from '../sockets/frondend/computers/computer.gateway';
// import { DatabaseModule } from "../database.module";

@Module({
  imports: [DatabaseModule, AdminModule],
  controllers: [ComputersController],
  providers: [ComputersService, ComputerRepository, AgentGateway, FrontendGateway, JwtService],
})
export class ComputersModule {}
