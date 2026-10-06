import { Entity } from "@backstage/catalog-model";
import { ConfigApi } from "@backstage/core-plugin-api";


export const EXTERNAL_ID_ANNOTATION = "incident.io/external-id";

// Find the external ID of this entity's incident.io catalog entry. Entries
// imported from Backstage use `namespace/name`; the annotation covers catalogs
// managed some other way.
export function getEntityExternalID(entity: Entity) {
  return (
    entity.metadata.annotations?.[EXTERNAL_ID_ANNOTATION] ??
    `${entity.metadata.namespace}/${entity.metadata.name}`
  );
}

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