import { Injectable, Inject } from "@nestjs/common";
import { Knex } from "knex";
import { Computer } from "./entities/computer.model";
import { ComputerRepository } from "src/database/repositories/computer.repository";
import { IComputer } from "./interface/computer";
import { IApplication } from "./interface/application";

@Injectable()
export class ComputersService {
  constructor(
    private computerRepository: ComputerRepository,
  ) {}

  async getAllComputers(): Promise<IComputer[]> {
    return this.computerRepository.getAllComputers();
  }

  async getComputerById(id: number): Promise<IComputer> {
    return this.computerRepository.getComputerById(id);
  }

  async getApplications(computerId: string, page: number): Promise<{ data: IApplication[], currentPage: number, totalPages: number, totalRecords: number }> {
    return this.computerRepository.getApplicationsByComputerId(computerId, page);
  }
}
