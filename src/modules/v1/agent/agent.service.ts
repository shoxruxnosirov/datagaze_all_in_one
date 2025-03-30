import { Injectable, Inject, HttpStatus } from "@nestjs/common";
import { ComputerRepository } from "src/database/repositories/computer.repository";
import { CreateComputerDto } from "./dto/computer";
import { AGENT_TOKEN_SECRET } from "src/config/env";
import { JwtService } from "@nestjs/jwt";
import { ApplicationDto } from "./dto/application";

@Injectable()
export class AgentsService {
  constructor(
    private jwtService: JwtService,
    private computerRepository: ComputerRepository,
  ) {}

  async createOrUpdate(computerData: CreateComputerDto): Promise<{token: string, status: string}> {
    const { computerId, key, status } = await this.computerRepository.createOrUpdate(computerData);
    const token = this.jwtService.sign({ computerId, key }, {
      secret: AGENT_TOKEN_SECRET,
      // expiresIn: AGENT_TOKEN_EXPIRATION,
    });
    return {
      token,
      status
    }
  }

  async applicationRegister(applications: ApplicationDto[], computerId: string): Promise<{name: string; status: string}[]> {
    return this.computerRepository.applicationRegister(applications, computerId);
  }

}
