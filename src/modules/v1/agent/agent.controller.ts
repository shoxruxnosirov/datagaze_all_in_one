import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  Res,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AgentsService } from './agent.service';
import { Computer } from './entities/computer.model';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiQuery } from '@nestjs/swagger';
import { CreateComputerDto } from './dto/computer';
import { Response } from 'express';
import { join } from 'path';
import { createReadStream, statSync, existsSync } from 'fs';
import { ApplicationDto } from './dto/application';
import { RequestAgent } from 'src/comman/types';
import { AgentGuard } from 'src/comman/guards/agent.guard';

@Controller('agent')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('computer/register-or-update')
  async computerRegisterOrUpdate(
    @Body() computerData: CreateComputerDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { token, status } = await this.agentsService.createOrUpdate(computerData);
    console.log('agent: ', computerData.hostname, '\nstatus: ', status);
    return res.status(status === 'registered' ? 201 : 200).json({ token, status });
  }

  @Post('application/register')
  @UseGuards(AgentGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'register or update applications' })
  async applicationRegister(
    @Body() applications: ApplicationDto[],
    @Req() req: RequestAgent,
    @Res() res: Response,
  ): Promise<Response> {
    // console.log('computer: ', req.agent);
    const uniqueApps = Array.from(
      new Map(
        applications.map((app) => {
          app.computerId = req.agent.computerId;
          delete app.id;
          return [app.name, app];
        }),
      ).values(),
    );

    const result = await this.agentsService.applicationRegister(uniqueApps, req.agent.computerId);

    return res.status(200).json(result);
  }

  @Get('application/download/:appName')
  @UseGuards(AgentGuard)
  @ApiBearerAuth()
  @ApiParam({ name: 'appName', required: true, example: 'putty' })
  downloadFile(@Param('appName') filename: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', 'apps', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException(`❌ Fayl topilmadi: ${filename}`);
    }

    const fileStat = statSync(filePath);

    res.set({
      'Content-Type': 'application/octet-stream',
      'Content-Length': fileStat.size,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Transfer-Encoding': 'chunked',
    });

    // const readStream = createReadStream(filePath);

    const readStream = createReadStream(filePath, { highWaterMark: 16 * 1024 });
    readStream.pipe(res);
  }
}
