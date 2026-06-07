// Stable per-browser ID used in place of an auth user id.
const KEY = "stack-sentinel-device-id";

export function getDeviceId(): string {
  let id = localStorage.getItem(KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(KEY, id);
  }
  return id;
}
