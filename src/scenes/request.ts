import { defineScene } from "../engine/scene";

/** The specimen's scene: a read request from a browser through one region and back. Data only (SCN-2). */
export default defineScene({
  id: "request",
  label: "A browser, a load balancer, three api servers, a cache, a database with a replica, and a queue with a worker, in one region.",
  nodes: [
    { id: "vpc", kind: "zone", from: [4, 0], to: [25, 14], label: "us-east-1" },
    { id: "client", kind: "client", at: [0, 6], label: "browser" },
    { id: "lb", kind: "edge", at: [6, 5.5], label: "load balancer" },
    { id: "api", kind: "service", at: [11, 6], label: "api ×3" },
    { id: "cache", kind: "cache", at: [11, 1.5], label: "redis" },
    { id: "db", kind: "store", at: [17, 6], label: "postgres" },
    { id: "replica", kind: "store", at: [21.5, 6], label: "replica" },
    { id: "queue", kind: "queue", at: [10.5, 10.5], label: "orders queue" },
    { id: "worker", kind: "worker", at: [17, 10.5], label: "email worker" },
  ],
  edges: [
    { id: "c-lb", from: "client", to: "lb", kind: "sync", both: true },
    { id: "lb-api", from: "lb", to: "api", kind: "sync" },
    { id: "api-cache", from: "api", to: "cache", kind: "sync", both: true },
    { id: "api-db", from: "api", to: "db", kind: "sync", both: true },
    { id: "db-rep", from: "db", to: "replica", kind: "repl" },
    { id: "api-q", from: "api", to: "queue", kind: "async" },
    { id: "q-worker", from: "queue", to: "worker", kind: "async" },
  ],
});
