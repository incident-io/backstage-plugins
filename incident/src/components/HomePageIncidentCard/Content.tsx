import { Progress } from "@backstage/core-components";
import Link from "@material-ui/core/Link";
import { Alert } from "@material-ui/lab";
import React from "react";
import { useIncidentList } from "../../hooks/useIncidentRequest";
import { Typography, List } from "@material-ui/core";
import { IncidentListItem } from "../IncidentListItem";
import { configApiRef, useApi } from "@backstage/core-plugin-api";
import { getBaseUrl } from "../../config";

export const HomePageIncidentCardContent = () => {
  const config = useApi(configApiRef);
  const baseUrl = getBaseUrl(config);

  const query = new URLSearchParams();
  query.set(`status_category[one_of]`, "live");
  const { loading, error, value } = useIncidentList(query);
  const incidents = value?.incidents;

  if (loading) return <Progress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <>
      {incidents && incidents.length > 0 && (
        <Typography variant="subtitle1">
          There are <strong>{incidents.length}</strong> ongoing incidents.
        </Typography>
      )}
      {incidents && incidents.length === 0 && (
        <Typography variant="subtitle1">No ongoing incidents.</Typography>
      )}
      <List dense>
        {incidents?.map((incident) => {
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
        <Link target="_blank" href={`${baseUrl}/incidents?${query.toString()}`}>
          see more.
        </Link>
      </Typography>
    </>
  );
};

export const Content = () => {
  return <HomePageIncidentCardContent />;
};
