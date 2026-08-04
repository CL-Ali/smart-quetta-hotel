# 009 Captive Portal

## Purpose

Captive portal is the entry point into the restaurant app, not the business logic layer.

## Flow

WiFi -> Captive Portal -> Open Browser -> Redirect -> Restaurant App

## Supported Gateway Environments

- MikroTik
- OpenWRT
- UniFi

## Adapter Model

- Captive Portal Adapter
- MikroTik Adapter
- OpenWRT Adapter
- UniFi Adapter

## Responsibilities

- Detect LAN entry and redirect guests to the app.
- Pass along enough context to resume a visit.
- Avoid embedding ordering, billing, or kitchen logic.

## Separation Rule

- Captive portal handles network entry and redirect behavior.
- Core ordering, billing, and kitchen logic remain in the main application backend.
