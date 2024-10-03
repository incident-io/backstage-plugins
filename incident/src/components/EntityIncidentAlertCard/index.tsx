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
import { Entity } from "@backstage/catalog-model";
import {
  Progress,
} from "@backstage/core-components";
import { ConfigApi, configApiRef, useApi } from "@backstage/core-plugin-api";
import { useEntity } from "@backstage/plugin-catalog-react";
import { Alert, AlertTitle } from "@material-ui/lab";
import {
  IconButton,
  Tooltip,
} from "@material-ui/core";
import React, { useState } from "react";
import { useIncidentList, useIdentity } from "../../hooks/useIncidentRequest";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";

// The card displayed on the entity page showing a handful of the most recent
// incidents that are on-going for that component.
export const EntityIncidentAlertCard = ({
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

  const baseUrl = identityResponse.identity.dashboard_url;

  return (
    <>
    {identityResponseError && (
      <Alert severity="error">{identityResponseError.message}</Alert>
    )}
    {incidentsError && (
      <Alert severity="error">{incidentsError.message}</Alert>
    )}
    {incidents?.slice(0, maxIncidents)?.map((incident) => {
          return (
            <Alert severity="warning">
              <AlertTitle>{incident.reference} {incident.name}</AlertTitle>
              <Tooltip title="View in incident.io" placement="top">
                <IconButton
                  href={`${baseUrl}/incidents/${incident.id}`}
                  target="_blank"
                    rel="noopener noreferrer"
                    color="primary"
                  >
                  <OpenInBrowserIcon />
                </IconButton>
              </Tooltip>
            </Alert>
          );
        })}
    </>
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
