import { Progress } from "@backstage/core-components";
import { configApiRef, useApi } from "@backstage/core-plugin-api";
import { useEntity } from "@backstage/plugin-catalog-react";
import {
  Box,
  Card,
  CardContent,
  CardHeader,
  Divider,
  IconButton,
  List,
  Tab,
  Tabs,
  Typography,
} from "@material-ui/core";
import Link from "@material-ui/core/Link";
import { Alert } from "@material-ui/lab";
import CachedIcon from "@material-ui/icons/Cached";
import { useState } from "react";
import {
  useAlertList,
  useAlertSourceList,
  useIdentity,
  useIncidentAlertList,
  useIncidentList,
} from "../../hooks/useIncidentRequest";
import { getEntityFieldID } from "../utils";
import { AlertListItem } from "../AlertListItem";

type StatusFilter = "firing" | "resolved" | undefined;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Firing", value: "firing" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: undefined },
];

const IncorrectConfigCard = () => (
  <Card>
    <CardHeader title="Alerts" />
    <Divider />
    <CardContent>
      <Typography variant="subtitle1">
        No custom field configuration was found. In order to display alerts,
        this entity must be mapped to an incident.io custom field ID in
        Backstage's app-config.yaml.
      </Typography>
    </CardContent>
  </Card>
);

export const EntityAlertCard = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("firing");
  const [reload, setReload] = useState(false);

  const config = useApi(configApiRef);
  const { entity } = useEntity();
  const entityFieldID = getEntityFieldID(config, entity);
  const entityID = `${entity.metadata.namespace}/${entity.metadata.name}`;

  // query for incidents associated with this entity
  const incidentQuery = new URLSearchParams();
  incidentQuery.set(`custom_field[${entityFieldID}][one_of]`, entityID);

  const { value: incidentsResponse, loading: incidentsLoading } =
    useIncidentList(incidentQuery, [reload]);
  const incidentIds = (incidentsResponse?.incidents ?? []).map(i => i.id);

  // query for alerts linked to those incidents
  const { value: incidentAlertsResponse, loading: incidentAlertsLoading } =
    useIncidentAlertList(incidentIds, [reload]);
  const linkedAlertIds = new Set(
    (incidentAlertsResponse?.incident_alerts ?? []).map(ia => ia.alert.id),
  );

  const { value: alertsResponse, loading: alertsLoading, error } =
    useAlertList(statusFilter, [reload]);
  const { value: sourcesResponse } = useAlertSourceList();
  const { value: identityResponse } = useIdentity();

  // get alerts for this entity's incidents
  const allAlerts = alertsResponse?.alerts ?? [];
  const alerts = incidentIds.length > 0
    ? allAlerts.filter(a => linkedAlertIds.has(a.id))
    : [];

  const baseUrl = identityResponse?.identity.dashboard_url ?? "";

  const sourceById = Object.fromEntries(
    (sourcesResponse?.alert_sources ?? []).map(s => [s.id, s]),
  );

  const currentTabIndex = STATUS_TABS.findIndex(t => t.value === statusFilter);
  if (!entityFieldID) {
    return <IncorrectConfigCard />;
  }

  if (incidentsLoading || incidentAlertsLoading || alertsLoading) {
    return <Progress />;
  }

  return (
    <Card>
      <CardHeader
        title="incident.io Alerts"
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
      />
      <Divider />
      <Tabs
        value={currentTabIndex}
        onChange={(_, idx) => setStatusFilter(STATUS_TABS[idx].value)}
        indicatorColor="primary"
        textColor="primary"
      >
        {STATUS_TABS.map(tab => (
          <Tab key={tab.label} label={tab.label} />
        ))}
      </Tabs>
      <Divider />
      <CardContent>
        {error && <Alert severity="error">{error.message}</Alert>}
        {!error && alerts.length === 0 && (
          <Typography variant="subtitle1">No alerts.</Typography>
        )}
        {!error && alerts.length > 0 && (
          <>
            <Typography variant="subtitle1">
              There are <strong>{alerts.length}</strong>{" "}
              {statusFilter ?? ""} alerts.
            </Typography>
            <Box style={{ maxHeight: 400, overflowY: "auto" }}>
              <List dense>
                {alerts.map(alert => (
                  <AlertListItem
                    key={alert.id}
                    alert={alert}
                    baseUrl={baseUrl}
                    source={sourceById[alert.alert_source_id]?.name ?? "-"}
                    priority={alert.attributes.find(a => a.attribute.name === "Priority")?.value?.label}
                  />
                ))}
              </List>
            </Box>
          </>
        )}
        {baseUrl && (
          <Typography variant="subtitle1">
            <Link target="_blank" href={`${baseUrl}/on-call/alerts`}>
              View all alerts
            </Link>
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};
