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
  HeaderIconLinkRow,
  IconLinkVerticalProps,
  Progress,
} from "@backstage/core-components";
import { ConfigApi, configApiRef, useApi } from "@backstage/core-plugin-api";
import { useEntity } from "@backstage/plugin-catalog-react";
import {
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  List,
  Typography,
} from "@material-ui/core";
import Link from "@material-ui/core/Link";
import CachedIcon from "@material-ui/icons/Cached";
import HistoryIcon from "@material-ui/icons/History";
import WhatshotIcon from "@material-ui/icons/Whatshot";
import { Alert } from "@material-ui/lab";
import React, { useState } from "react";
import { useIncidentList, useIdentity } from "../../hooks/useIncidentRequest";
import { IncidentListItem } from "../IncidentListItem";

const IncorrectConfigCard = () => {
  return (
    <Card>
      <CardHeader title="incident.io" />
      <Divider />
      <CardContent>
        <Typography variant="subtitle1">
          No custom field configuration was found. In order to display
          incidents, this entity must be mapped to an incident.io custom field
          ID in Backstage's app-config.yaml.
        </Typography>
      </CardContent>
    </Card>
  );
};

// The card displayed on the entity page showing a handful of the most recent
// incidents that are on-going for that component.
export const EntityIncidentCard = ({
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

  const [reload, setReload] = useState(false);

  const entityFieldID = getEntityFieldID(config, entity);
  const entityID = `${entity.metadata.namespace}/${entity.metadata.name}, ${entity.metadata.name} `;

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

  if (!entityFieldID) {
    return <IncorrectConfigCard />;
  }

  if (incidentsLoading || identityResponseLoading || !identityResponse) {
    return <Progress />;
  }

  const baseUrl = identityResponse.identity.dashboard_url;

  const createIncidentLink: IconLinkVerticalProps = {
    label: "Declare incident",
    disabled: false,
    icon: <WhatshotIcon />,
    href: `${baseUrl}/incidents/create`,
  };

  const viewIncidentsLink: IconLinkVerticalProps = {
    label: "View past incidents",
    disabled: false,
    icon: <HistoryIcon />,
    href: `${baseUrl}/incidents?${query.toString()}`,
  };

  return (
    <Card>
      <CardHeader
        title="incident.io"
        action={
          <>
            <IconButton
              component={Link}
              aria-label="Refresh"
              disabled={false}
              title="Refresh"
              onClick={() => setReload(!reload)}
            >
              <CachedIcon />
            </IconButton>
          </>
        }
        subheader={
          <HeaderIconLinkRow links={[createIncidentLink, viewIncidentsLink]} />
        }
      />
      <Divider />
      <CardContent>
        {incidentsError && (
          <Alert severity="error">{incidentsError.message}</Alert>
        )}
        {identityResponseError && (
          <Alert severity="error">{identityResponseError.message}</Alert>
        )}
        {!incidentsLoading && !incidentsError && incidents && (
          <>
            {incidents && incidents.length > 0 && (
              <Typography variant="subtitle1">
                There are <strong>{incidents.length}</strong> ongoing incidents
                involving <strong>{entity.metadata.name}</strong>.
              </Typography>
            )}
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
      </CardContent>
    </Card>
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
