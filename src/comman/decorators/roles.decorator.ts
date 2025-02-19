import { SetMetadata } from '@nestjs/common';

import { Role } from '../guards/roles.enum';

export const Roles = (...roles: Role[]) => SetMetadata('roles', roles);
