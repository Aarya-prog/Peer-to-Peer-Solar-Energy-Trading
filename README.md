# Solar Trade - MERN Smart Grid Ecosystem

Solar Trade is a premium, environment-friendly web application.  Built entirely on the MERN Stack, it facilitates rooftop solar installations, project crowdfunding investments, peer-to-peer electricity trading, billing cycles, and customer support tickets.

---

## Technical Stack
- **Frontend**: React.js, React Router DOM, Axios, Context API, Tailwind CSS, Framer Motion, Chart.js, React Icons, React Hot Toast
- **Backend**: Node.js, Express.js, MongoDB (Mongoose), JWT, bcryptjs, Multer, Express Validator, Express Rate Limit, Helmet, Cookie Parser, CORS
- **Database**: MongoDB

---

## Enterprise Folder Structure
```text
SolarTrade/
├── backend/            # Express, Mongoose Schemas & 50 REST APIs
├── frontend/           # React, Tailwind, Framer Motion pages
├── README.md           # Setup instructions
├── .gitignore          # Git exclusion rules
└── .dockerignore       # Docker exclusion rules
```

---

## Installation & Execution

### Prerequisites
1. Install [Node.js](https://nodejs.org) (v18+)
2. Install and start [MongoDB Community Server](https://www.mongodb.com/try/download/community) locally at `mongodb://127.0.0.1:27017`

### 1. Backend Setup
1. Open a terminal in the `backend/` directory:
   ```bash
   cd backend
   npm install
   ```
2. Check/create `.env` configurations:
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/solartrade
   JWT_SECRET=super_secret_jwt_key_solartrade_2026_go_green
   SOLARPAY_SECRET_KEY=solarpay_secure_gateway_private_hmac_secret_key
   NODE_ENV=development
   ```
3. Seed the database with the admin, engineer, and green grid templates (1 Admin, 1 Engineer, 15 Plans, 20 Projects):
   ```bash
   npm run seed
   ```
4. Start the Express development server:
   ```bash
   npm run dev
   ```
   *The backend will boot up at `http://localhost:5000`.*

### 2. Frontend Setup
1. Open a new terminal in the `frontend/` directory:
   ```bash
   cd frontend
   npm install
   ```
2. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *The frontend dashboard will boot up at `http://localhost:5173`.*

---

## Default Seeded Accounts

1. **Admin**:
   - Email: `admin@google.com`
   - Password: `admin123`
2. **Engineer**:
   - Email: `engineer@solartrade.com`
   - Password: `password123`

*Note: Customer and Investor users can be registered directly from the frontend Register page to test the end-to-end user creation, role section dashboards, and energy trading modules.*

---

## Key Modules
1. **SolarPay Secure Gateway**: Initiates cryptographic checkout signatures on the server via HMAC SHA256 hashes, prompting card checkouts, and verifying payloads before updating bill states, investment returns, or marketplace order ledger books.
2. **P2P Marketplace**: Trade excess rooftop solar power units (kWh) directly on the local grid. Platform commissions are auto-calculated at 5% and logged.
3. **Workflow Timelines**: Timeline trackers for solar installations (Request → Site Inspection → Quote → Engineer Assignment → Deploy → Complete).
4. **Dividends Portfolio**: Invest simulated funds to fund clean solar field arrays and watch ROI distributions grow based on operational status metrics.
