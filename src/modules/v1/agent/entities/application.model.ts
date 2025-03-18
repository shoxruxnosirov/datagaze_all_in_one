import { Model, RelationMappings } from "objection";
import { Computer } from "./computer.model";

export class Application extends Model {
  static tableName = "applications";

  id?: string;
  remoteId?: string;
  computerId?: string;
  name: string;
  version: string;
  installed_date: Date;
  type: string;
  size: number;

  static get relationMappings(): RelationMappings {
    return {
      computer: {
        relation: Model.BelongsToOneRelation,
        modelClass: Computer,
        join: {
          from: "applications.computerId",
          to: "computers.id",
        },
      },
    };
  }
}
