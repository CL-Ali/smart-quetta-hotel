# 025 Security Model

## Guest Security

- Guest browser sessions should use signed, scoped cookies or equivalent tokens.
- Session recovery must not expose another guest's visit.
- Ticket and QR recovery should be validated against the correct guest or visit.

## Staff Security

- Staff access should use authenticated roles.
- Admin operations should require explicit permission checks.
- Kitchen and waiter roles should only access the actions they need.

## API Security

- Rate limit unauthenticated entry points.
- Validate every recovery and payment request.
- Log important security-relevant events.
