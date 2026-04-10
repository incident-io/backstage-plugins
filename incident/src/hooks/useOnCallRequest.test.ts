import { renderHook, waitFor } from "@testing-library/react";
import { vi } from "vitest";
import { useAllEscalationPaths, useAllSchedules } from "./useOnCallRequest";

vi.mock("@backstage/core-plugin-api", () => ({
  useApi: vi.fn(),
  createApiRef: vi.fn(),
}));

import { useApi } from "@backstage/core-plugin-api";

describe("useAllEscalationPaths", () => {
  it("should return all escalation paths from the API", async () => {
    const mockResponse = {
      escalation_paths: [
        { id: "ep-1", name: "Primary EP" },
        { id: "ep-2", name: "Secondary EP" },
      ],
    };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useAllEscalationPaths([]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse.escalation_paths);
    expect(result.current.error).toBeUndefined();
  });
});

describe("useAllSchedules", () => {
  it("should return all schedules from the API", async () => {
    const mockResponse = {
      schedules: [
        { id: "sched-1", name: "Primary Schedule" },
        { id: "sched-2", name: "Secondary Schedule" },
      ],
    };
    (useApi as ReturnType<typeof vi.fn>).mockReturnValue({
      request: vi.fn().mockResolvedValue(mockResponse),
    });

    const { result } = renderHook(() => useAllSchedules([]));

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.value).toEqual(mockResponse.schedules);
    expect(result.current.error).toBeUndefined();
  });
});
