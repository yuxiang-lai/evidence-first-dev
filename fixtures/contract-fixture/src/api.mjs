export function getWidget(id) {
  if (!id) return { status: 400, body: { error: "id is required" } };
  return { status: 200, body: { id, name: "Example widget" } };
}
