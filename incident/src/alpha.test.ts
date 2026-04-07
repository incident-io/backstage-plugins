import plugin from "./alpha";

describe("incident alpha plugin", () => {
  it("should export a plugin with the correct pluginId", () => {
    expect(plugin).toBeDefined();
    expect(plugin.id).toBe("incident");
  });

});
