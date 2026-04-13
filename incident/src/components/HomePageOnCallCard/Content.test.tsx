/// <reference types="@testing-library/jest-dom" />
import { screen } from "@testing-library/react";
import { renderInTestApp } from "@backstage/test-utils";
import { vi } from "vitest";

vi.mock("../../hooks/useIncidentRequest", () => ({
  useIdentity: vi.fn(),
}));

vi.mock("../../hooks/useOnCallRequest", () => ({
  useAllEscalationPaths: vi.fn(),
  useAllSchedules: vi.fn(),
}));

vi.mock("@backstage/core-components", () => ({
  Progress: () => <div data-testid="progress" />,
}));

import { useIdentity } from "../../hooks/useIncidentRequest";
import { useAllEscalationPaths, useAllSchedules } from "../../hooks/useOnCallRequest";
import { Content } from "./Content";

const mockIdentityLoaded = {
  value: { identity: { dashboard_url: "https://app.incident.io" } },
  loading: false,
  error: undefined,
};

beforeEach(() => {
  (useIdentity as ReturnType<typeof vi.fn>).mockReturnValue(mockIdentityLoaded);
});

describe("HomePageOnCallCard Content", () => {
  it("should show a loading indicator while fetching", async () => {
    (useAllEscalationPaths as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: true,
      error: undefined,
    });
    (useAllSchedules as ReturnType<typeof vi.fn>).mockReturnValue({
      value: undefined,
      loading: true,
      error: undefined,
    });

    await renderInTestApp(<Content />);

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });

  it("should show empty states when there are no EPs or schedules", async () => {
    (useAllEscalationPaths as ReturnType<typeof vi.fn>).mockReturnValue({
      value: [],
      loading: false,
      error: undefined,
    });
    (useAllSchedules as ReturnType<typeof vi.fn>).mockReturnValue({
      value: [],
      loading: false,
      error: undefined,
    });

    await renderInTestApp(<Content />);

    expect(screen.getByText(/No escalation paths/i)).toBeInTheDocument();
    expect(screen.getByText(/No schedules/i)).toBeInTheDocument();
  });

  it("should render EP and schedule names when data is loaded", async () => {
    (useAllEscalationPaths as ReturnType<typeof vi.fn>).mockReturnValue({
      value: [
        { id: "ep-1", name: "Primary EP" },
        { id: "ep-2", name: "Secondary EP" },
      ],
      loading: false,
      error: undefined,
    });
    (useAllSchedules as ReturnType<typeof vi.fn>).mockReturnValue({
      value: [{ id: "sched-1", name: "Primary Schedule" }],
      loading: false,
      error: undefined,
    });

    await renderInTestApp(<Content />);

    expect(screen.getByText("Primary EP")).toBeInTheDocument();
    expect(screen.getByText("Secondary EP")).toBeInTheDocument();
    expect(screen.getByText("Primary Schedule")).toBeInTheDocument();
  });
});
