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
<<<<<<< HEAD
  it("should show a loading indicator while fetching", async () => {
=======
  it("should show a loading indicator while fetching", () => {
>>>>>>> 8131692 (Add tests for on-call cards)
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

<<<<<<< HEAD
    await renderInTestApp(<Content />);
=======
    render(<Content />);
>>>>>>> 8131692 (Add tests for on-call cards)

    expect(screen.getByTestId("progress")).toBeInTheDocument();
  });

<<<<<<< HEAD
  it("should show empty states when there are no EPs or schedules", async () => {
=======
  it("should show empty states when there are no EPs or schedules", () => {
>>>>>>> 8131692 (Add tests for on-call cards)
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

<<<<<<< HEAD
    await renderInTestApp(<Content />);
=======
    render(<Content />);
>>>>>>> 8131692 (Add tests for on-call cards)

    expect(screen.getByText(/No escalation paths/i)).toBeInTheDocument();
    expect(screen.getByText(/No schedules/i)).toBeInTheDocument();
  });

<<<<<<< HEAD
  it("should render EP and schedule names when data is loaded", async () => {
=======
  it("should render EP and schedule names when data is loaded", () => {
>>>>>>> 8131692 (Add tests for on-call cards)
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

<<<<<<< HEAD
    await renderInTestApp(<Content />);
=======
    render(<Content />);
>>>>>>> 8131692 (Add tests for on-call cards)

    expect(screen.getByText("Primary EP")).toBeInTheDocument();
    expect(screen.getByText("Secondary EP")).toBeInTheDocument();
    expect(screen.getByText("Primary Schedule")).toBeInTheDocument();
  });
});
