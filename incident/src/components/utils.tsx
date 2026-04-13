import { Entity } from "@backstage/catalog-model";
import { ConfigApi } from "@backstage/core-plugin-api";


// Find the ID of the custom field in incident that represents the association
// to this type of entity.
//
// In practice, this will be kind=Component => ID of Affected components field.
export function getEntityFieldID(config: ConfigApi, entity: Entity) {
  switch (entity.kind) {
    case "API":
      return config.getOptional("incident.fields.api");
    case "Component":
      return config.getOptional("incident.fields.component");
    case "Domain":
      return config.getOptional("incident.fields.domain");
    case "System":
      return config.getOptional("incident.fields.system");
    case "Group":
      return config.getOptional("incident.fields.group");
    default:
      throw new Error(`unrecognised entity kind: ${entity.kind}`);
  }
}