import { makeStyles, Theme } from "@material-ui/core";

export const useStyles = makeStyles<Theme>((theme) => ({
  listItemPrimary: {
    display: "flex", // vertically align with chip
    fontWeight: "bold",
    gap: theme.spacing(1),    
  },
  warning: {
    borderColor: theme.palette.warning.main,
    color: theme.palette.warning.main,
    "& *": {
      color: theme.palette.warning.main,
    },
  },
  error: {
    borderColor: theme.palette.error.main,
    color: theme.palette.error.main,
    "& *": {
      color: theme.palette.error.main,
    },
  },
  success: {
    borderColor: theme.palette.success.main,
    color: theme.palette.success.main,
    "& *": {
      color: theme.palette.success.main,
    },
  },
}));