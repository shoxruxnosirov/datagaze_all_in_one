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
export interface IAdmin2 extends Knex.QueryBuilder {
  id: string;
  name: string;
  username: string;
  email: string;
  // role: Role;
  // password: string;
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
  password?: string;
  privateKey?: string;
  // lastChecked: string;
}

export interface IPayload {
  id: string;
  role: Role;
}

export interface IPayloadAgent {
  computerId: string,
  key: string
}

interface ICustomHeaders extends Headers {
  authorization?: string;
}

export interface IGuardRequest extends Request {
  user: IPayload;
  headers: ICustomHeaders;
}

export interface IRequestAgent extends Request {
  agent: IPayloadAgent;
  headers: ICustomHeaders;
}

export interface IProduct {
  id: string;
  name: string;
  icon: string;
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

