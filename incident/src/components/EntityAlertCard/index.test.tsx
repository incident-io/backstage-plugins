/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@backstage/core-plugin-api", () => ({
  useApi: vi.fn(),
  configApiRef: {},
}));

vi.mock("@backstage/plugin-catalog-react", () => ({
  useEntity: vi.fn(),
}));

vi.mock("../../hooks/useIncidentRequest", () => ({
  useIncidentList: vi.fn(),
  useIncidentAlertList: vi.fn(),
  useAlertList: vi.fn(),
  useAlertSourceList: vi.fn(),
  useIdentity: vi.fn(),
}));

vi.mock("@backstage/core-components", () => ({
  Progress: () => <div data-testid="progress" />,
}));

vi.mock("../AlertListItem", () => ({
  AlertListItem: ({ alert }: any) => (
    <div data-testid={`alert-${alert.id}`}>{alert.title}</div>
  ),
}));

vi.mock("../utils", () => ({
  getEntityFieldID: vi.fn(),
}));

import { useApi } from "@backstage/core-plugin-api";
import { useEntity } from "@backstage/plugin-catalog-react";
import {
  useIncidentList,
  useIncidentAlertList,
  useAlertList,
  useAlertSourceList,
  useIdentity,
} from "../../hooks/useIncidentRequest";
import { getEntityFieldID } from "../utils";
import { EntityAlertCard } from "./index";

const mockEntity = {
  kind: "Component",
  metadata: { name: "my-service", namespace: "default" },
};

const mockIdentityLoaded = {
  value: { identity: { dashboard_url: "https://app.incident.io" } },
  loading: false,
  error: undefined,
};

const mockSourcesLoaded = {
  value: { alert_sources: [] },
  loading: false,
  error: undefined,
};

beforeEach(() => {
  (useEntity as ReturnType<typeof vi.fn>).mockReturnValue({
    entity: mockEntity,
  });
  (useIdentity as ReturnType<typeof vi.fn>).mockReturnValue(mockIdentityLoaded);
  (useAlertSourceList as ReturnType<typeof vi.fn>).mockReturnValue(
    mockSourcesLoaded,
  );
  (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
    getOptional: () => "01FIELD123",
    getOptionalString: () => undefined,
  });
});

describe("EntityAlertCard", () => {
  it("should show MissingConfigCard when getEntityFieldID returns undefined", () => {
    (getEntityFieldID as ReturnType<typeof vi.fn>).mockReturnValue(undefined);
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: false,
      error: undefined,
    });
    (useIncidentAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: false,
      error: undefined,
    });
    (useAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: false,
      error: undefined,
    });

    render(<EntityAlertCard />);

    expect(
      screen.getByText(/No custom field configuration was found/i),
    ).toBeInTheDocument();
  });

  it("should show progress when a hook is loading", () => {
    (getEntityFieldID as ReturnType<typeof vi.fn>).mockReturnValue("01FIELD123");
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: true,
      error: undefined,
    });
    (useIncidentAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: false,
      error: undefined,
    });
    (useAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: false,
      error: undefined,
    });

    render(<EntityAlertCard />);

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });

  it("should show 'No alerts.' when incidentIds is empty", () => {
    (getEntityFieldID as ReturnType<typeof vi.fn>).mockReturnValue("01FIELD123");
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incidents: [] },
      loading: false,
      error: undefined,
    });
    (useIncidentAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incident_alerts: [] },
      loading: false,
      error: undefined,
    });
    (useAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { alerts: [] },
      loading: false,
      error: undefined,
    });

    render(<EntityAlertCard />);

    expect(screen.getByText("No alerts.")).toBeInTheDocument();
  });

  it("should show alert count and AlertListItem when alerts are linked", () => {
    (getEntityFieldID as ReturnType<typeof vi.fn>).mockReturnValue("01FIELD123");
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incidents: [{ id: "inc-1" }] },
      loading: false,
      error: undefined,
    });
    (useIncidentAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incident_alerts: [{ alert: { id: "alert-1" } }] },
      loading: false,
      error: undefined,
    });
    (useAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: {
        alerts: [
          {
            id: "alert-1",
            title: "High error rate",
            status: "firing",
            alert_source_id: "src-1",
            attributes: [],
          },
        ],
      },
      loading: false,
      error: undefined,
    });

    render(<EntityAlertCard />);

    expect(
      screen.getByText((_, el) => {
        if (!el) return false;
        return (
          el.tagName === "H6" &&
          !!el.textContent?.includes("There are") &&
          !!el.textContent?.includes("1") &&
          !!el.textContent?.includes("firing")
        );
      }),
    ).toBeInTheDocument();
    expect(screen.getByTestId("alert-alert-1")).toBeInTheDocument();
  });

  it("should render a refresh button", () => {
    (getEntityFieldID as ReturnType<typeof vi.fn>).mockReturnValue("01FIELD123");
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incidents: [] },
      loading: false,
      error: undefined,
    });
    (useIncidentAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incident_alerts: [] },
      loading: false,
      error: undefined,
    });
    (useAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { alerts: [] },
      loading: false,
      error: undefined,
    });

    render(<EntityAlertCard />);

    expect(screen.getByRole("button", { name: "Refresh" })).toBeInTheDocument();
  });

  it("should render status filter tabs", () => {
    (getEntityFieldID as ReturnType<typeof vi.fn>).mockReturnValue("01FIELD123");
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incidents: [] },
      loading: false,
      error: undefined,
    });
    (useIncidentAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incident_alerts: [] },
      loading: false,
      error: undefined,
    });
    (useAlertList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { alerts: [] },
      loading: false,
      error: undefined,
    });

    render(<EntityAlertCard />);

    expect(screen.getByRole("tab", { name: "Firing" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "Resolved" })).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: "All" })).toBeInTheDocument();
  });
});
