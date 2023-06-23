import { HeaderIconLinkRow, Progress } from '@backstage/core-components';
import { useApi, configApiRef } from '@backstage/core-plugin-api';
import { useEntity } from '@backstage/plugin-catalog-react';
import { makeStyles, ListItem, ListItemText, Chip, Typography, ListItemSecondaryAction, Tooltip, IconButton, Card, CardHeader, Divider, CardContent, List } from '@material-ui/core';
import Link from '@material-ui/core/Link';
import CachedIcon from '@material-ui/icons/Cached';
import HistoryIcon from '@material-ui/icons/History';
import WhatshotIcon from '@material-ui/icons/Whatshot';
import { Alert } from '@material-ui/lab';
import React, { useState } from 'react';
import { useAsync } from 'react-use';
import { I as IncidentApiRef } from './index-50e32be6.esm.js';
import { DateTime, Duration } from 'luxon';
import OpenInBrowserIcon from '@material-ui/icons/OpenInBrowser';

function getBaseUrl(config) {
  try {
    const baseUrl = config.getString("incident.baseUrl");
    if (baseUrl !== "") {
      return baseUrl;
    }
  } catch (e) {
  }
  return "https://app.incident.io";
}

const useStyles = makeStyles((theme) => ({
  listItemPrimary: {
    display: "flex",
    // vertically align with chip
    fontWeight: "bold"
  },
  warning: {
    borderColor: theme.palette.status.warning,
    color: theme.palette.status.warning,
    "& *": {
      color: theme.palette.status.warning
    }
  },
  error: {
    borderColor: theme.palette.status.error,
    color: theme.palette.status.error,
    "& *": {
      color: theme.palette.status.error
    }
  }
}));
const IncidentListItem = ({
  baseUrl,
  incident
}) => {
  var _a, _b;
  const classes = useStyles();
  const reportedAt = (_a = incident.incident_timestamp_values) == null ? void 0 : _a.find(
    (ts) => ts.incident_timestamp.name.match(/reported/i)
  );
  const reportedAtDate = ((_b = reportedAt == null ? void 0 : reportedAt.value) == null ? void 0 : _b.value) || incident.created_at;
  const sinceReported = (/* @__PURE__ */ new Date()).getTime() - new Date(reportedAtDate).getTime();
  const sinceReportedLabel = DateTime.local().minus(Duration.fromMillis(sinceReported)).toRelative({ locale: "en" });
  const lead = incident.incident_role_assignments.find((roleAssignment) => {
    return roleAssignment.role.role_type === "lead";
  });
  return /* @__PURE__ */ React.createElement(ListItem, { dense: true, key: incident.id }, /* @__PURE__ */ React.createElement(
    ListItemText,
    {
      primary: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        Chip,
        {
          "data-testid": `chip-${incident.incident_status.id}`,
          label: incident.incident_status.name,
          size: "small",
          variant: "outlined",
          className: ["live"].includes(incident.incident_status.category) ? classes.error : classes.warning
        }
      ), incident.reference, " ", incident.name),
      primaryTypographyProps: {
        variant: "body1",
        className: classes.listItemPrimary
      },
      secondary: /* @__PURE__ */ React.createElement(Typography, { noWrap: true, variant: "body2", color: "textSecondary" }, "Reported ", sinceReportedLabel, " and", " ", (lead == null ? void 0 : lead.assignee) ? `${lead.assignee.name} is lead` : "the lead is unassigned", ".")
    }
  ), /* @__PURE__ */ React.createElement(ListItemSecondaryAction, null, /* @__PURE__ */ React.createElement(Tooltip, { title: "View in incident.io", placement: "top" }, /* @__PURE__ */ React.createElement(
    IconButton,
    {
      href: `${baseUrl}/incidents/${incident.id}`,
      target: "_blank",
      rel: "noopener noreferrer",
      color: "primary"
    },
    /* @__PURE__ */ React.createElement(OpenInBrowserIcon, null)
  ))));
};

