import { Progress } from "@backstage/core-components";
import { useIdentity } from "../../hooks/useIncidentRequest";
import { useAllEscalationPaths, useAllSchedules } from "../../hooks/useOnCallRequest";
import { Alert } from "@material-ui/lab";
import {
  Box,
  Divider,
  IconButton,
  Tooltip,
  Typography,
} from "@material-ui/core";
import OpenInBrowserIcon from "@material-ui/icons/OpenInBrowser";

export const Content = () => {
  const { value: identity } = useIdentity();
  const baseUrl = identity?.identity.dashboard_url ?? "app.incident.io";

  const { value: eps, loading: epsLoading, error: epsError } = useAllEscalationPaths();
  const { value: schedules, loading: schedulesLoading, error: schedulesError } = useAllSchedules();

  if (epsLoading || schedulesLoading) return <Progress />;

  return (
    <>
      <Typography variant="subtitle1"><strong>Escalation Paths</strong></Typography>
      <Divider />
      {epsError && <Alert severity="error">{epsError.message}</Alert>}
      {eps && eps.length === 0 && <Typography variant="body2" color="textSecondary">No escalation paths.</Typography>}
      {eps && eps.map(ep => (
        <Box key={ep.id} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
          <Typography variant="body2">{ep.name}</Typography>
          <Tooltip title="View in incident.io" placement="top">
            <IconButton size="small" href={`${baseUrl}/on-call/escalation-paths/${ep.id}`} target="_blank" rel="noopener noreferrer" color="primary">
              <OpenInBrowserIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ))}

      <Box mt={2}>
        <Typography variant="subtitle1"><strong>Schedules</strong></Typography>
        <Divider />
        {schedulesError && <Alert severity="error">{schedulesError.message}</Alert>}
        {schedules && schedules.length === 0 && <Typography variant="body2" color="textSecondary">No schedules.</Typography>}
        {schedules && schedules.map(schedule => (
          <Box key={schedule.id} display="flex" alignItems="center" justifyContent="space-between" py={0.5}>
            <Typography variant="body2">{schedule.name}</Typography>
            <Tooltip title="View in incident.io" placement="top">
              <IconButton size="small" href={`${baseUrl}/on-call/schedules/${schedule.id}`} target="_blank" rel="noopener noreferrer" color="primary">
                <OpenInBrowserIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
        ))}
      </Box>
    </>
  );
};
