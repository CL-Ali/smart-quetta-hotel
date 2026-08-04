# 023 Session Recovery

## Goal

Define how a guest can return to an active or recent visit when the browser session is lost.

## Recovery Paths

- Resume by Ticket
- Resume by QR
- Resume by Phone
- Resume by Staff
- Resume by Cookie

## Rules

- Guest identity and visit identity must be recoverable separately.
- A browser session may expire without deleting the underlying Guest or Visit record.
- If a cookie is deleted, the guest should still be able to recover using ticket or QR.
- If the phone restarts or browser closes, the visit resume flow should continue from the last valid recovery token.

## Operational Expectations

- Recovery should be possible from the captive portal landing page.
- Recovery should not require staff intervention in the normal case.
- Recovery tokens should be short-lived and auditable.
