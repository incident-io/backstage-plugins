import { useState } from "react";
import { Progress } from "@backstage/core-components";
import { configApiRef, useApi } from "@backstage/core-plugin-api";
import Link from "@material-ui/core/Link";
import { Alert } from "@material-ui/lab";
import { Box, Divider, List, Tab, Tabs, Typography } from "@material-ui/core";
import { useAlertList, useAlertSourceList } from "../../hooks/useIncidentRequest";
import { AlertListItem } from "../AlertListItem";

type StatusFilter = "firing" | "resolved" | undefined;

const STATUS_TABS: { label: string; value: StatusFilter }[] = [
  { label: "Firing", value: "firing" },
  { label: "Resolved", value: "resolved" },
  { label: "All", value: undefined },
];

export const HomePageAlertCardContent = () => {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("firing");

  const config = useApi(configApiRef);
  const baseUrl =
    config.getOptionalString("incident.baseUrl") || "https://app.incident.io";

  const { loading, error, value } = useAlertList(statusFilter, [statusFilter]);
  const { value: sourcesResponse } = useAlertSourceList();

  const alerts = value?.alerts ?? [];
  const sourceById = Object.fromEntries(
    (sourcesResponse?.alert_sources ?? []).map(s => [s.id, s]),
  );

  const currentTabIndex = STATUS_TABS.findIndex(t => t.value === statusFilter);

  if (loading) return <Progress />;
  if (error) return <Alert severity="error">{error.message}</Alert>;

  return (
    <>
      <Tabs
        value={currentTabIndex}
        onChange={(_, idx) => setStatusFilter(STATUS_TABS[idx].value)}
        indicatorColor="primary"
        textColor="primary"
        style={{ minHeight: "auto" }}
      >
        {STATUS_TABS.map(tab => (
          <Tab key={tab.label} label={tab.label} style={{ minHeight: "auto", padding: "0px 12px" }} />
        ))}
      </Tabs>
      <Divider />
      {alerts.length > 0 && (
        <Typography variant="subtitle1">
          There are <strong>{alerts.length}</strong> {statusFilter ?? ""} alerts.
        </Typography>
      )}
      {alerts.length === 0 && (
        <Typography variant="subtitle1">No {statusFilter ?? ""} alerts.</Typography>
      )}
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
      <Typography variant="subtitle1">
        Click to{" "}
        <Link target="_blank" href={`${baseUrl}/on-call/alerts`}>
          see more.
        </Link>
      </Typography>
    </>
  );
};

export const Content = () => {
  return <HomePageAlertCardContent />;
};
