# ADR-004: Model The Business Around Guest And Visit

## Status

Accepted

## Context

The legacy model centers on customer name and orders. The SDD direction requires a clearer business boundary for identity, visit lifecycle, billing, and recovery.

## Decision

Use Guest as the durable identity and Visit as the temporary business session that groups orders, invoices, payments, and receipts.

## Consequences

- Better session recovery
- Cleaner billing lifecycle
- Easier captive portal integration
- Stronger separation between browser state and business state
