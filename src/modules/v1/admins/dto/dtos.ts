import { Role } from 'src/comman/guards/roles.enum';

export class LoginAdminDto {
  username: string;
  password: string;
}

export class CreateAdminDto {
  name?: string;
  username: string;
  password: string;
  role?: Role;
  email: string;
}

export type UpdateAdminPasswordDto =
  | {
      oldPassword: string;
      newPassword: string;
    }
  | {
      userId: string;
      newPassword: string;
    };

export class UpdateAdminProfileDto {
  username?: string;
  name?: string;
  email?: string;
}
