# 006 Realtime

## Model

- Commands create intent.
- Events confirm domain transitions.
- Socket updates should mirror persisted state.

## Socket Events

- order.created
- order.updated
- kitchen.ready
- visit.closed
- invoice.generated
- payment.received
- receipt.generated

## Event Rules

- Events must be emitted after durable database write succeeds.
- Kitchen and cashier views must subscribe to the same source of truth.
- Clients should reconcile with a REST refresh if socket state is missed.
