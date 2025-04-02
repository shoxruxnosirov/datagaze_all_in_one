import { Injectable } from '@nestjs/common';
import { ComputerRepository } from 'src/database/repositories/computer.repository';
import { AgentGateway } from '../sockets/agent/agent.gateway';
import { Application, Computer, ComputerForList, ListWithPagination } from 'src/comman/types';

@Injectable()
export class ComputersService {
  constructor(
    private computerRepository: ComputerRepository,
    private agentGateway: AgentGateway,
  ) {}

  async getAllComputers(
    page: number,
    pageSize: number,
  ): Promise<ListWithPagination<ComputerForList>> {
    const computers = await this.computerRepository.getAllComputers(page, pageSize);
    const activeAgents = this.agentGateway.activeAgents();
    computers.data.forEach((computer) => {
      if (activeAgents.includes(computer.id)) {
        computer.activity = 'Active';
      } else {
        computer.activity = 'Inactive';
      }
    });
    return computers;
  }

  async getComputerById(id: string): Promise<Computer> {
    return this.computerRepository.getComputerById(id);
  }

  async getApplications(
    computerId: string,
    page: number,
    pageSize: number,
  ): Promise<ListWithPagination<Application>> {
    return this.computerRepository.getApplicationsByComputerId(computerId, page, pageSize);
  }
}
