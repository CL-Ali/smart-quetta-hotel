# 009 Captive Portal

## Purpose

Captive portal is the entry point into the restaurant app, not the business logic layer.

## Flow

WiFi -> Captive Portal -> Open Browser -> Redirect -> Restaurant App

## Supported Gateway Environments

- MikroTik
- OpenWRT
- UniFi
- RFC 8910 / RFC 8908 (DHCP Option 114 / IPv6 RA Option 37 Capport API)

## Endpoints

- `GET /api/portal/entry`: HTTP redirect handler for vendor gateways (MikroTik, UniFi, OpenWRT).
- `GET /api/captive` & `GET /.well-known/capport`: RFC 8910 / RFC 8908 JSON API returning `application/captive+json` with `user-portal-url` and `venue-info-url`.

## Adapter Model

- Captive Portal Adapter
- MikroTik Adapter
- OpenWRT Adapter
- UniFi Adapter

## Responsibilities

- Detect LAN entry and redirect guests to the app.
- Pass along enough context to resume a visit.
- Serve RFC 8910 JSON for modern OS captive network assistants (Android 11+, iOS 14+, macOS, Windows 11).
- Avoid embedding ordering, billing, or kitchen logic.

## Separation Rule

- Captive portal handles network entry and redirect behavior.
- Core ordering, billing, and kitchen logic remain in the main application backend.

