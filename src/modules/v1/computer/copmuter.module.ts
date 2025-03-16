import { Module } from "@nestjs/common";
import { ComputersService } from "./computer.service";
import { ComputersController } from "./computer.controller";

import { DatabaseModule } from '../../../database/workWithDB/database.module';
import { ComputerRepository } from "src/database/repositories/computer.repository";
// import { DatabaseModule } from "../database.module";

@Module({
  imports: [DatabaseModule],
  controllers: [ComputersController],
  providers: [ComputersService, ComputerRepository],
})
export class ComputersModule {}
