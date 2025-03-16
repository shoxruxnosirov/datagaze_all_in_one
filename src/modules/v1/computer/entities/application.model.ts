import { Model, RelationMappings } from "objection";
import { Computer } from "../../computer/entities/computer.model";

export class Application extends Model {
  static tableName = "applications";

  id!: number;
  computerId!: number;
  name!: string;
  size!: number;
  type!: string;
  installedAt!: Date;

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
