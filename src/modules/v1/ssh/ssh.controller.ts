import { Body, Controller, Get, Param, Post, Res, UseGuards } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { Response } from 'express';

import { ConnectConfig } from 'ssh2';
import { ApiBearerAuth, ApiBody, ApiOperation } from '@nestjs/swagger';

import { ConnectDto } from './dto/dtos';
import { SshService } from './ssh.service';
import { Role } from 'src/comman/types';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { Roles } from 'src/comman/decorators/roles.decorator';

@Controller('ssh')
export class SshController {
  constructor(private sshService: SshService) {}

  @Post('deploy-product')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'deploy product' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        productId: { type: 'string', example: '' },
        serverCredentials: {
          type: 'object',
          properties: {
            host: { default: '34.203.244.210', type: 'string', description: 'server host' },
            port: { default: '22', type: 'string', description: 'server port' },
            username: { default: 'ubuntu', type: 'string', description: 'server username' },
            password: {
              default: 'New_admin_pass_123',
              type: 'string',
              description: 'server password',
            },
          },
        },
      },
    },
  })
  async deployProduct(
    @Body() data: { productId: string; serverCredentials: ConnectDto },
    @Res() res: Response,
  ) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await this.sshService.deployProject(data, res);
  }
}
