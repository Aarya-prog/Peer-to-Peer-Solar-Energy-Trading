# SolarTrade - Project Synopsis

## 1. Project Title
**SolarTrade:** A Decentralized Peer-to-Peer Green Energy Microgrid Trading, Crowdfund Investment, and Smart Invoicing Platform.

---

## 2. Abstract
**SolarTrade** is a full-stack MERN (MongoDB, Express.js, React.js, Node.js) web application designed to digitize, decentralize, and democratize access to renewable green energy. The platform introduces a unified ecosystem that connects residential/commercial power consumers and solar microgrid investors under a single digital administration panel.

The system supports three core user roles:
*   **Customers (Consumers & Neighbors):** Can customize profiles to choose between Household Buy (Residential) or Commercial Buy (Business), verify identity credentials (KYC), trade surplus solar energy peer-to-peer on a localized grid marketplace, submit smart-meter utility connections, set up auto-pay details, manage wallets, view cleanliness metrics, and download formal invoice PDFs.
*   **Investors:** Can explore utility-scale community solar projects, sign digital agreements in a full-page simulated contract PDF reader, check funding limits, fund active microgrids via card checkouts or platform wallets, and collect simulated monthly/yearly interest payouts.
*   **Administrators:** Audit user accounts, review and approve/reject government identity KYC documents, manage global energy plans, oversee crowdfund project development status, and monitor system analytics.

The application utilizes a responsive layout stretched to full laptop screens, modern glassmorphic designs, secure JSON Web Token (JWT) authorization, cryptographic checkout signatures, and an integrated Dummy Bank testing sandbox.

---

## 3. Problem Statement
Traditional power utility grids are highly centralized, locking residential solar panel owners out of selling their clean energy surplus directly to neighbors who want to buy cheap, renewable electricity. In addition, crowdfunding solar microgrid installations is fragmented; interested retail investors lack a secure channel with legal agreement binding, transparent ROI lock-ins, and auto-release maturity payouts. Verification pipelines for government-approved ID checks, auto-pay configurations, and digital invoicing remain manual, fragmented, and prone to overhead.

---

## 4. Proposed Solution
SolarTrade resolves these limitations by hosting a secure, unified portal featuring:
*   **P2P Grid Marketplace:** Connects local clean energy producers directly with neighbors, filtering listings dynamically based on Household vs Commercial categories.
*   **Exempted Admin KYC Bypasses:** Enforces strict ID verification checks for consumers before buying energy, while exempting administrative accounts.
*   **Simulated PDF Contract Viewer:** Renders A4 agreements with watermarks, lock clauses, and signed signature pads.
*   **Dummy Bank Sandbox:** Checks formatting parameters and triggers failures (insufficient funds, CVV mismatch) on card checkouts.
*   **Functional PDF Downloads:** Dynamically opens pop-up billing invoices and launches print-to-PDF downloads.

---

## 5. Objectives
*   Promote localized clean energy generation and consumption.
*   Provide peer-to-peer microgrid energy trading.
*   Enforce secure ID verification (KYC) for transacting parties.
*   Enable transparent crowdfund investments with auto-release lock releases.
*   Automate digital invoice logs and PDF downloads.

---

## 6. Technologies Used
### Frontend:
*   **React.js (v18):** Single Page Application framework.
*   **Vite:** Asset compiler and dev server.
*   **Tailwind CSS & Custom Glassmorphism:** Styled design system.
*   **Chart.js & React-Chartjs-2:** Visual metrics and bar chart maps.
*   **Axios:** Promises-based REST API integration.
*   **Framer Motion:** Interactive transitions and micro-animations.

### Backend:
*   **Node.js & Express.js:** Async request handling router.
*   **JWT (JsonWebToken):** Cookies-based role authentication.
*   **Crypto:** SHA256 HMAC cryptographic signature generator.

### Database:
*   **MongoDB:** NoSQL database.
*   **Mongoose ODM:** Schema object modeling.

---

