# Smart Quetta Hotel

A modern hotel management web app built with **React**, **TRPC**, and **Shadcn UI**. It provides responsive interfaces for staff roles:

- **Dashboard** – Overview of orders, quick actions, and language switching.
- **Kitchen** – View and update cooking orders in real‑time.
- **Waiter** – Serve ready orders and create new ones.

## Usage Flow

1. **Open the Dashboard** – Shows a summary of pending/ready orders. Use the language switcher to change UI language.
2. **Create a New Order** – Click the **+ New Order** button on the Dashboard. The `NewOrderSheet` modal appears; fill in customer name and items, then submit.
3. **Kitchen View** – Kitchen staff see pending and cooking orders. They can start cooking (`Start Cooking`) and mark orders as ready (`Ready to Serve`).
4. **Waiter View** – Waiters see ready‑to‑serve orders, confirm serving, and the order moves to the recent‑served list.
5. **Order Lifecycle** – Orders transition from **pending → preparing → ready → served** with real‑time updates via TRPC polling.

## Screenshots

| Screen | Description |
|--------|-------------|
| ![Dashboard1](file:///C:/Users/stuck/.gemini/antigravity-ide/brain/ca435adf-585f-411a-8831-7a33c2fe1498/dashboard_1782136353934.png) | Dashboard overview (first image) |
| ![Kitchen2](file:///C:/Users/stuck/.gemini/antigravity-ide/brain/ca435adf-585f-411a-8831-7a33c2fe1498/kitchen_1782136415930.png) | Kitchen page with cooking orders (second image) |
| ![Waiter3](file:///C:/Users/stuck/.gemini/antigravity-ide/brain/ca435adf-585f-411a-8831-7a33c2fe1498/waiter_1782136429946.png) | Waiter view for serving orders (third image) |

## Running the Project

```bash
# Clone the repo
git clone https://github.com/your-username/smart-quetta-hotel.git
cd smart-quetta-hotel

# Install dependencies (using pnpm, npm or yarn)
pm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:3000`.

## Contributing

Feel free to open issues or submit pull requests. Follow the existing code style and ensure UI components stay responsive across devices.
