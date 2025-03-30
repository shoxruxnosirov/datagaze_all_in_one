import { Role } from 'src/comman/types';

export class CreateAdminDto {
  name?: string;
  username: string;
  password: string;
  role?: Role;
  email: string;
}
