export function createStore() {
  return { writes: [] };
}

export function handleRequest(store, request) {
  if (!request?.idempotencyKey) throw new Error("idempotency key required");
  const entry = { key: request.idempotencyKey, value: request.value };
  store.writes.push(entry);
  return { status: 201, entry };
}
