import { Module } from "@nestjs/common";
import { AgentsService } from "./agen.service";
import { AgentsController } from "./agent.controller";

import { DatabaseModule } from '../../../database/workWithDB/database.module';
import { ComputerRepository } from "src/database/repositories/computer.repository";
import { JwtService } from "@nestjs/jwt";
// import { DatabaseModule } from "../database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [AgentsController],
  providers: [AgentsService, ComputerRepository, JwtService],
})
export class AgentsModule {}
