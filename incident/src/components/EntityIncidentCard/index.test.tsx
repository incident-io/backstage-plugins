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
  useIdentity: vi.fn(),
}));

vi.mock("@backstage/core-components", () => ({
  Progress: () => <div data-testid="progress" />,
  HeaderIconLinkRow: () => null,
}));

vi.mock("../IncidentListItem", () => ({
  IncidentListItem: ({ incident }: any) => <div>{incident.name}</div>,
}));

import { useApi } from "@backstage/core-plugin-api";
import { useEntity } from "@backstage/plugin-catalog-react";
import { useIncidentList, useIdentity } from "../../hooks/useIncidentRequest";
import { EntityIncidentCard } from "./index";

const mockEntity = {
  kind: "Component",
  metadata: { name: "my-service", namespace: "default" },
};

const mockIdentityLoaded = {
  value: { identity: { dashboard_url: "https://app.incident.io" } },
  loading: false,
  error: undefined,
};

beforeEach(() => {
  (useEntity as ReturnType<typeof vi.fn>).mockReturnValue({ entity: mockEntity });
});

describe("EntityIncidentCard", () => {
  it("should show misconfiguration message when no custom field is configured", () => {
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      getOptional: () => undefined,
    });
    (useIdentity as ReturnType<typeof vi.fn>).mockReturnValue(mockIdentityLoaded);
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: false,
      error: undefined,
    });

    render(<EntityIncidentCard />);

    expect(
      screen.getByText(/No custom field configuration was found/i),
    ).toBeInTheDocument();
  });

  it("should show a loading indicator while fetching", () => {
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      getOptional: () => "01FIELD123",
    });
    (useIdentity as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: true,
      error: undefined,
    });
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: true,
      error: undefined,
    });

    render(<EntityIncidentCard />);

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });

  it("should show empty state when there are no ongoing incidents", () => {
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      getOptional: () => "01FIELD123",
    });
    (useIdentity as ReturnType<typeof vi.fn>).mockReturnValue(mockIdentityLoaded);
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: { incidents: [] },
      loading: false,
      error: undefined,
    });

    render(<EntityIncidentCard />);

    expect(screen.getByText(/No ongoing incidents/i)).toBeInTheDocument();
  });

  it("should show incident count and list items when incidents exist", () => {
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      getOptional: () => "01FIELD123",
    });
    (useIdentity as ReturnType<typeof vi.fn>).mockReturnValue(mockIdentityLoaded);
    (useIncidentList as ReturnType<typeof vi.fn>).mockReturnValue({
      value: {
        incidents: [
          { id: "INC-1", name: "Database down" },
          { id: "INC-2", name: "API latency spike" },
        ],
      },
      loading: false,
      error: undefined,
    });

    render(<EntityIncidentCard />);

    expect(
      screen.getByText((_, el) => {
        if (!el) return false;
        return (
          el.tagName === "H6" &&
          !!el.textContent?.includes("There are") &&
          !!el.textContent?.includes("2") &&
          !!el.textContent?.includes("ongoing incidents")
        );
      })
    ).toBeInTheDocument();
    expect(screen.getByText("Database down")).toBeInTheDocument();
    expect(screen.getByText("API latency spike")).toBeInTheDocument();
  });
});
