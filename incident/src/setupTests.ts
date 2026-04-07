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
import "@testing-library/jest-dom/vitest";
import "cross-fetch/polyfill";

// eslint-disable-next-line no-console
const originalError = console.error.bind(console);
// eslint-disable-next-line no-console
console.error = (...args: unknown[]) => {                                                                                                     
  if (typeof args[0] === 'string' && args[0].includes('Could not parse CSS stylesheet')) {                                                    
      return;                                                                                                                                   
  }                                                                                                                                           
  originalError(...args);                                                                                                                     
};              
