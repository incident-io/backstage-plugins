import { DateTime, Duration } from "luxon";
import {
  Chip,
  IconButton,
  ListItem,
  ListItemSecondaryAction,
  ListItemText,
  Tooltip,
  Typography,
} from "@material-ui/core";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";
import { components } from "../../api/types";
import { useStyles } from "../IncidentListItem";

// Single item in the list of on-going alerts.
export const AlertListItem = ({
  baseUrl,
  alert,
  source,
  priority
}: {
  baseUrl: string;
  alert: components["schemas"]["AlertV2"];
  source: string;
  priority?: string; 
}) => {
  const classes = useStyles();

  const sinceCreated = new Date().getTime() - new Date(alert.created_at).getTime();
  const sinceCreatedLabel = DateTime.local()
    .minus(Duration.fromMillis(sinceCreated))
    .toRelative({ locale: "en" });

  return (
    <ListItem dense key={alert.id}>
      <ListItemText
        primary={
          <>
            <Chip
              data-testid={`chip-${alert.status}`}
              label={alert.status}
              size="small"
              variant="outlined"
              className={
                ["firing"].includes(alert.status)
                  ? classes.error
                  : classes.success
              }
            />
            {alert.title}
            {priority && (
              <Chip
                data-testid={`chip-${priority}`}
                label={priority}
                size="small"
                variant="outlined"
              />
            )}
          </>
        }
        primaryTypographyProps={{
          variant: "body1",
          className: classes.listItemPrimary,
        }}
        secondary={
          <Typography noWrap variant="body2" color="textSecondary">
            Created {sinceCreatedLabel} from {source}.
          </Typography>
        }
      />
      <ListItemSecondaryAction>
        <Tooltip title="View in incident.io" placement="top">
          <IconButton
            href={`${baseUrl}/on-call/alerts/${alert.id}/details`}
            target="_blank"
            rel="noopener noreferrer"
            color="primary"
          >
            <OpenInBrowserIcon />
          </IconButton>
        </Tooltip>
      </ListItemSecondaryAction>
    </ListItem>
  );
};
