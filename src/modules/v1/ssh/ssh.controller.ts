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
            host: { default: '34.203.244.210', type: 'string', description: 'server host' },
            port: { default: '22', type: 'string', description: 'server port' },
            username: { default: 'ubuntu', type: 'string', description: 'server username' },
            // auth_type: { default: 'key', type: 'string', description: 'auth_type' },
            password: { default: 'New_admin_pass_123', type: 'string', description: 'server password' },
            // privateKey: { default: fs.readFileSync(path.join('/home', 'shoxrux', 'Download', 'key_8_mart.pem'), 'utf8'), type: 'string', description: 'Private_key' },
            privateKey: { default: `-----BEGIN RSA PRIVATE KEY-----\nMIIEpAIBAAKCAQEAy4j9NjkSXy387BtyoCLmmU/gw2LeIqmkucGSvtH/JxfNOAxn\nTJtl0AMc+pU0cVSAnVSJe3YD6xUcpNk6hSlDZ/vWREHqWMUuqL17n09L6ENlpheV\ntdUVqaHJbUuIFB5uZt1Oe0I6Wo8YfhMjMs3Gy7xrFS34kcxRxrzXcvdwn+eVWj1M\nGqCArzqdhjZKsd/bctXVQl4XQf0equoE+B9KG+CobcAkRgCOFL8ORyo8Ny4kkPRv\nj5pSKeIV041MmGZTzD6lYYlw8cE3qSHJufc3SgfVKQp8fyqTVef9vu3n/ZGrlBS5\n5gWVcc3cNORIpeyfzjSOBOEifbH+rMvCldEMWwIDAQABAoIBAFE4ERMaIyKoD02I\nhm0wgCSdo2tUgKAEYh9eB1juI4tODC5ZhL8lI7OmCmJUN+Ehf1FI8rO5nEaq3gtK\nQ/fvR16vOAl05DcYOE5Njo877WZ5vo5QywUMSuCuFtruURb2LcgOd8rn2rFYeMWW\njW0wgCu8vF5vQcmsZtWPdcoCw4aLBPZrTZvTLSno/zZeowxt61qbz3fY9H2s5YQr\nKHxUrMN5KWQr78l1aUZVsFcpRBXUWFUzoSsE7Yh5DMysP5nMko07ZJkQmn3ohlw3\nl68tpLSbaFCn5smp9PTj0DdMmQ7hIi/PDx6FJ6x9j50aIz6zfbjBN5DBoE0GuAA9\nl5APK8ECgYEA5prGobUvHh41WWDS71JYbyqWJc90LYzP2Wb0dEQgmoPX0ERK1mI5\nvnY+FafJ1uYPofPRZaVOrr9G2ztyNdTbuBtBoFhQHlp8VH+x2mnosCHdLhmetxRz\nGaF4Fhh0sd/QOKs6Dq7cJb/2+1V9TvKmossGLNcZpLYq4Xtx5f1dVm8CgYEA4fMR\ncqWmjH3aLxYjcOD34VpEwVis3alCij9VD0Jkju/Dfb0F6BxEPTftDcwnqqGefTH3\n06icXzuOGWmUHdS6phbQNSdmtVssucRbdRSlASTgXXxtp/TZyhBJ88IR/lMQdGNm\nOvDL3zGrsEskQCweyhGFxaIPXvAaSk9yN+36/tUCgYEAkrG+zbuOX6Bj25mGVYuS\nihUTMrZHd3pt9iRSOWvlOaXJMclfugT+KrTZRblY4oWzSBjsCbcg2HUBRBEK1Ee2\nBeYA11mWjdiN4srgfsqEpRbFtr/BgUFW/uUCmTuxcD2qHYJ/Cjwd+z2khbmaXxBp\nBIIWSYwD2g2wNYPrrpyANa0CgYEAwmH3h7ck4ka/NrUIBms0NYYQEno0NXoRCZhU\nmA0ZL7Lrbrf4ZegzeKstYCpbkbr6+1/KgifTZ0Z4CDrBNyy06oBD3QapoKnwf1yD\nBeWd0q8j6qlKOS03VFPRG0jBbBeP12FQKLLR4ZD80GzEogSS9GpAuHakXJuZMobI\nj39H6IUCgYBKVtTFIv54gnkIVVohkSpnjUynxkm4Z3OFjAsl7cwJHmwLBbmcF/vl\nxzP+1B3JJEq6+ewPpoIMVR7Q+dy5kacFooO6WCdKfky2wP7GFGHLxOuUjsCzBK4/\nDAcC3CN842Jlw1L5aDSsD1hDuw4aZmveExWldxPcPfNLsmH4DuVyZQ==\n-----END RSA PRIVATE KEY-----`, type: 'string', description: 'Private_key' },
          }
        },
      }
    },
  })
  async deployProduct(@Body() data: { localProjectPath: string, serverCredentials: ConnectDto }, @Res() res: Response) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    await this.sshService.deployProject(data, res);
  } 

  // @Post('exec_comand')
  // @UseGuards(RolesGuard)
  // @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  // @ApiOperation({ summary: 'exec comand' })
  // @ApiBearerAuth()
  // @ApiBody({
  //   schema: {
  //     type: 'object',
  //     properties: {
  //       serverId: { type: 'string', example: 'server_id', description: 'db dagi server id' },
  //       comand: { default: 'ls -la ~', type: 'string', description: 'buyruq bajarish uchun comanda' },
  //     }
  //   }
  // })
  // async execComand(data: { serverId: string, comand: string }) {
    
  // }

  // @Post('store-credentials')
  // async storeSshCredentials(connectConfig: ConnectConfig) {
  //   return this.sshService.storeSshCredentials(connectConfig);
  // }

  // @Get(':server_id/status')
  // async checkSshStatus(@Param('server_id') serverId: string) {
  //   return this.sshService.checkSshStatus(serverId);
  // }

  // @Get(':server_id/auto-connect')
  // async autoLogin(@Param('server_id') serverId: string): Promise<IMessage> {
  //   return this.sshService.autoConnect(serverId);
  // }
}
