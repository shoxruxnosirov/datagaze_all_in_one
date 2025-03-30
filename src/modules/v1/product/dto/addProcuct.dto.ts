export class CreateProductDto {
  name: string;
  publisher: string;
  serverVersion: string;
  agentVersion: string;
  installScript: string;
  updateScript: string;
  deleteScript: string;
}
