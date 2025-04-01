export class CreateProductDto {
  name: string;
  icon: string;
  serverVersion: string;
  agentVersion: string;
  serverFilePath: string;
  serverFileSize: number;
  agentFilePath: string;
  agentFileSize: number;
  publisher: string;
  installScript?: string;
  updateScript?: string;
  deleteScript?: string;
}
