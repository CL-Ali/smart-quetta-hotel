# 024 Network Architecture

## Purpose

Describe how the app sits behind the local network and captive portal layer.

## Layers

- Customer device
- Captive portal
- Restaurant app
- tRPC API
- SQLite database

## Adapter Model

- Captive Portal Adapter
- MikroTik Adapter
- OpenWRT Adapter
- UniFi Adapter

## Rules

- Network adapters should translate router behavior into app-friendly redirects and session hints.
- The core application must not depend on a single router vendor.
- Portal behavior should be isolated from ordering and billing logic.
