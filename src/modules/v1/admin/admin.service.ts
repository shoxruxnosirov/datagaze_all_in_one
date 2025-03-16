import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import {
  JWT_EXPIRATION,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRATION,
  REFRESH_TOKEN_SECRET,
} from 'src/config/env';
import { UpdateAdminPasswordBySuperadminoDto, UpdateAdminPasswordDto, UpdateAdminProfileDto, } from 'src/modules/v1/admin/dto/update';
import { IMessage, IMessageforLogin, IPayload, ITokens } from 'src/comman/types';
import { AdminRepository } from 'src/database/repositories/admin.repository';
import { Role } from 'src/comman/guards/roles.enum';
import { CreateAdminDto } from './dto/register';
import { LoginAdminDto } from './dto/login';
import { request } from 'express';

@Injectable()
export class AdminService {
  constructor(
    private jwtService: JwtService,
    private readonly adminRepository: AdminRepository,
  ) { }

  async createAdmin(createAdminDto: CreateAdminDto): Promise<IMessage> {
    await this.adminRepository.createAdmin(createAdminDto);

    return {
      status: 'success',
      message: 'User registered successfully.',
    };
  }

  async login(adminDto: LoginAdminDto): Promise<IMessageforLogin> {
    const admin = await this.adminRepository.loginAdmin(adminDto);
    if (admin) {
      const payload: IPayload = {
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

  async getAllAdmins() {
    return this.adminRepository.getAllAdmins();
  }

  async getOneAdmin(id: string) {
    return this.adminRepository.getOneAdmin(id);
  }

  async updatePassword(data: {
    updatePassData: UpdateAdminPasswordDto
    admin: IPayload
  }): Promise<IMessage> {
        return await this.adminRepository.updatePasswordByAdmin(data.updatePassData, data.admin);
  }

  async updateAdminPasswordBySuperadmin(data: UpdateAdminPasswordBySuperadminoDto): Promise<IMessage> {
        return this.adminRepository.updatePasswordBySuperadmin(data);
  }

  async updateProfile(data: {
    id: string;
    updateProfileData: UpdateAdminProfileDto;
    // payload: IPayload;
  }): Promise<IMessage> {
    return await this.adminRepository.updateProfile(data.id, data.updateProfileData);

    // return {
    //   status: 'success',
    //   message: 'Profile updated successfully.',
    // };
  }

  async deleteAdminBySuperadmin(id): Promise<IMessage> {
    return this.adminRepository.deleteAdminBySuperadmin(id)
  }

  refreshTokens(refreshToken: string, admin: IPayload): ITokens {
    try {
      // const { id, username, role } = this.jwtService.verify<IPayload>(refreshToken, {
      //   secret: REFRESH_TOKEN_SECRET,
      // });

      // const payload: IPayload = { id, username, role };
      const payload = admin;

      return {
        token: this.createAccessToken(payload),
        refreshToken: this.createRefreshToken(payload),
      };
    } catch (err) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  private createRefreshToken(payload: IPayload): string {
    return this.jwtService.sign(payload, {
      secret: REFRESH_TOKEN_SECRET,
      expiresIn: REFRESH_TOKEN_EXPIRATION,
    });
  }

  private createAccessToken(payload: IPayload): string {
    return this.jwtService.sign(payload, {
      secret: JWT_SECRET,
      expiresIn: JWT_EXPIRATION,
    });
  }
}
