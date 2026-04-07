import plugin from "./alpha";

describe("incident alpha plugin", () => {
  it("should export a plugin with the correct pluginId", () => {
    expect(plugin).toBeDefined();
    expect(plugin.id).toBe("incident");
  });

  it("should register three extensions", () => {
    // Expects the API, entity card, and home page widget to all be present.
    expect(plugin.extensions).toHaveLength(3);
  });
});
