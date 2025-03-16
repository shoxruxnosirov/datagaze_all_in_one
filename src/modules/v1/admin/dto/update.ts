import { IsUUID } from 'class-validator';

export type UpdateAdminPasswordDto = {
  oldPassword: string;
  newPassword: string;
};

export class UpdateAdminPasswordBySuperadminoDto {
  @IsUUID('4', { message: 'Invalid UUID format' })
  userId: string;
  newPassword: string;
}


export class UpdateAdminProfileDto {
  username?: string;
  name?: string;
  email?: string;
}
