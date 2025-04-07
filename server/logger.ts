/**
 * Simple logger utility for server-side logging
 */
export function logger(message: string, source = "server") {
  console.log(`${new Date().toLocaleTimeString()} [${source}] ${message}`);
}