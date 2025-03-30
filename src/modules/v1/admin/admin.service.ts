import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import {
  JWT_EXPIRATION,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRATION,
  REFRESH_TOKEN_SECRET,
} from 'src/config/env';
import { UpdateAdminPasswordDto, UpdateAdminProfileDto } from 'src/modules/v1/admin/dto/update';
import { Admin2, Message, MessageforLogin, Payload, Tokens } from 'src/comman/types';
import { AdminRepository } from 'src/database/repositories/admin.repository';
import { CreateAdminDto } from './dto/register';
import { LoginAdminDto } from './dto/login';
// import { request } from 'express';

@Injectable()
export class AdminService {
  constructor(
    private jwtService: JwtService,
    private readonly adminRepository: AdminRepository,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<Message> {
    await this.adminRepository.createAdmin(createAdminDto);

    return {
      status: 'success',
      message: 'User registered successfully.',
    };
  }

  async login(adminDto: LoginAdminDto): Promise<MessageforLogin> {
    const admin = await this.adminRepository.loginAdmin(adminDto);
    if (admin) {
      const payload: Payload = {
        id: admin.id,
        role: admin.role,
      };
      return {
        status: 'success',
        token: this.createAccessToken(payload),
        refreshToken: this.createRefreshToken(payload),
      };
    } else {
      throw new HttpException(
        {
          status: 'error',
          message: 'Invalid username or password',
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async getAllAdmins(): Promise<Admin2[]> {
    return this.adminRepository.getAllAdmins();
  }

  async getOneAdmin(id: string): Promise<Admin2> {
    return this.adminRepository.getOneAdmin(id);
  }

  async updatePassword(data: {
    updatePassData: UpdateAdminPasswordDto;
    admin: Payload;
  }): Promise<Message> {
    return await this.adminRepository.updatePasswordByAdmin(data.updatePassData, data.admin);
  }

  async updateProfile(data: {
    id: string;
    updateProfileData: UpdateAdminProfileDto;
  }): Promise<Message> {
    return await this.adminRepository.updateProfile(data.id, data.updateProfileData);
  }

  async deleteAdminBySuperadmin(id): Promise<Message> {
    return this.adminRepository.deleteAdminBySuperadmin(id);
  }

  refreshTokens(payload: Payload): Tokens {
    return {
      token: this.createAccessToken(payload),
      refreshToken: this.createRefreshToken(payload),
    };
  }

  private createRefreshToken(payload: Payload): string {
    return this.jwtService.sign(payload, {
      secret: REFRESH_TOKEN_SECRET,
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });
  }

  private createAccessToken(payload: Payload): string {
    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: JWT_EXPIRATION,
    });
  }
}
