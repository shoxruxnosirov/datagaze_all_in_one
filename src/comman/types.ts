import { Request } from '@nestjs/common';

import Knex from 'knex';

import { Role } from './guards/roles.enum';

export interface ITokens {
  access_token: string;
  refresh_token: string;
}

export interface IMessageforLogin {
  status: 'success';
  token: string;
  refresh_token: string;
}

export interface IMessage {
  status: string;
  message: string;
}

export interface IAdmin extends Knex.QueryBuilder {
  id: number;
  name: string;
  username: string;
  email: string;
  role: Role;
  password: string;
  createdAt: Date;
}

export interface IPayload {
  id: number;
  username: string;
  role: Role;
}

interface CustomHeaders extends Headers {
  authorization?: string;
}

export interface IGuardRequest extends Request {
  user: IPayload;
  headers: CustomHeaders;
}
