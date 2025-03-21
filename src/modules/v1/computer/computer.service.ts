import { Injectable, Inject } from "@nestjs/common";
import { Knex } from "knex";
import { ComputerRepository } from "src/database/repositories/computer.repository";
import { IComputer, IComputerForList } from "../agent/interface/computer";
import { IApplication } from "../agent/interface/application";
// import { Computer } from "./entities/computer.model";
// import { IComputer } from "./interface/computer";
// import { IApplication } from "./interface/application";

@Injectable()
export class ComputersService {
  constructor(
    private computerRepository: ComputerRepository,
  ) { }

  async getAllComputers(
    page: number,
    pageSize: number
  ): Promise<
    {
      data: IComputerForList[]
      currentPage: number,
      totalPages: number,
      totalRecords: number
    }
  > {
    return this.computerRepository.getAllComputers(page, pageSize);
  }

  async getComputerById(id: number): Promise<IComputer> {
    return this.computerRepository.getComputerById(id);
  }

  async getApplications(computerId: string, page: number, pageSize: number): Promise<{ data: IApplication[], currentPage: number, totalPages: number, totalRecords: number }> {
    return this.computerRepository.getApplicationsByComputerId(computerId, page, pageSize);
  }
}
