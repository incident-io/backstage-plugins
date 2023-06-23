import { DiscoveryApi, IdentityApi } from '@backstage/core-plugin-api';
export declare const IncidentApiRef: import("@backstage/core-plugin-api").ApiRef<Incident>;
type HTTPMethods = 'GET' | 'PUT' | 'POST' | 'PATCH' | 'DELETE';
export interface Incident {
    request<T>({ method, path, body, }: {
        method?: HTTPMethods;
        path: string;
        body?: string;
    }): Promise<T>;
}
type Options = {
    discoveryApi: DiscoveryApi;
    identityApi: IdentityApi;
    proxyPath?: string;
};
export declare class IncidentApi implements Incident {
    private readonly discoveryApi;
    private readonly identityApi;
    private readonly proxyPath;
    constructor(opts: Options);
    request<T = any>({ path, method, body, }: {
        path: string;
        method?: HTTPMethods;
        body?: string;
    }): Promise<T>;
}
export {};
