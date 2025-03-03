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
      old_password: string;
      new_password: string;
    }
  | {
      user_id: string;
      new_password: string;
    };

export class UpdateAdminProfileDto {
  username?: string;
  name?: string;
  email?: string;
}
