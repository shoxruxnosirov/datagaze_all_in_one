import { Model, RelationMappings } from 'objection';
import { Application } from './application.model';

export class Computer extends Model {
  static tableName = 'computers';

  id!: number;
  hostname!: string;
  operationSystem!: string;
  platform!: string;
  buildNumber!: string;
  version!: string;
  ram!: number;
  cpu!: string;
  model!: string;
  cores!: number;
  networkAdapters!: object; // JSONB
  disks!: object; // JSONB
  createdAt!: Date;

  static get relationMappings(): RelationMappings {
    return {
      applications: {
        relation: Model.HasManyRelation,
        modelClass: Application,
        join: {
          from: 'computers.id',
          to: 'applications.computerId',
        },
      },
    };
  }
}
