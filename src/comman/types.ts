import Knex from 'knex';
import { Socket } from 'socket.io';

import { Channel } from 'ssh2';
import * as pty from 'node-pty';

export type Tokens = {
  token: string;
  refreshToken: string;
};

export type FrontendSocketTerminal = Omit<Socket, 'data'> & {
  data: { sessions: Map<string, TerminalSession> };
};

export type TerminalSession = {
  socket: FrontendSocketTerminal;
  shell: Channel | null | { write: () => void; end: () => void };
  ptyTerm: pty.IPty | null;
  // skipFunc: {
  //     skipSlashNs: ((value: number) => void) | null
  //     skipData: ((value: number) => void) | null
  // };
};

export type MessageforLogin = {
  status: 'success';
  token: string;
  refreshToken: string;
};

export type Message = {
  status: 'success';
  message: string;
};

export enum Role {
  ADMIN = 'admin',
  SUPER_ADMIN = 'superadmin',
}

export type Admin = Knex.QueryBuilder & {
  id: string;
  name: string;
  username: string;
  email: string;
  role: Role;
  password: string;
  createdAt: Date;
};
export type Admin2 = Omit<Admin, 'role' | 'password'>;

export enum AuthType {
  PASSWORD = 'password',
  PRIVATE_KEY = 'privateKey',
}

export type Server = Knex.QueryBuilder & {
  id?: string;
  host: string;
  port: number;
  username: string;
  password?: string;
  privateKey?: string;
  // lastChecked: string;
};

export type Payload = {
  id: string;
  role: Role;
};

export type PayloadAgent = {
  computerId: string;
  key: string;
};
export type RequestAgent = Request & {
  agent: PayloadAgent;
  headers: CustomHeaders;
};

type CustomHeaders = Headers & {
  authorization?: string;
};

export type GuardRequest = Request & {
  user: Payload;
  headers: CustomHeaders;
};

export type Product = {
  id: string;
  name: string;
  icon?: string; // Nullable

  serverVersion: string;
  agentVersion: string;

  serverFilePath: string;
  agentFilePath: string;

  serverFileSize: number;
  agentFileSize: number;

  serverId?: string | null; // Nullable (foreign key)

  publisher: string;

  description?: string; // Nullable
  supportOS?: string; // Nullable

  requiredCpuCore: number;
  requiredRam: number;
  requiredStorage: number;
  requiredNetwork: number;

  installScript?: string; // Nullable
  updateScript?: string; // Nullable
  deleteScript?: string; // Nullable

  computerCount: number;
  firstUploadAt: Date;
  lastUploadAt: Date;
};

export type FrontendSocket = Omit<Socket, 'data'> & {
  data: Payload;
};

export type ListWithPagination<T> = {
  data: T[];
  currentPage: number;
  totalPages: number;
  totalRecords: number;
};

export type ProductList = {
  id: string;
  name: string;
  version: string;
  icon: string;
  installed: boolean;
  publisher: string;
  agentVersion: string;
  serverFileSize: string;
  agentFileSize: string;
};

export type ProductOne = {
  id: string;
  name: string;
  icon?: string;
  version: string;
  installed: boolean;
  size: number;
  company: string;
  description?: string;
} & (
  | {
      supportOS?: string;
      requiredCpuCore: number;
      requiredRam: number;
      requiredStorage: number;
      requiredNetwork: number;
    }
  | {
      computerCounts: number;
      firstUploadAt?: Date;
      lastUploadAt?: Date;
      serverHost: string;
    }
);

export type Application = {
  id?: string;
  remoteId?: string;
  computerId?: string;
  name: string;
  version: string;
  installed_date: Date;
  type: string;
  size: number;
};

export type NetworkAdapter = {
  nic_name: string;
  ip_address: string;
  mac_address: string;
  available: 'Up' | 'Down'; //| string;
};

export type Disk = {
  drive_name: string;
  drive_type: string;
  total_size: number;
  available_space: number;
};

export type Computer = {
  id: string;
  key?: string;
  hostname: string;
  operation_system: string;
  platform: string;
  build_number: string;
  version: string;
  ram: number;
  cpu: string;
  model: string;
  cores: number;
  network_adapters: string; //NetworkAdapter[];
  disks: string; //Disk[];
};

export type ComputerForList = {
  id: string;
  hostname: string;
  operation_system: string;
  network_adapters?: NetworkAdapter[];
  activity?: string;
  ipAddress?: string;
};

export type AgentSocket = Omit<Socket, 'data'> & {
  data: PayloadAgent;
};

export type ProductListsForGetAll = {
  id: string;
  name: string;
  version: string;
  icon: string;
  installed: boolean;
  publisher: string;
  agentVersion: string;
  serverFileSize: string;
  agentFileSize: string;
}[];
