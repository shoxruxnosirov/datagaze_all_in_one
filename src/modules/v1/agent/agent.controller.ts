import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, Res, Req, UseGuards } from "@nestjs/common";
import { AgentsService } from "./agen.service";
import { Computer } from "./entities/computer.model";
import { ApiBearerAuth, ApiOperation, ApiParam, ApiQuery } from "@nestjs/swagger";
import { CreateComputerDto } from "./dto/computer";
import { Response } from "express";
import { IApplication } from "./interface/application";
import { ApplicationDto } from "./dto/application";
import { IRequestAgent } from "src/comman/types";
import { AgentGuard } from "src/comman/guards/agent.guard";

@Controller("agent")
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) { }

  @Post('computer/register-or-update')
  async computerRegisterOrUpdate(@Body() computerData: CreateComputerDto, @Res() res: Response): Promise<Response> {
    const { token, status } = await this.agentsService.createOrUpdate(computerData);
    return res.status(status === 'registered' ? 201 : 200).json({ token, status });
  }

  @Post('application/register')
  @UseGuards(AgentGuard)
  @ApiOperation({ summary: 'register or update applications' })
  @ApiBearerAuth()
  async applicationRegister(@Body() applications: ApplicationDto[], @Req() req: IRequestAgent, @Res() res: Response): Promise<Response> {

    console.log('computer: ', req.agent);
    applications.forEach(app => {
      app.remoteId = app.id;
      app.computerId = req.agent.computerId;
      delete app.id;
    });
    console.log('applications: ', applications);

    const result = await this.agentsService.applicationRegister(applications, req.agent.computerId);

    return res.status(200).json(result);
  }



  // @Get()
  // getAll() {
  //   return this.computersService.getAllComputers();
  // }

  // @Get(":computerId")
  // @ApiParam({ name: "computerId", type: "string", required: true, description: "Kompyuterning ID si" })
  // getById(@Param("computerId", new ParseUUIDPipe({ version: '4' })) computerId: number) {
  //   return this.computersService.getComputerById(computerId);
  // }

  // @Get(":computerId/applications")
  // @ApiOperation({ summary: "Kompyuterga tegishli ilovalarni olish" })
  // @ApiParam({ name: "computerId", type: "string", required: true, description: "Kompyuterning ID si" })
  // @ApiQuery({ name: "page", type: Number, required: false, description: "Sahifa raqami (default: 1)" })
  // getApplications(@Param("computerId", new ParseUUIDPipe({ version: '4' })) computerId: string, @Query('page') page?: number,) {  
  //   return this.computersService.getApplications(computerId, page ?? 1);
  // }



}
