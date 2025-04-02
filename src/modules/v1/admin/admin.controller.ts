import {
  Body,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';

import { ApiOperation, ApiBearerAuth, ApiBody, ApiParam } from '@nestjs/swagger';

import { UpdateAdminPasswordDto, UpdateAdminProfileDto } from './dto/update';
import { AdminService } from './admin.service';
import { Admin2, GuardRequest, Message, MessageforLogin, Tokens, Role } from 'src/comman/types';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { Roles } from 'src/comman/decorators/roles.decorator';
import { CreateAdminDto } from './dto/register';
import { LoginAdminDto } from './dto/login';
import { RolesGuardForRefreshToken } from 'src/comman/guards/refreshToken.guard';

@Controller('api/auth')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { default: 'superadmin', type: 'string', description: 'admin username' },
        password: { default: 'superadmin', type: 'string', description: 'admin password' },
      },
      required: ['username', 'password'],
    },
  })
  async loginAdmin(@Body() loginAdminDto: LoginAdminDto): Promise<MessageforLogin> {
    try {
      return this.adminService.login(loginAdminDto);
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.log(`admin login err.message: ${err.message}`);
      } else {
        console.log(`admin login err: ${err}`);
      }
      throw new HttpException(
        {
          status: 'error',
          message: 'Invalid username or password',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get all admins (Superadmin only)' })
  @ApiBearerAuth()
  async getAllAdmins(): Promise<Admin2[]> {
    return this.adminService.getAllAdmins();
  }

  @Get(':adminId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get an admin by ID (Superadmin only)' })
  @ApiBearerAuth()
  @ApiParam({
    name: 'adminId',
    type: 'string',
    description: 'Admin UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  async getOneAdmin(
    @Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Admin2> {
    return this.adminService.getOneAdmin(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create an admin by ID (Superadmin only)' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        name: {
          default: "Adminjon Adminov Admin o'g'li",
          type: 'string',
          description: 'new admin full name',
        },
        username: { default: 'new_admin', type: 'string', description: 'new admin username' },
        email: { default: 'admin@gmail.com', type: 'string', description: 'new admin email' },
        password: {
          default: 'New_admin_pass_123',
          type: 'string',
          description: 'new admin password',
        },
      },
      required: ['name', 'username', 'email', 'password'],
    },
  })
  async createAdmin(@Body() newAdmin: CreateAdminDto): Promise<Message> {
    return this.adminService.createAdmin(newAdmin);
  }

  @Delete(':adminId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete an admin by ID (Superadmin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'adminId', description: 'User ID', type: 'string' })
  async deleteAdminProfileBySuperAdmin(
    @Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<Message> {
    return this.adminService.deleteAdminBySuperadmin(id);
  }

  @Put(':adminId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update an admin by ID (Superadmin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'adminId', description: 'User ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: {
          default: 'new_admin_1',
          type: 'string',
          description: 'Yangi foydalanuvchi nomi (ixtiyoriy)',
        },
        name: { default: 'admin', type: 'string', description: 'Foydalanuvchi ismi (ixtiyoriy)' },
        email: {
          default: 'adminbek@gmail.com',
          type: 'string',
          description: 'Yangi elektron pochta (ixtiyoriy)',
        },
        password: { default: 'new_password_123', type: 'string', description: 'Yangi parol' },
      },
      required: [],
    },
  })
  async updateAdminProfileBySuperAdmin2(
    @Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProfileData: UpdateAdminProfileDto,
  ): Promise<Message> {
    return this.adminService.updateProfile({ id, updateProfileData });
  }

  @Patch('update-password')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update password own account' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        oldPassword: {
          default: 'old_password',
          type: 'string',
          description: 'Joriy parol (faqat admin uchun)',
        },
        newPassword: { default: 'new_password', type: 'string', description: 'Yangi parol' },
      },
      required: ['oldPassword', 'newPassword'],
    },
  })
  async updateAdminPassword(
    @Body() updatePassData: UpdateAdminPasswordDto,
    @Req() req: GuardRequest,
  ): Promise<Message> {
    return this.adminService.updatePassword({
      updatePassData,
      admin: req.user,
    });
  }

  @Post('refreshtoken')
  @UseGuards(RolesGuardForRefreshToken)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'refresh token with refresh_token' })
  @ApiBearerAuth()
  refreshToken(@Req() req: GuardRequest): Tokens {
    return this.adminService.refreshTokens(req.user);
  }
}
