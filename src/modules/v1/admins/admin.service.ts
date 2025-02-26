import { HttpException, HttpStatus, Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import {
  JWT_EXPIRATION,
  JWT_SECRET,
  REFRESH_TOKEN_EXPIRATION,
  REFRESH_TOKEN_SECRET,
} from 'src/config/env';
import {
  CreateAdminDto,
  LoginAdminDto,
  UpdateAdminPasswordDto,
  UpdateAdminProfileDto,
} from 'src/modules/v1/admins/dto/dtos';
import { IMessage, IMessageforLogin, IPayload, ITokens } from 'src/comman/types';
import { AdminRepository } from 'src/database/repositories/admin.repository';
import { Role } from 'src/comman/guards/roles.enum';

@Injectable()
export class AdminService {
  constructor(
    private jwtService: JwtService,
    private readonly adminRepository: AdminRepository,
  ) {}

  async createAdmin(createAdminDto: CreateAdminDto): Promise<IMessage> {
    // const admin =
    await this.adminRepository.createAdmin(createAdminDto);

    return {
      status: 'success',
      message: 'User registered successfully.',
    };
  }

  async login(adminDto: LoginAdminDto): Promise<IMessageforLogin> {
    try {
      const admin = await this.adminRepository.loginAdmin(adminDto);
      if (admin) {
        const payload: IPayload = {
          id: admin.id,
          role: admin.role,
        };
        return {
          status: 'success',
          token: this.createAccessToken(payload),
          refresh_token: this.createRefreshToken(payload),
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
    } catch (err) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Invalid username or password: ' + err.message,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }
  }

  async updatePassword(data: {
    id: string;
    updatePassData: UpdateAdminPasswordDto;
    admin: IPayload;
  }): Promise<IMessage> {
    if (data.admin.role === Role.SUPER_ADMIN) {
      if ('user_id' in data.updatePassData) {
        return await this.adminRepository.updatePasswordBySuperadmin(data.updatePassData);
      } else if ('old_password' in data.updatePassData) {
        return await this.adminRepository.updatePasswordByAdmin(data.updatePassData, data.admin);
      } else {
        throw new HttpException(
          {
            status: 'error',
            message:
              'Superadmin can only update password using user_id OR Old password required to update password',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else if (data.admin.role === Role.ADMIN) {
      if ('old_password' in data.updatePassData) {
        return await this.adminRepository.updatePasswordByAdmin(data.updatePassData, data.admin);
      } else {
        throw new HttpException(
          {
            status: 'error',
            message: 'Old password required to update password',
          },
          HttpStatus.BAD_REQUEST,
        );
      }
    } else {
      // hozircha turib tursinchi
      return {
        status: 'success',
        message: 'bu qanday foydalanuvchi ekana',
      };
    }
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

  refreshTokens(refreshToken: string, admin: IPayload): ITokens {
    try {
      // const { id, username, role } = this.jwtService.verify<IPayload>(refreshToken, {
      //   secret: REFRESH_TOKEN_SECRET,
      // });

      // const payload: IPayload = { id, username, role };
      const payload = admin;

      return {
        access_token: this.createAccessToken(payload),
        refresh_token: this.createRefreshToken(payload),
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
