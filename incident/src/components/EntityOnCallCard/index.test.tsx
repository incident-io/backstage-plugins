/// <reference types="@testing-library/jest-dom" />
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

vi.mock("@backstage/core-plugin-api", () => ({
  useApi: vi.fn(),
  createApiRef: vi.fn(),
}));

vi.mock("@backstage/plugin-catalog-react", () => ({
  useEntity: vi.fn(),
}));

vi.mock("../../hooks/useIncidentRequest", () => ({
  useIdentity: vi.fn(),
}));

vi.mock("../../hooks/useOnCallRequest", () => ({
  useOnCallData: vi.fn(),
  useSchedule: vi.fn(),
  useEscalationPath: vi.fn(),
}));

vi.mock("@backstage/core-components", () => ({
  Progress: () => <div data-testid="progress" />,
}));

import { useEntity } from "@backstage/plugin-catalog-react";
import { useIdentity } from "../../hooks/useIncidentRequest";
import { useOnCallData, useSchedule, useEscalationPath } from "../../hooks/useOnCallRequest";
import { EntityOnCallCard } from "./index";

const mockEntity = {
  metadata: { name: "core-server", namespace: "default" },
};

const mockIdentityLoaded = {
  value: { identity: { dashboard_url: "https://app.incident.io" } },
  loading: false,
  error: undefined,
};

beforeEach(() => {
  (useEntity as ReturnType<typeof vi.fn>).mockReturnValue({ entity: mockEntity });
  (useIdentity as ReturnType<typeof vi.fn>).mockReturnValue(mockIdentityLoaded);
  (useSchedule as ReturnType<typeof vi.fn>).mockReturnValue({ value: null, loading: false, error: undefined });
  (useEscalationPath as ReturnType<typeof vi.fn>).mockReturnValue({ value: null, loading: false, error: undefined });
});

describe("EntityOnCallCard", () => {
  it("should show a loading indicator while fetching", () => {
    (useOnCallData as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: true,
      error: undefined,
    });

    render(<EntityOnCallCard />);

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });

  it("should show error alerts when EP and schedule fields are missing", () => {
    (useOnCallData as ReturnType<typeof vi.fn>).mockReturnValue({
      value: {
        escalationPath: null,
        schedule: null,
        escalationPathStatus: "no_field",
        scheduleStatus: "no_field",
      },
      loading: false,
      error: undefined,
    });

    render(<EntityOnCallCard />);

    expect(screen.getByText(/No escalation path field on this catalog type/i)).toBeInTheDocument();
    expect(screen.getByText(/No schedule field on this catalog type/i)).toBeInTheDocument();
  });

  it("should show warning alerts when EP and schedule fields are empty", () => {
    (useOnCallData as ReturnType<typeof vi.fn>).mockReturnValue({
      value: {
        escalationPath: null,
        schedule: null,
        escalationPathStatus: "empty",
        scheduleStatus: "empty",
      },
      loading: false,
      error: undefined,
    });

    render(<EntityOnCallCard />);

    expect(screen.getByText(/Escalation path field is empty for this component/i)).toBeInTheDocument();
    expect(screen.getByText(/Schedule field is empty for this component/i)).toBeInTheDocument();
  });

  it("should show escalation path and schedule names when loaded", () => {
    (useOnCallData as ReturnType<typeof vi.fn>).mockReturnValue({
      value: {
        escalationPath: { label: "Primary EP", literal: "ep-1" },
        schedule: { label: "Primary Schedule", literal: "sched-1" },
        escalationPathStatus: "ok",
        scheduleStatus: "ok",
      },
      loading: false,
      error: undefined,
    });
    (useEscalationPath as ReturnType<typeof vi.fn>).mockReturnValue({
      value: {
        ep: { id: "ep-1", name: "Primary EP", path: [], current_responders: [] },
        channelNames: {},
      },
      loading: false,
      error: undefined,
    });
    (useSchedule as ReturnType<typeof vi.fn>).mockReturnValue({
      value: {
        id: "sched-1",
        name: "Primary Schedule",
        current_shifts: [],
        config: { rotations: [] },
      },
      loading: false,
      error: undefined,
    });

    render(<EntityOnCallCard />);

    expect(screen.getByText("Primary EP")).toBeInTheDocument();
    expect(screen.getByText("Primary Schedule")).toBeInTheDocument();
  });
});