## 7. Frontend Folder Structure
```
frontend/
│
├── public/
│   └── favicon.ico
│
├── src/
│   ├── components/
│   │   ├── Loader.jsx          (Spinner & loading rings)
│   │   ├── Modal.jsx           (macOS mockup glass overlays)
│   │   └── Navbar.jsx          (Global navigation with notifications)
│   │
│   ├── context/
│   │   └── AuthContext.jsx     (JWT validation context hook)
│   │
│   ├── pages/
│   │   ├── Home.jsx            (Landing page)
│   │   ├── Login.jsx           (User login form)
│   │   ├── Register.jsx        (Role registration)
│   │   ├── Marketplace.jsx     (P2P listings and utility plant checkouts)
│   │   ├── CustomerDashboard.jsx (Consumer preferences, KYC banners, quick billing)
│   │   ├── CustomerWallet.jsx  (Simulated credits, transaction ledger logs)
│   │   ├── CustomerMetrics.jsx (Solar cleanliness ratios and stacked bar charts)
│   │   ├── Billing.jsx         (Smart-meter bills, auto-pay toggles, print invoices)
│   │   ├── InstallSolar.jsx    (Rooftop solar installation requests)
│   │   ├── InvestorDashboard.jsx (Simulate payouts, lock summaries, KYC uploads)
│   │   ├── ProjectsExplorer.jsx (Solar project explorer with full-page PDF viewer)
│   │   ├── AdminDashboard.jsx  (Analytics charts and system summaries)
│   │   ├── AdminUsers.jsx      (Manage profiles and approve/reject user KYC)
│   │   ├── AdminPlans.jsx      (Manage global plans)
│   │   ├── AdminProjects.jsx   (Manage crowdfund project list)
│   │   ├── EnergyPlans.jsx     (Explore company utility rate plans)
│   │   ├── Profile.jsx         (Account overview details)
│   │   ├── About.jsx           (Project metadata details)
│   │   └── FAQ.jsx             (Frequently Asked Questions)
│   │
│   ├── services/
│   │   └── api.js              (Axios client wrapper)
│   │
│   ├── App.jsx                 (Routes registration engine)
│   ├── index.css               (Lush radial mesh styling tokens)
│   └── main.jsx                (DOM mount index)
│
├── package.json
└── vite.config.js
```

---

## 8. Backend Folder Structure
```
backend/
│
├── config/
│   └── db.js                   (Mongoose MongoDB connectivity configuration)
│
├── controllers/
│   ├── authController.js       (Login/signup validations)
│   ├── billingController.js    (Bill generation, Dummy Bank checker, signatures)
│   ├── dashboardController.js  (Overview card data fetchers)
│   ├── installationController.js (Solar panel requests and setups)
│   ├── investmentController.js (Active project listings, auto-payout dispatchers)
│   ├── kycController.js        (Submit ID documents and audit statuses)
│   ├── marketplaceController.js (P2P listing logs and trades)
│   ├── notificationController.js (User-scoped alerts)
│   └── userController.js       (Wallet logs history and consumption analysis)
│
├── middleware/
│   ├── auth.js                 (Role-based token validation)
│   └── errorHandler.js         (Centralized express error capture)
│
├── models/
│   ├── User.js                 (Credentials and role strings)
│   ├── Profile.js              (Accrued points, balances, categories)
│   ├── EnergyTrade.js          (P2P transaction ledger)
│   ├── Bill.js                 (Smart meter billing invoices)
│   ├── Installation.js         (Rooftop setup track cards)
│   ├── Project.js              (Crowdfund target amounts and ROIs)
│   ├── Investment.js           (Locked capitals, payout calendars)
│   ├── InvestorAgreement.js    (Signed digital contract texts)
│   ├── KYC.js                  (Aadhaar/PAN and bank document info)
│   ├── AutoPaySettings.js      (Billing auto-pay thresholds)
│   ├── Plan.js                 (Grid standard packages)
│   └── Notification.js         (Category alert signals)
│
├── routes/
│   ├── authRoutes.js
│   ├── billingRoutes.js
│   ├── dashboardRoutes.js
│   ├── installationRoutes.js
│   ├── investmentRoutes.js
│   ├── kycRoutes.js
│   ├── marketplaceRoutes.js
│   └── userRoutes.js
│
├── seed/
│   └── seed.js                 (Database seeder configuration)
│
├── utils/
│   └── asyncHandler.js         (Async middleware wrapper)
│
├── .env
├── package.json
└── server.js
```

---

