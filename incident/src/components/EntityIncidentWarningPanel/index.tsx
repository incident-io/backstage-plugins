/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import {Entity} from "@backstage/catalog-model";
import {Progress, WarningPanel,} from "@backstage/core-components";
import {ApiHolder, ConfigApi, configApiRef, useApi} from "@backstage/core-plugin-api";
import {useEntity} from "@backstage/plugin-catalog-react";
import {Alert} from "@material-ui/lab";
import {List, Typography,} from "@material-ui/core";
import React, {useState} from "react";
import {useIdentity, useIncidentList} from "../../hooks/useIncidentRequest";
import {IncidentListItem} from "../IncidentListItem";
import Link from "@material-ui/core/Link";
import {IncidentApiRef} from "../../api/client";
import {definitions} from "../../api/types";

/**
 * Returns true if the given entity has ongoing incidents
 *
 * @public
 */
export async function hasOngoingIncident(
  entity: Entity,
  context: { apis: ApiHolder },
) {
  const configApi = context.apis.get(configApiRef);
  if (!configApi) {
    throw new Error(`No implementation available for ${configApiRef}`);
  }

  const incidentApi = context.apis.get(IncidentApiRef);
  if (!incidentApi) {
    throw new Error(`No implementation available for ${IncidentApiRef}`);
  }

  try {
    const entityFieldID = getEntityFieldID(configApi, entity);
    const entityID = `${entity.metadata.namespace}/${entity.metadata.name}`;

    const query = new URLSearchParams();
    query.set(`custom_field[${entityFieldID}][one_of]`, entityID);
    query.set(`status_category[one_of]`, "active");

    const result =  await incidentApi.request<
      definitions["IncidentsV2ListResponseBody"]
    >({
      path: `/v2/incidents?${query.toString()}`,
    });

    return result.incidents.length > 0
  } catch (e) {
    return false
  }
}

// The card displayed on the entity page showing a handful of the most recent
// incidents that are on-going for that component.
export const EntityIncidentWarningPanel = ({
  maxIncidents = 2,
}: {
  maxIncidents?: number;
}) => {
  const config = useApi(configApiRef);
  const { entity } = useEntity();
  const {
    value: identityResponse,
    loading: identityResponseLoading,
    error: identityResponseError,
  } = useIdentity();

  const [reload, _setReload] = useState(false);

  const entityFieldID = getEntityFieldID(config, entity);
  const entityID = `${entity.metadata.namespace}/${entity.metadata.name}`;

  // This query filters incidents for those that are associated with this
  // entity.
  const query = new URLSearchParams();
  query.set(`custom_field[${entityFieldID}][one_of]`, entityID);

  // This restricts the previous filter to focus only on live incidents.
  const queryLive = new URLSearchParams(query);
  queryLive.set(`status_category[one_of]`, "active");

  const {
    value: incidentsResponse,
    loading: incidentsLoading,
    error: incidentsError,
  } = useIncidentList(queryLive, [reload]);

  const incidents = incidentsResponse?.incidents;

  if (incidentsLoading || identityResponseLoading || !identityResponse) {
    return <Progress />;
  }

  if (!incidents || incidents.length === 0) {
    return <></>;
  }

  const baseUrl = identityResponse.identity.dashboard_url;
  const title = `There are *${incidents.length}* ongoing incidents
                    involving *${entity.metadata.name}*.`

  return (
      <WarningPanel title={title} titleFormat="markdown">
        {identityResponseError && (
          <Alert severity="error">{identityResponseError.message}</Alert>
        )}
        {incidentsError && (
          <Alert severity="error">{incidentsError.message}</Alert>
        )}
        {!incidentsLoading && !incidentsError && (
            <>
              {incidents && incidents.length === 0 && (
                  <Typography variant="subtitle1">No ongoing incidents.</Typography>
              )}
              <List dense>
                {incidents?.slice(0, maxIncidents)?.map((incident) => {
                  return (
                      <IncidentListItem
                          key={incident.id}
                          incident={incident}
                          baseUrl={baseUrl}
                      />
                  );
                })}
              </List>
              <Typography variant="subtitle1">
                Click to{" "}
                <Link
                    target="_blank"
                    href={`${baseUrl}/incidents?${queryLive.toString()}`}
                >
                  see more.
                </Link>
              </Typography>
            </>
        )}
      </WarningPanel>
  );
};

// Find the ID of the custom field in incident that represents the association
// to this type of entity.
//
// In practice, this will be kind=Component => ID of Affected components field.
function getEntityFieldID(config: ConfigApi, entity: Entity) {
  switch (entity.kind) {
    case "API":
      return config.getOptional("incident.fields.api");
    case "Component":
      return config.getOptional("incident.fields.component");
    case "Domain":
      return config.getOptional("incident.fields.domain");
    case "System":
      return config.getOptional("incident.fields.system");
    default:
      throw new Error(`unrecognised entity kind: ${entity.kind}`);
  }
}
