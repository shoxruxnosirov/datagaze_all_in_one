import { AuthType } from "src/comman/types";

export class ConnectDto {
  // server_id: string;
  host: string;
  port: string;
  username: string;
  // auth_type: AuthType;
  password?: string;
  private_key?: string;
}

// interface IServer {
//   server_id: string;
//   ip: string;
//   port: string;
//   username: string;
//   auth_type: 'password' | 'private_key'; // Union tipi bilan aniqlash
//   password?: string; // Faqat auth_type === 'password' bo'lganda ishlatiladi
//   private_key?: string; // Faqat auth_type === 'key' bo'lganda ishlatiladi
// }

// export type ConnectDto = Omit<IServer, 'password' | 'private_key'> & (
//   {
//     auth_type: 'password';
//     password: string;
//   } | {
//     auth_type: 'private_key';
//     private_key: string;
//   }
// );