## 9. Database Collections
| Collection Name | Description & Key Fields |
| :--- | :--- |
| **users** | Credentials (email, password, role). Roles: Customer, Investor, Admin. |
| **profiles** | Balances, reward points, badges list, customerType (Household/Commercial). |
| **kycs** | Government details (PAN, Aadhaar), bank information, and audit status. |
| **projects** | Community solar details, target limits, funded allocations. |
| **investments** | Locked capitals, active ROIs, maturity timelines, payout scopes. |
| **investoragreements** | Legal agreement text, electronic signature, and signature timestamps. |
| **bills** | Smart-meter bills, units consumed, payment status (Paid, Unpaid). |
| **autopaysettings** | Auto-pay active status, payment channels, transaction thresholds. |
| **energytrades** | P2P grid trades history mapping buyer, seller, price, and units. |
| **installations** | Rooftop panel installation surveys and staging progress. |
| **notifications** | User-scoped notifications categorizing success, warning, or announcement. |

---

## 10. Major Modules
### A. Secure Authentication Module
Provides role-based login and signup. Restricts access to routes depending on the user's role (Customer, Investor, Admin).

### B. Consumer KYC & Preferences Onboarding
New customers customize their accounts to select Household or Commercial buying preferences. Blocks marketplace transactions with a warning banner unless a verified KYC document is logged.

### C. Localized P2P Marketplace
Renders active neighborhood solar listings. Automatically filters listings depending on target category preferences (Household listing vs Commercial listing). Exempts Admin users from KYC constraints.

### D. Crowdfund Investment Module
Allows investors to lock capital in solar projects. Features a full-page PDF-mode legal contract signing overlay, limit checking (₹10,000 to ₹500,000), auto-payout calculations, and direct card/wallet funding channels.

### E. Smart Billing & PDF Invoice Generator
Displays bills. Contains toggles for Auto-Pay and a pop-out printing script to download invoices as functional PDF files.

### F. Wallet & Dummy Bank Testing Sandbox
Directly deducts payments from wallet balances or triggers simulated validation cases (CVV declines, lost card declines, insufficient funds declines) via credit card checkouts.

---

## 11. System Workflow
```
                        [ User Registration / Login ]
                                     │
                                     ▼
                            [ Role Selector ]
                                     │
         ┌───────────────────────────┼───────────────────────────┐
         │                           │                           │
         ▼                           ▼                           ▼
    [ Customer ]                [ Investor ]                 [ Admin ]
         │                           │                           │
  Select Preference           Submit Identity KYC           Verify User KYC
  (Household/Commercial)             │                           │
         │                           ▼                      Manage Plans
         ▼                    Explore Projects                   │
    Verify KYC                       │                      Audit Systems
         │                           ▼                           │
         ▼                  Open PDF Agreement                   ▼
  P2P Marketplace                    │                    Dashboard Analytics
         │                           ▼
  Buy/Sell Energy            Select Payment Way
         │                   (Card or Wallet)
         ▼                           │
   Manage Invoices                   ▼
   (PDF Downloads)            Simulate Payouts
         │
         ▼
  Request Installation
```

---

## 12. Real-Life Use Cases
*   **Rooftop Energy Arbitrage:** Residential solar panel owners list surplus energy on the grid, and commercial entities or residential neighbors purchase it directly at custom rates.
*   **Community Solar Microgrids:** Retail investors pool capital to fund massive solar grids in cities, signing legal binding contracts digitally.
*   **Utility smart billing automation:** Customers automatically settle connection bills through auto-pay thresholds, saving PDF receipts.

---

## 13. Advantages
*   Promotes localized clean energy distribution.
*   Reduces load overheads on public utility power grids.
*   Accelerates retail microgrid capital funding.
*   Supports full-page contract clarity.
*   Secures transactions through cryptographic signatures and Dummy Bank validation.

---

## 14. Future Scope
*   IoT integration with live smart-meter relays.
*   AI-driven generation and consumption forecasting.
*   Blockchain integration for peer-to-peer energy trades.

---

## 15. Expected Outcome
A high-vibrancy, responsive, and functional microgrid software portal demonstrating how modern MERN architectures can connect customers, investors, and administrators to accelerate sustainable energy transitions.
