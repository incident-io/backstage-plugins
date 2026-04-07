import { IncidentApi } from "./client";

const mockDiscoveryApi = {
  getBaseUrl: async () => "http://localhost:7007/api/proxy",
};

describe("IncidentApi", () => {
  it("should call the correct URL and return parsed JSON", async () => {
    const mockFetchApi = {
      fetch: async () => ({
        ok: true,
        json: async () => ({ id: "123" }),
      }),
    };

    const client = new IncidentApi({
      discoveryApi: mockDiscoveryApi as any,
      fetchApi: mockFetchApi as any,
    });

    const result = await client.request({ path: "/v2/incidents" });
    expect(result).toEqual({ id: "123" });
  });

  it("should throw an error when the response is not ok", async () => {
    const mockFetchApi = {
      fetch: async () => ({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
      }),
    };

    const client = new IncidentApi({
      discoveryApi: mockDiscoveryApi as any,
      fetchApi: mockFetchApi as any,
    });

    await expect(client.request({ path: "/v2/incidents" })).rejects.toThrow(
      "401 Unauthorized",
    );
  });
});
