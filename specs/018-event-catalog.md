# 018 Event Catalog

## Commands

- CreateGuest
- OpenVisit
- ResumeVisit
- CloseVisit
- CreateOrder
- GenerateInvoice
- ReceivePayment

## Core Events

- GuestCreated
- VisitOpened
- OrderCreated
- OrderAccepted
- OrderPreparing
- OrderReady
- OrderServed
- InvoiceGenerated
- PaymentReceived
- VisitClosed

## Event Contract Rules

- Events should be named in past tense or state-change form.
- One event should represent one meaningful domain transition.
- Socket.io should follow this catalog exactly.
- REST and tRPC mutations should emit these events after persistence.
- Commands are synchronous intent handlers that may emit one or more events.

## Suggested Payload Shape

- id
- entityId
- entityType
- occurredAt
- actorId optional
- payload
