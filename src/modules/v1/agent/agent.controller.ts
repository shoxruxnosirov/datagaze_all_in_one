import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Res,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { AgentsService } from './agent.service';
import { ApiBearerAuth, ApiOperation, ApiParam } from '@nestjs/swagger';
import { CreateComputerDto } from './dto/computer';
import { Response } from 'express';
import { join } from 'path';
import { createReadStream, statSync, existsSync } from 'fs';
import { ApplicationDto } from './dto/application';
import { RequestAgent } from 'src/comman/types';
import { AgentGuard } from 'src/comman/guards/agent.guard';
import { AgentUpdateGuard } from 'src/comman/guards/agent.update.guard';

@Controller('agent')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @Post('computer/register-or-update')
  async computerRegisterOrUpdate(
    @Body() computerData: CreateComputerDto,
    @Res() res: Response,
  ): Promise<Response> {
    console.log('computerData:', computerData);
    const { token, status } = await this.agentsService.createOrUpdate(computerData);
    console.log('agent: ', computerData.hostname, '\nstatus: ', status);
    console.log('register-agent token: ', token);
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
    console.log('computerapps: ', applications);
    const uniqueApps = Array.from(
      new Map(
        applications.map((app) => {
          app.computerId = req.agent.computerId;
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
  @ApiParam({ name: 'appName', required: true, example: 'putty.exe' })
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

    const readStream = createReadStream(filePath); // , { highWaterMark: 64 * 1024 }
    readStream.pipe(res);
  }

  @Get('update_agent_info.json')
  @UseGuards(AgentUpdateGuard)
  @ApiBearerAuth()
  getUpdateJson(@Res() res: Response) {
    console.log('json olish uchun request keldi');
    // const filePath = join(, 'update_agent_info.json');
    const filePath = join(process.cwd(), 'uploads', 'agent', '1.0.0', 'update_agent_info.json');
    if (!existsSync(filePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }
    console.log('apdate json file yuborildi');
    res.sendFile(filePath);
  }

  @Get('update/:fileName')
  @UseGuards(AgentUpdateGuard)
  @ApiBearerAuth()
  getZipFile(@Param('fileName') fileName: string, @Res() res: Response) {
    // if (!fileName.endsWith('.zip')) {
    //   throw new NotFoundException('Faqat .zip fayllar ruxsat etiladi');
    // }
    const filePath = join(process.cwd(), 'uploads', 'agent','1.0.0', fileName);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Fayl topilmadi');
    }

    console.log('zip file yuborildi');

    res.sendFile(filePath); // Faylni yuklash uchun
  }
}
