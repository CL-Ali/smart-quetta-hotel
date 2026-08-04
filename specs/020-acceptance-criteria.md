# 020 Acceptance Criteria

## Feature: Open Visit

Scenario: Guest opens captive portal and starts a visit

Given the guest has no active visit

When the guest enters a name

Then the Guest should be created if missing

And the Visit should be OPEN

And a ticket should be generated

And a browser session cookie should be stored

## Feature: Resume Visit

Scenario: Guest returns after browser reset

Given the guest has a previously opened visit

When the guest resumes by ticket or QR

Then the Visit should be resumed

And the browser session should be restored

## Feature: Create Order

Given a Visit is OPEN

When the guest places an order

Then the Order should be created successfully

And the kitchen should receive the order in realtime

## Feature: Invoice Generation

Given a Visit has one or more orders

When the cashier closes the bill

Then an Invoice should be issued

And the invoice should include all billable items

And a Receipt should be generated after payment

## Feature: Payment

Given an Invoice is issued

When a payment is received

Then the payment should be recorded

And the Invoice state should move toward Paid or remain Partial until fully settled

And the Payment state should be updated accordingly
