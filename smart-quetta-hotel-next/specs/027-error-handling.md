# 027 Error Handling

## Scenarios

- Offline network
- Reconnect after portal reload
- Duplicate order submission
- Stale visit resume
- Payment retries
- Partial payment mismatch

## Rules

- Duplicate requests must be idempotent where possible.
- Offline UI should keep the last known menu and visit state visible.
- Reconnect should reconcile local state with server state.
- Payment failures should not lose the invoice or visit context.
