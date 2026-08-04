Agar main **Quetta ke hotel/restaurant ke liye production-level system** banaun jo 5–10 saal chal sake, to main is architecture ko choose karunga.

---

# Goal

Customer:

* WiFi connect kare ya QR scan kare.
* Menu open ho.
* Name enter kare (optional).
* Order kare.
* Baad me aur order kare.
* Bill automatically update ho.
* Kitchen ko instantly order mil jaye.
* Cashier bill print kare.
* Manager reports dekhe.

Internet ho ya na ho, system chalna chahiye.

---

# Complete Architecture

```text
                   Customer Phone
                        │
                WiFi / QR Scan
                        │
                        ▼
               Next.js Web App (PWA)
                        │
           REST API + WebSocket
                        │
        ┌────────────────────────────┐
        │        NestJS API          │
        ├────────────────────────────┤
        │ Authentication             │
        │ Guest Management           │
        │ Orders                     │
        │ Billing                    │
        │ Kitchen Queue              │
        │ Inventory                  │
        │ Reports                    │
        └─────────────┬──────────────┘
                      │
        ┌─────────────┴─────────────┐
        │                           │
   PostgreSQL                  Redis
        │                           │
 Permanent Data              Live Queue
```

---

# Tech Stack

## Frontend

✅ Next.js

Reason

* SEO bhi milta hai
* PWA ban sakti hai
* Fast
* React ecosystem

Language

```text
TypeScript
```

UI

```text
Tailwind CSS
```

Components

```text
Shadcn UI
```

Icons

```text
Lucide React
```

Forms

```text
React Hook Form
```

Validation

```text
Zod
```

---

# Backend

Main Express nahi use karunga.

Use karunga

```text
NestJS
```

Reason

* Large projects
* Modular
* DI
* Guards
* Better architecture

---

# ORM

```text
Prisma
```

Reason

* Type Safe
* Fast
* Migration support

---

# Database

Main MongoDB bilkul use nahi karunga.

Restaurant system relational hota hai.

Best

```text
PostgreSQL
```

Tables

```text
Guest

Visit

Order

OrderItems

Invoice

Payment

Menu

Category

Kitchen

Users

Roles

Inventory

Purchase

Supplier

Expenses

Branch
```

---

# Redis

Use

```text
Realtime Queue

OTP

Cache

Sessions

Kitchen Queue
```

---

# Authentication

## Customer

Guest Session

Cookie

```text
guest_token
```

Database

```text
Guest

UUID
```

No password.

---

## Staff

JWT

*

Refresh Token

HttpOnly Cookies

---

# Kitchen

Socket.io

Customer

↓

Order

↓

Kitchen Screen

Immediately

↓

Cooking

↓

Ready

↓

Waiter

No refresh.

---

# Storage

Images

```text
MinIO
```

Ya

```text
Cloudflare R2
```

Agar sirf LAN

```text
/uploads
```

---

# Reports

Daily Sales

Weekly Sales

Monthly Sales

Best Selling

Slow Selling

Profit

Expenses

Cash Flow

---

# Billing

Har Visit ka

Invoice

```text
Visit

↓

Orders

↓

Invoice

↓

Payment
```

Payment

```text
Cash

Card

EasyPaisa

JazzCash
```

---

# Customer Flow

```text
Customer

↓

QR Scan

↓

Menu

↓

Enter Name

↓

Visit Created

↓

Order

↓

Kitchen

↓

Delivered

↓

More Order

↓

Bill

↓

Payment

↓

Visit Closed
```

---

# Database Design

Guest

```text
id

uuid

name

phone

created_at
```

Visit

```text
id

guest_id

ticket_no

status

opened_at

closed_at
```

Order

```text
id

visit_id

status

created_at
```

Order Items

```text
id

order_id

menu_id

qty

price
```

Invoice

```text
id

visit_id

subtotal

tax

discount

total
```

Payment

```text
id

invoice_id

method

amount
```

Menu

```text
id

category

price

available
```

---

# Folder Structure

```text
apps/

    frontend/

    backend/

packages/

    ui/

    shared/

database/

docker/
```

Backend

```text
src/

 auth/

 guest/

 visit/

 menu/

 kitchen/

 inventory/

 reports/

 billing/

 users/

 payment/
```

---

# Deployment

Mini PC

```text
Ubuntu
```

Docker

```text
Next.js

NestJS

Postgres

Redis

Nginx
```

---

# Network

```text
Customer

↓

WiFi

↓

Router

↓

Mini PC

↓

POS System
```

No internet required.

---

# Security

Helmet

Rate Limiter

CSRF

Validation

HTTPS

Encrypted Passwords

Audit Logs

RBAC

---

# Features

✅ QR Menu

✅ Kitchen Display

✅ Cashier

✅ Admin

✅ Inventory

✅ Expenses

✅ Suppliers

✅ Purchase

✅ Reports

✅ Dashboard

✅ Coupons

✅ Discounts

✅ Customer History

✅ Loyalty

✅ SMS

✅ WhatsApp

---

# Future

Later add

* Android App
* Waiter App
* Kitchen Tablet
* Customer Tracking
* AI Sales Prediction
* Multi Branch
* Cloud Sync

---

# Agar ye mera startup hota

Main is stack ko choose karta:

| Layer            | Technology                          |
| ---------------- | ----------------------------------- |
| Frontend         | Next.js + TypeScript                |
| UI               | Tailwind CSS + shadcn/ui            |
| Backend          | NestJS                              |
| ORM              | Prisma                              |
| Database         | PostgreSQL                          |
| Cache            | Redis                               |
| Realtime         | Socket.IO                           |
| Authentication   | JWT (Staff) + UUID Guest Cookie     |
| File Storage     | MinIO (LAN) / Cloudflare R2 (Cloud) |
| Reverse Proxy    | Nginx                               |
| Containerization | Docker + Docker Compose             |
| Operating System | Ubuntu Server                       |

## Ek design change jo main zaroor karunga

Main **Guest → Visit → Order → Invoice** model ko aur refine karunga:

```text
Guest (optional identity)
        │
        ├── Visit #V001 (OPEN)
        │      ├── Order #1
        │      ├── Order #2
        │      ├── Order #3
        │      └── Invoice (generated at payment)
        │
        └── Visit #V002 (future visit)
```

Yahan har baar customer "Add to Cart" se checkout kare to **naya Order** create hoga, lekin jab tak Visit `OPEN` hai, sab Orders ek hi Invoice me accumulate hote rahenge. Isse:

* Customer baar baar order kar sakta hai.
* Kitchen ko har order alag se real-time milta hai.
* Cashier ko sirf ek final bill print karna hota hai.
* Agar customer kal ya agle mahine aaye, to naya Visit banega, purani history safe rahegi.

Ye architecture enterprise POS systems me bhi commonly use hota hai aur future me multi-branch aur analytics ke liye bhi strong foundation deta hai.
