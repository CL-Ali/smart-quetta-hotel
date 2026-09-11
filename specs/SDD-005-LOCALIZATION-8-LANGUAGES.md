# 📋 SDD-005: 8-Language Localization & RTL Engine

| Specification ID | SDD-005 |
| :--- | :--- |
| **Title** | **8-Language Localization Matrix & RTL Typography Engine** |
| **Status** | `APPROVED / ACTIVE` |
| **Layer / Component** | `src/contexts/LangContext.tsx`, `src/app/layout.tsx`, all feature views |
| **Last Updated** | 2026-09-11 |

---

## 1. Overview & Cultural Significance

Quetta is the multilingual crossroads of Balochistan and Pakistan, where patrons, waiters, and kitchen staff communicate in diverse regional languages and scripts. To provide an authentic, universally accessible experience across POS, Kitchen, Waiter, and Customer interfaces, the system natively supports **8 regional and national languages**.

---

## 2. Language Matrix & Directionality

| Code | Language Name | Native Script | Direction | Primary Usage / Demographics |
| :--- | :--- | :--- | :--- | :--- |
| `en` | **English** | English | `LTR` | Administration, tech staff, international guests |
| `ur` | **Urdu** | اردو | `RTL` | National lingua franca, cashier default |
| `ps` | **Pashto** | پښتو | `RTL` | Dominant local language in northern Balochistan |
| `bal` | **Balochi** | بلوچی | `RTL` | Dominant local language in southern Balochistan |
| `brh` | **Brahui** | براہوئی | `RTL` | Central Balochistan / Mastung / Kalat communities |
| `fa` | **Persian (Dari / Farsi)** | فارسی | `RTL` | Hazara community & Afghan trade corridor |
| `pa` | **Punjabi (Shahmukhi)** | پنجابی | `RTL` | Trade partners and visitors |
| `sd` | **Sindhi** | سنڌي | `RTL` | Bordering Sindh trade routes & Jacobabad/Sukkur patrons |

---

## 3. Architecture & Implementation

### 3.1 Type-Safe Context Schema
```typescript
// src/contexts/LangContext.tsx
export type SupportedLang = 'en' | 'ur' | 'ps' | 'bal' | 'brh' | 'fa' | 'pa' | 'sd';

export const RTL_LANGS: Set<SupportedLang> = new Set([
  'ur', 'ps', 'bal', 'brh', 'fa', 'pa', 'sd'
]);

export function isRtlLang(lang: SupportedLang): boolean {
  return RTL_LANGS.has(lang);
}
```

### 3.2 Dynamic RTL Attribute Propagation
When a user switches language via the global language dropdown:
1. `lang` is updated in React state and persisted to `localStorage.setItem('smart_hotel_lang', lang)`.
2. The `document.documentElement` attributes are dynamically set:
   ```typescript
   document.documentElement.dir = isRtlLang(lang) ? 'rtl' : 'ltr';
   document.documentElement.lang = lang;
   ```
3. CSS flex directions, text alignments, and margin offsets automatically adapt without custom override hacks.

---

## 4. Translation Dictionary & Fallback Hierarchy

All UI strings are defined in a typed translation matrix:

```mermaid
flowchart TD
    Req[Lookup Key: t(key)] --> L1{Key exists in Active Lang?}
    L1 -->|Yes| Output[Render Localized Text]
    L1 -->|No| L2{Key exists in Urdu 'ur'?}
    L2 -->|Yes| UrFallback[Render Urdu Text]
    L2 -->|No| L3{Key exists in English 'en'?}
    L3 -->|Yes| EnFallback[Render English Text]
    L3 -->|No| KeyFallback[Render key string as fallback]
```

### Core Translation Categories:
- **Navigation & Brand**: App titles, navigation tabs, status indicators.
- **POS & Billing**: Cashier inputs, Customer Name, Phone, Market Shopkeeper selector, Pre-order review, Khata settlement terms.
- **Kitchen & Order Status**: `PENDING`, `PREPARING`, `READY`, `SERVED`, `CANCELLED`.
- **Product Notes & Preferences**: `Karak`, `Kam Cheeni`, `Crispy`, `Spicy`, `Extra Butter`.

---

## 5. Developer Rules for SDD Multilingual Compliance

1. **NO Hardcoded UI Strings**:
   - ❌ Bad: `<button>Confirm Order</button>`
   - ✅ Good: `<button>{t('confirmOrder') || 'Confirm Order'}</button>`
2. **Dynamic Placeholders**:
   - Use token replacement for dynamic variables (e.g. `Table {num}` -> `t('tableNumber').replace('{num}', tableId)`).
3. **Typography & Font Rendering**:
   - Ensure proper CSS `font-family` fallbacks for Nastaliq and Arabic scripts (`system-ui, 'Noto Nastaliq Urdu', 'Noto Sans Arabic', sans-serif`).

---

## 6. Verification & Quality Assurance

- **Type Checking**: All dictionary keys are checked at compile time via TypeScript index keys.
- **Automated Verification**:
  - `npm run check` ensures all language references and contexts compile with zero type errors.
  - Test suite verifies `isRtlLang()` returns correct boolean for all 8 supported codes.
