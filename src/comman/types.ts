import { Request } from '@nestjs/common';

import Knex from 'knex';

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
  status: 'success';
  message: string;
}

export enum Role {
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}


export interface IAdmin extends Knex.QueryBuilder {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  password: string;
  createdAt: Date;
}

export enum AuthType {
  PASSWORD = "password",
  PRIVATE_KEY = 'private_key'
}

export interface IServer extends Knex.QueryBuilder {
  id: string;
  ip: string;
  port: string;
  username: string;
  auth_type: AuthType;
  password: string;
  private_key?: string;
  last_checked: string;
}

export interface IPayload {
  id: string;
  role: Role;
}

interface ICustomHeaders extends Headers {
  authorization?: string;
}

export interface IGuardRequest extends Request {
  user: IPayload;
  headers: ICustomHeaders;
}


// export interface IProduct {
//   id: string;
//   name: string;
//   icon?: string;
//   version: string;
//   file_url: string;
//   size: number;
//   download_path: string;
//   company: string;
//   description?: string;
//   support_os: string;
//   required_cpu_core: number;
//   required_ram: number;
//   required_storage: number;
//   required_network: number;
// }
export interface IProduct {
  id: string;
  name: string;
  icon?: string;
  version: string;
  file_url: string;
  download_path: string;
  server_id?: string | null;
  size: number;
  company: string;
  description?: string;
  support_os: string;
  required_cpu_core: number;
  required_ram: number;
  required_storage: number;
  required_network: number;
  computer_count: number;
  first_upload_at: Date;
  last_upload_at: Date;
}


// export interface IProductData {
//   filePath: string;
//   filename: string;
// }