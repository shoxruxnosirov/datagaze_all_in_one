import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';


import { ConnectConfig } from 'ssh2';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

import { ConnectDto } from './dto/dtos';
import { SshService } from './ssh.service';
import { IMessage, IProduct, Role } from 'src/comman/types';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { Roles } from 'src/comman/decorators/roles.decorator';

@Controller('ssh')
export class SshController {
  constructor(private sshService: SshService) { }

  @Post('store-credentials')
  async storeSshCredentials(connectConfig: ConnectConfig) {
    return this.sshService.storeSshCredentials(connectConfig);
  }

  @Post('deploy-product')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'deploy product' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        localProjectPath: { type: 'string', example: path.join(process.cwd(), 'products', 'dlp') },
        serverCredentials: {
          type: 'object',
          properties: {
            host: { default: 'ec2-18-215-159-132.compute-1.amazonaws.com', type: 'string', description: 'new admin username' },
            port: { default: '22', type: 'string', description: 'new admin email' },
            username: { default: 'ubuntu', type: 'string', description: 'new admin email' },
            auth_type: { default: 'key', type: 'string', description: 'new admin email' },
            password: { default: 'New_admin_pass_123', type: 'string', description: 'new admin password' },
            privateKey: { default: fs.readFileSync('/home/kali/.ssh/work.pem', 'utf8'), type: 'string', description: 'new admin password' },
          }
        },
      }
      // required: ['username', 'password'],
    },
  })

  async deployProduct(@Body() data: { localProjectPath: string, serverCredentials: ConnectDto }, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await this.sshService.deployProject(data, res);
  } 

  @Get(':server_id/status')
  async checkSshStatus(@Param('server_id') serverId: string) {
    return this.sshService.checkSshStatus(serverId);
  }

  @Get(':server_id/auto-connect')
  async autoLogin(@Param('server_id') serverId: string): Promise<IMessage> {
    return this.sshService.autoConnect(serverId);
  }
}
