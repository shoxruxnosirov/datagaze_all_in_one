import { forwardRef, Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { AgentsService } from './agent.service';
import { AgentsController } from './agent.controller';
import { DatabaseModule } from '../../../database/workWithDB/database.module';
import { ComputerRepository } from 'src/database/repositories/computer.repository';
import { ComputersModule } from '../computer/copmuter.module';
import { AgentGateway } from '../sockets/agent/agent.gateway';

@Module({
  imports: [DatabaseModule, forwardRef(() => ComputersModule)],
  controllers: [AgentsController],
  providers: [AgentsService, ComputerRepository, JwtService, AgentGateway],
  exports: [AgentGateway],
})
export class AgentsModule {}
