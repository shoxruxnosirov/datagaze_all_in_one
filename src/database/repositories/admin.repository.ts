import {
  BadRequestException,
  ConflictException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { Knex } from 'knex';
import * as bcrypt from 'bcryptjs';

import { IAdmin, IAdmin2, IMessage, IPayload } from 'src/comman/types';
import { KNEX_CONNECTION } from 'src/database/workWithDB/database.module';
import { UpdateAdminProfileDto } from 'src/modules/v1/admin/dto/update';
import { LoginAdminDto } from 'src/modules/v1/admin/dto/login';
import { CreateAdminDto } from 'src/modules/v1/admin/dto/register';


@Injectable()
export class AdminRepository {
  constructor(@Inject(KNEX_CONNECTION) private readonly knex: Knex) { }

  async loginAdmin(admin: LoginAdminDto): Promise<IAdmin | undefined> {
    const data: IAdmin = await this.knex('admins')
      .select('*')
      .where({ username: admin.username })
      .first();
    if (!data) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Invalid username or password incorrect',
      });
    }
    const isPasswordValid = await this.comparePassword(admin.password, data.password);

    if (!isPasswordValid) {
      // Agar parol xato bo'lsa, unauthorized xatolik tashlaymiz
      throw new UnauthorizedException({
        status: 'error',
        message: 'Invalid username or password incorrect',
      });
    }

    return data;
  }

  async createAdmin(admin: CreateAdminDto): Promise<IAdmin> {
    try {
      const password = await this.hashPassword(admin.password);
      admin.password = password;
      const result = await this.knex<IAdmin>('admins').insert(admin).returning('*');

      if (result.length === 0) {
        throw new BadRequestException('Unexpected error: No result returned after insert.');
      }

      return result[0];
    } catch (error) {
      if (error.code === '23505') {
        // '23505' - unique violation PostgreSQL kod
        throw new ConflictException({
          status: 'error',
          message: 'Username already taken',
        });
      }

      throw new BadRequestException(`Database error: ${error.message}`);
    }
  }

  async getAllAdmins(): Promise<IAdmin2[]> {
    try {
      const result = await this.knex('admins')
        .select(['id', 'name', 'username', 'email', 'createdAt'])
        .where({ role: 'admin' });

      return result; // Type assertion ishlatish;
    } catch (error) {
      throw new BadRequestException(`Database error: ${error.message}`);
    }
  }

  async getOneAdmin(id: string): Promise<IAdmin2> {
    try {
      const result = await this.knex<IAdmin>('admins')
        .select(['id', 'name', 'username', 'email', 'createdAt'])
        .where({ id })
        .first();

      if (!result) {
        throw new NotFoundException(`Admin with id ${id} not found.`);
      } else {
        return result;
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      } else {
        throw new BadRequestException(`Database error: ${error.message}`);
      }
    }
  }



  // async updatePasswordBySuperadmin(data: {
  //   userId: string;
  //   newPassword: string;
  // }): Promise<IMessage> {
  //   const result = await this.knex('admins')
  //     .where({ id: data.userId })
  //     .update({
  //       password: await this.hashPassword(data.newPassword),
  //     })
  //     .whereNot({ role: 'superadmin' })
  //     .returning(['id', 'role']);

  //   if (!result.length) {
  //     throw new HttpException(
  //       {
  //         status: 'error',
  //         message: 'Siz superadmin parolini userId orqali yangilay olmaysan'
  //       },
  //       HttpStatus.FORBIDDEN
  //     );
  //   }

  //   return {
  //     status: 'success',
  //     message: `Password updated successfully  new password: "${data.newPassword}"`,
  //   };
  // }


  async updatePasswordByAdmin(
    data: { oldPassword: string; newPassword: string },
    admin: IPayload,
  ): Promise<IMessage> {
    const existingAdmin: IAdmin = await this.knex('admins').where({ id: admin.id }).first();

    if (!existingAdmin) {
      throw new NotFoundException({
        status: 'error',
        message: 'User not found from db',
      });
    }

    const isPasswordValid = await this.comparePassword(data.oldPassword, existingAdmin.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException({
        status: 'error',
        message: 'Old password is incorrect.',
      });
    }

    const password = await this.hashPassword(data.newPassword);

    await this.knex('admins').where({ id: admin.id }).update({ password }).returning('*');

    return {
      status: 'success',
      message: `Password updated successfully. new password: "${data.newPassword}"`,
    };
  }

  async updateProfile(id: string, updates: UpdateAdminProfileDto): Promise<IMessage> {
    if (updates.password) {
      updates.password = await this.hashPassword(updates.password);
    }
    const result = await this.knex('admins').where({ id }).update(updates).returning('*');

    if (result.length === 0) {
      // throw new BadRequestException('Foydalanuvchi topilmadi');
      throw new NotFoundException(`Foydalanuvchi topilmadi`);
    }

    return {
      status: 'success',
      message: 'Profile updated successfully',
    };
  }

  async deleteAdminBySuperadmin(id: string): Promise<IMessage> {
    const result = await this.knex('admins').where({ id }).del().returning('*');

    if (result.length === 0) {
      throw new HttpException(
        {
          status: 'error',
          message: 'Admin not found'
        },
        HttpStatus.NOT_FOUND
      )
    }

    return {
      status: 'success',
      message: 'remove admin account successfull'
    }
  }

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
