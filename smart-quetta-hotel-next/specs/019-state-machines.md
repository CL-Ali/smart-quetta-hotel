# 019 State Machines

## Visit

CREATED -> OPEN -> PAYMENT_PENDING -> CLOSED -> ARCHIVED

## Guest

PENDING -> ACTIVE -> RESUMED -> INACTIVE

## Order

Pending -> Accepted -> Preparing -> Ready -> Served -> Completed

## Invoice

Draft -> Issued -> Paid -> Cancelled

## Payment

Pending -> Paid -> Refunded -> Cancelled

## Notes

- State transitions should be explicit and validated.
- A later state should not be reachable without the required prior state.
- UI labels may differ slightly from internal enum names, but the transition rules should stay stable.
