import {
  Body,
  ConflictException,
  Controller,
  Delete,
  Get,
  HttpException,
  HttpStatus,
  NotFoundException,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ApiOperation,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import {
  UpdateAdminPasswordDto,
  UpdateAdminProfileDto,
} from './dto/update';
import { AdminService } from './admin.service';
import { IGuardRequest, IMessage, IMessageforLogin, ITokens } from 'src/comman/types';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { Role } from 'src/comman/guards/roles.enum';
import { Roles } from 'src/comman/decorators/roles.decorator';
import { CreateAdminDto } from './dto/register';
import { LoginAdminDto } from './dto/login';

@Controller('api/auth')
export class AdminController {
  constructor(private adminService: AdminService) { }

  @Post('login')
  @ApiOperation({ summary: 'Create a new user' })
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
  async loginAdmin(@Body() loginAdminDto: LoginAdminDto): Promise<IMessageforLogin> {
    try {
      return this.adminService.login(loginAdminDto);
    } catch (err) {
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
  async getAllAdmins() {
    return this.adminService.getAllAdmins();
  }

  @Get(':adminId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Get an admin by ID (Superadmin only)' })
  @ApiBearerAuth()
  @ApiParam({ name: 'adminId', type: 'string', description: 'Admin UUID', example: '550e8400-e29b-41d4-a716-446655440000' })
  async getOneAdmin(@Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string) {
    return this.adminService.getOneAdmin(id);
  }

  @Post('')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new admin by superadmin' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {

        name: { default: 'Adminjon Adminov Admin o\'g\'li', type: 'string', description: 'new admin full name' },
        username: { default: 'new_admin', type: 'string', description: 'new admin username' },
        email: { default: 'admin@gmail.com', type: 'string', description: 'new admin email' },
        password: { default: 'New_admin_pass_123', type: 'string', description: 'new admin password' },
      },
      required: ['name', 'username', 'email', 'password'],
    },
  })
  async createAdmin(@Body() newAdmin: CreateAdminDto): Promise<IMessage> {
    return this.adminService.createAdmin(newAdmin);
  }

  @Delete(':adminId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Delete admin' })
  @ApiBearerAuth()
  @ApiParam({ name: 'adminId', description: 'User ID', type: 'string' })
  async deleteAdminProfileBySuperAdmin(
    @Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string,
  ): Promise<IMessage> {
    return this.adminService.deleteAdminBySuperadmin(id);
  }

  @Put(':adminId') 
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin profile' })
  @ApiBearerAuth()
  @ApiParam({ name: 'adminId', description: 'User ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { default: 'new_admin_1', type: 'string', description: 'Yangi foydalanuvchi nomi (ixtiyoriy)' },
        name: { default: 'admin', type: 'string', description: 'Foydalanuvchi ismi (ixtiyoriy)' },
        email: { default: 'adminbek@gmail.com', type: 'string', description: 'Yangi elektron pochta (ixtiyoriy)' },
        password: { default: 'new_password_123', type: 'string', description: 'Yangi parol' }
      },
      required: [],
    },
  })
  async updateAdminProfileBySuperAdmin2(
    @Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProfileData: UpdateAdminProfileDto,
    @Req() req: IGuardRequest,
  ): Promise<IMessage> {
    return this.adminService.updateProfile({ id, updateProfileData });
  }




  @Patch('update-password-by-superadmin/:adminId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN,)
  @ApiOperation({ summary: 'Update password [superadmin -> user_id]' })
  @ApiParam({ name: 'adminId', description: 'User ID', type: 'string' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        // userId: {
        //   default: 'admin_id',
        //   type: 'string',
        //   description: "Faqat superadmin uchun - o'zgartirilayotgan adminning IDsi",
        // },
        newPassword: { default: 'new_password_123', type: 'string', description: 'Yangi parol' },
      },
      required: ['userId', 'newPassword'],
    },
  })
  async updateAdminPasswordBySuperadmin(
    @Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() body: { newPassword: string },
  ): Promise<IMessage> {
    return this.adminService.updateAdminPasswordBySuperadmin({
      userId: id,
      newPassword: body.newPassword
    });
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
        oldPassword: { default: "old_password", type: 'string', description: 'Joriy parol (faqat admin uchun)' },
        newPassword: { default: "new_password", type: 'string', description: 'Yangi parol' },
      },
      required: ['oldPassword', 'newPassword'],
    },
  })
  async updateAdminPassword(
    @Body() updatePassData: UpdateAdminPasswordDto,
    @Req() req: IGuardRequest,
  ): Promise<IMessage> {
    return this.adminService.updatePassword({
      updatePassData,
      admin: req.user,
    });
  }

  @Patch('update-profile-by-superadmin/:adminId')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin profile' })
  @ApiBearerAuth()
  @ApiParam({ name: 'adminId', description: 'User ID', type: 'string' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { default: 'new_admin_1', type: 'string', description: 'Yangi foydalanuvchi nomi (ixtiyoriy)' },
        name: { default: 'admin', type: 'string', description: 'Foydalanuvchi ismi (ixtiyoriy)' },
        email: { default: 'adminbek@gmail.com', type: 'string', description: 'Yangi elektron pochta (ixtiyoriy)' },
      },
      required: [],
    },
  })
  async updateAdminProfileBySuperAdmin(
    @Param('adminId', new ParseUUIDPipe({ version: '4' })) id: string,
    @Body() updateProfileData: UpdateAdminProfileDto,
    @Req() req: IGuardRequest,
  ): Promise<IMessage> {
    return this.adminService.updateProfile({ id, updateProfileData });
  }

  @Patch('update-profile')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Update admin profile' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { default: 'new_admin_1', type: 'string', description: 'Yangi foydalanuvchi nomi (ixtiyoriy)' },
        name: { default: 'admin', type: 'string', description: 'Foydalanuvchi ismi (ixtiyoriy)' },
        email: { default: 'adminbek@gmail.com', type: 'string', description: 'Yangi elektron pochta (ixtiyoriy)' },
      },
      required: [],
    },
  })
  async updateAdminProfile(
    @Body() updateProfileData: UpdateAdminProfileDto,
    @Req() req: IGuardRequest,
  ): Promise<IMessage> {
    return this.adminService.updateProfile({ id: req.user.id, updateProfileData });
  }




  @Post('refreshtoken')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'refresh token with refresh_token' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        refresh_token: { default: '', type: 'string', description: 'token olish uchun refresh_token' },
      },
      required: ['refresh_token'],
    },
  })
  async refreshToken(
    @Body() data: { refresh_token: string },
    @Req() req: IGuardRequest,
  ): Promise<ITokens> {
    try {
      console.log('refreshtoken');
      return this.adminService.refreshTokens(data.refresh_token, req.user);
    } catch (err) {
      throw new HttpException(
        {
          status: 'error',
          message: "refresh_token orqali token olishda xatolik sodir bo'ldi: " + err.message,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }
}
