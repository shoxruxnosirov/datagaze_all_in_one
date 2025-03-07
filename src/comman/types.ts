import { Request } from '@nestjs/common';

import Knex from 'knex';

export interface ITokens {
  token: string;
  refreshToken: string;
}

export interface IMessageforLogin {
  status: 'success';
  token: string;
  refreshToken: string;
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
  PRIVATE_KEY = 'privateKey'
}

export interface IServer extends Knex.QueryBuilder {
  id?: string;
  host: string;
  port: string;
  username: string;
  // authType: AuthType;
  password?: string;
  privateKey?: string;
  // lastChecked: string;
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
//   fileUrl: string;
//   size: number;
//   downloadPath: string;
//   company: string;
//   description?: string;
//   supportOS: string;
//   requiredCpuCore: number;
//   requiredCam: number;
//   requiredStorage: number;
//   requiredNetwork: number;
// }
export interface IProduct {
  id: string;
  name: string;
  icon?: string;
  version: string;
  fileUrl: string;
  downloadPath: string;
  serverId?: string | null;
  size: number;
  company: string;
  description?: string;
  supportOS: string;
  requiredCpuCore: number;
  requiredRam: number;
  requiredStorage: number;
  requiredNetwork: number;
  computerCount: number;
  firstUploadAt: Date;
  lastUploadAt: Date;
}


// export interface IProductData {
//   filePath: string;
//   filename: string;
// }