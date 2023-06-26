import { createApiRef, createPlugin, createApiFactory, discoveryApiRef, identityApiRef, createComponentExtension } from '@backstage/core-plugin-api';

const IncidentApiRef = createApiRef({
  id: "plugin.incident.service"
});
const DEFAULT_PROXY_PATH = "/incident/api";
class IncidentApi {
  constructor(opts) {
    var _a;
    this.discoveryApi = opts.discoveryApi;
    this.identityApi = opts.identityApi;
    this.proxyPath = (_a = opts.proxyPath) != null ? _a : DEFAULT_PROXY_PATH;
  }
  async request({
    path,
    method = "GET",
    body
  }) {
    const apiUrl = await this.discoveryApi.getBaseUrl("proxy") + this.proxyPath;
    const { token } = await this.identityApi.getCredentials();
    const resp = await fetch(`${apiUrl}${path}`, {
      method,
      body,
      headers: {
        Authorization: `Bearer ${token}`
      }
    });
    if (!resp.ok) {
      throw new Error(`${resp.status} ${resp.statusText}`);
    }
    return await resp.json();
  }
}

const incidentPlugin = createPlugin({
  id: "incident",
  apis: [
    createApiFactory({
      api: IncidentApiRef,
      deps: { discoveryApi: discoveryApiRef, identityApi: identityApiRef },
      factory: ({ discoveryApi, identityApi }) => {
        return new IncidentApi({
          discoveryApi,
          identityApi
        });
      }
    })
  ]
});
const EntityIncidentCard = incidentPlugin.provide(
  createComponentExtension({
    name: "EntityIncidentCard",
    component: {
      lazy: () => import('./index-d6d4efc6.esm.js').then(
        (m) => m.EntityIncidentCard
      )
    }
  })
);

export { EntityIncidentCard as E, IncidentApiRef as I, incidentPlugin as i };
//# sourceMappingURL=index-9302f6bc.esm.js.map