const EntityIncidentCard = ({
  maxIncidents = 2
}) => {
  var _a;
  const config = useApi(configApiRef);
  const baseUrl = getBaseUrl(config);
  const { entity } = useEntity();
  const IncidentApi = useApi(IncidentApiRef);
  const [reload, setReload] = useState(false);
  const entityFieldID = getEntityFieldID(config, entity);
  const entityID = `${entity.metadata.namespace}/${entity.metadata.name}`;
  const query = new URLSearchParams();
  query.set(`custom_field[${entityFieldID}][one_of]`, entityID);
  const queryLive = new URLSearchParams(query);
  queryLive.set(`status_category[one_of]`, "live");
  const createIncidentLink = {
    label: "Create incident",
    disabled: false,
    icon: /* @__PURE__ */ React.createElement(WhatshotIcon, null),
    href: `${baseUrl}/incidents/create`
  };
  const viewIncidentsLink = {
    label: "View past incidents",
    disabled: false,
    icon: /* @__PURE__ */ React.createElement(HistoryIcon, null),
    href: `${baseUrl}/incidents?${query.toString()}`
  };
  const {
    value: incidentsResponse,
    loading: incidentsLoading,
    error: incidentsError
  } = useAsync(async () => {
    return await IncidentApi.request({
      path: `/v2/incidents?${queryLive.toString()}`
    });
  }, [reload]);
  const incidents = incidentsResponse == null ? void 0 : incidentsResponse.incidents;
  return /* @__PURE__ */ React.createElement(Card, null, /* @__PURE__ */ React.createElement(
    CardHeader,
    {
      title: "Incidents",
      action: /* @__PURE__ */ React.createElement(React.Fragment, null, /* @__PURE__ */ React.createElement(
        IconButton,
        {
          component: Link,
          "aria-label": "Refresh",
          disabled: false,
          title: "Refresh",
          onClick: () => setReload(!reload)
        },
        /* @__PURE__ */ React.createElement(CachedIcon, null)
      )),
      subheader: /* @__PURE__ */ React.createElement(HeaderIconLinkRow, { links: [createIncidentLink, viewIncidentsLink] })
    }
  ), /* @__PURE__ */ React.createElement(Divider, null), /* @__PURE__ */ React.createElement(CardContent, null, incidentsLoading && /* @__PURE__ */ React.createElement(Progress, null), incidentsError && /* @__PURE__ */ React.createElement(Alert, { severity: "error" }, incidentsError.message), !incidentsLoading && !incidentsError && incidents && /* @__PURE__ */ React.createElement(React.Fragment, null, incidents && incidents.length >= 0 && /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle1" }, "There are ", /* @__PURE__ */ React.createElement("strong", null, incidents.length), " ongoing incidents involving ", /* @__PURE__ */ React.createElement("strong", null, entity.metadata.name), "."), incidents && incidents.length === 0 && /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle1" }, "No ongoing incidents."), /* @__PURE__ */ React.createElement(List, { dense: true }, (_a = incidents == null ? void 0 : incidents.slice(0, maxIncidents)) == null ? void 0 : _a.map((incident) => {
    return /* @__PURE__ */ React.createElement(
      IncidentListItem,
      {
        key: incident.id,
        incident,
        baseUrl
      }
    );
  })), /* @__PURE__ */ React.createElement(Typography, { variant: "subtitle1" }, "Click to", " ", /* @__PURE__ */ React.createElement(
    Link,
    {
      target: "_blank",
      href: `${baseUrl}/incidents?${queryLive.toString()}`
    },
    "see more."
  )))));
};
function getEntityFieldID(config, entity) {
  switch (entity.kind) {
    case "API":
      return config.get("incident.fields.api");
    case "Component":
      return config.get("incident.fields.component");
    case "Domain":
      return config.get("incident.fields.domain");
    case "System":
      return config.get("incident.fields.system");
    default:
      throw new Error(`unrecognised entity kind: ${entity.kind}`);
  }
}

export { EntityIncidentCard };
//# sourceMappingURL=index-5c6e75af.esm.js.map
