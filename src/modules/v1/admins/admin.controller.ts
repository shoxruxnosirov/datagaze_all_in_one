import {
  Body,
  ConflictException,
  Controller,
  HttpException,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  // Request,
  // SetMetadata,
  UseGuards,
} from '@nestjs/common';

import {
  // ApiTags,
  ApiOperation,
  ApiResponse,
  // ApiBody,
  // ApiParam,
  ApiBearerAuth,
  ApiBody,
  ApiParam,
} from '@nestjs/swagger';

import {
  CreateAdminDto,
  LoginAdminDto,
  UpdateAdminPasswordDto,
  UpdateAdminProfileDto,
} from './dto/dtos';
import { AdminService } from './admin.service';
import { IGuardRequest, IMessage, IMessageforLogin, ITokens } from 'src/comman/types';
import { RolesGuard } from 'src/comman/guards/roles.guard';
import { Role } from 'src/comman/guards/roles.enum';
import { Roles } from 'src/comman/decorators/roles.decorator';

@Controller('api/auth')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('register')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Create a new admin by superadmin' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { default: 'new_admin', type: 'string', description: 'new admin username' },
        email: { default: 'admin@gmail.com', type: 'string', description: 'new admin email'},
        password: { default: 'New_admin_pass_123', type: 'string', description: 'new admin password' },
      },
      required: ['username', 'password'],
    },
  })
  // @ApiResponse({ status: 201, description: 'The user has been successfully created.' })
  async createAdmin(@Body() newAdmin: CreateAdminDto): Promise<IMessage> {
    try {
      return this.adminService.createAdmin(newAdmin);
    } catch (err) {
      throw new ConflictException({
        status: 'error',
        message: 'Username already taken',
      });
    }
  }

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
  // @ApiResponse({ status: 201, description: 'The user has been successfully logined.' })
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

  @Put('update-password/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Update password [superadmin -> user_id] | [admin -> old_password]' })
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
  @ApiBearerAuth()
  @ApiBody({
    schema: {
      oneOf: [
        {
          type: 'object',
          properties: {
            user_id: {
              default: 'admin_id',
              type: 'string',
              description: "Faqat superadmin uchun - o'zgartirilayotgan adminning IDsi",
            },
            new_password: { default: 'new_password_123', type: 'string', description: 'Yangi parol' },
          },
          required: ['user_id', 'new_password'],
        },
        {
          type: 'object',
          properties: {
            old_password: { default: "old_password", type: 'string', description: 'Joriy parol (faqat admin uchun)' },
            new_password: { default: "new_password", type: 'string', description: 'Yangi parol' },
          },
          required: ['old_password', 'new_password'],
        },
      ],
    },
  })
  // @ApiResponse({ status: 200, description: 'The user has been successfully updated.' })
  // @ApiResponse({ status: 404, description: 'User not found.' })
  async updateAdminPassword(
    @Param('id') id: string,
    @Body() updatePassData: UpdateAdminPasswordDto,
    @Req() req: IGuardRequest,
  ): Promise<IMessage> {
    // try {
    if (req.user.id.toString() !== id) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Parametrdagi ID va token ichidagi payload dagi ID mos emas',
        },
        HttpStatus.BAD_REQUEST,
      );
    }

    return this.adminService.updatePassword({
      id,
      updatePassData,
      admin: req.user,
    });
    // } catch (err) {
    //   throw err;
    // }
  }

  @Put('update-profile/:id')
  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update admin profile' })
  @ApiBearerAuth()
  @ApiParam({ name: 'id', description: 'User ID', type: 'string' })
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
  // @ApiResponse({ status: 200, description: 'The user has been successfully updated.' })
  // @ApiResponse({ status: 404, description: 'Admin not found.' })
  async updateAdminProfile(
    @Param('id') id: string,
    @Body() updateProfileData: UpdateAdminProfileDto,
    @Req() req: IGuardRequest,
  ): Promise<IMessage> {
    if (req.user.id.toString() !== id) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Parametrdagi ID va token ichidagi payload dagi ID mos emas',
        },
        HttpStatus.BAD_REQUEST,
      );
    }
    return this.adminService.updateProfile({ id: req.user.id.toString(), updateProfileData });
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
