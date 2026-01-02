import React, { createContext, useContext, useMemo } from "react";

type HomePageIncidentCardContextValue = {
  filterType: "status_category" | "status";
  filter: string;
};

const Context = createContext<HomePageIncidentCardContextValue | undefined>(
  undefined,
);

export const ContextProvider = (props: {
  children: React.JSX.Element;
  filterType?: "status_category" | "status";
  filter?: string;
}) => {
  const {
    children,
    filterType: defaultFilterType,
    filter: defaultFilter,
  } = props;

  const value = useMemo(
    () => ({
      filterType: defaultFilterType || "status_category",
      filter: defaultFilter || "active",
    }),
    [defaultFilter, defaultFilterType],
  );

  return <Context.Provider value={value}>{children}</Context.Provider>;
};

export const useHomePageIncidentCard = () => {
  const value = useContext(Context);

  if (value === undefined) {
    throw new Error(
      "useHomePageIncidentCard must be used within a HomePageIncidentCardContextProvider",
    );
  }

  return value;
};

export default Context;
