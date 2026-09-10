# 014 Deployment

## Target MVP Stack

- Ubuntu
- Docker
- Nginx
- Vite frontend
- React UI
- tRPC API
- SQLite database

## Network Topology

- Customer device connects to LAN WiFi
- Captive portal adapter handles redirect into the restaurant app
- Restaurant app serves frontend and API from the same deployment boundary for MVP
- Nginx can sit in front as a reverse proxy when needed

## Deployment Notes

- Use Docker for repeatable local and production setup.
- Keep captive portal adapters separate from business logic.
- Keep the database local for MVP and back it up regularly.
- Prefer LAN availability over cloud dependency.
- Do not require NestJS, Next.js, Redis, or PostgreSQL for the MVP deployment path.
