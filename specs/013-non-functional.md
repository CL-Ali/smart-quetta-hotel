# 013 Non-Functional

## Performance

- 100 concurrent users on LAN
- Under 2 second response for common actions
- Fast first load for captive portal use cases
- Keep recovery and resume actions quick enough for repeated guest use

## Reliability

- Offline-friendly operation
- Docker deployment
- Graceful recovery after restart
- Session recovery should survive browser closure and device restarts

## Security

- Helmet or equivalent headers
- Rate limiting
- Input validation
- Audit trails for important actions
- Signed guest sessions and role-based staff access
