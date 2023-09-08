/*
 * Copyright 2023 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { ConfigApi } from "@backstage/core-plugin-api";

// Find the baseUrl of the incident dashboard.
function getBaseUrl(config: ConfigApi) {
  try {
    const baseUrl = config.getString("incident.baseUrl");
    if (baseUrl !== "") {
      return new URL(baseUrl);
    }
  } catch (e) {
    // no action
  }

  return new URL("https://app.incident.io");
}

// Build a URL to the incident.io dashboard.
export function buildUrl(
  config: ConfigApi,
  path: string,
  query: URLSearchParams = new URLSearchParams()
): string {
  const baseUrl = getBaseUrl(config);
  // Allocate a new URL
  const url = new URL(path, baseUrl);
  url.search = query.toString();

  return url.toString();
}
