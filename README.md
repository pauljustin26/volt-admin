# Volt Admin Dashboard

[![Live Demo](https://img.shields.io/badge/Live_Demo-Vercel-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://volt-admin.vercel.app/login)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

**Volt Admin** is the centralized web-based management console for the Volt ecosystem. Built with **React (Vite)** and **Tailwind CSS**, it allows administrators to monitor user activity, manage rental units ("Volts"), track financial transactions, and view system logs in real-time.

## 🔗 Live Demo
Access the admin dashboard here: **[https://volt-admin.vercel.app/login](https://volt-admin.vercel.app/login)**
*(Note: Replace with your actual deployed URL)*

## ⚡ Features
- **Dashboard Analytics:** Visual overview of system health and metrics using Recharts.
- **User Management:** View, manage, and monitor registered users.
- **Unit Management (Volts):** Track status and inventory of power bank units.
- **Financial Oversight:** Detailed views for **Transactions** and **Payments**.
- **System Logs:** Comprehensive audit trails for system activities.
- **Data Export:** Generate reports in PDF or Excel formats (using `jspdf` & `xlsx`).
- **Secure Authentication:** Protected routes with Firebase Auth and automatic inactivity logout.

## 🛠 Tech Stack
- **Framework:** [React](https://react.dev/) (Vite)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Routing:** [React Router DOM](https://reactrouter.com/)
- **State/Auth:** React Context API & Firebase
- **Visualization:** [Recharts](https://recharts.org/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Utilities:** Axios, XLSX, jsPDF

## 📂 Project Directory

```text
volt-admin/
├── public/                     # Static assets
├── src/
│   ├── assets/                 # Images and icons
│   ├── components/             # Reusable UI components (Sidebar, AutoLogout)
│   ├── context/                # Global state (AuthContext)
│   ├── pages/                  # Application views
│   │   ├── Dashboard.jsx       # Main analytics view
│   │   ├── Login.jsx           # Admin authentication
│   │   ├── Users.jsx           # User management
│   │   ├── Volts.jsx           # Unit management
│   │   ├── Transactions.jsx    # Transaction history
│   │   ├── Payments.jsx        # Payment records
│   │   ├── Logs.jsx            # System logs
│   │   └── Settings.jsx        # Admin settings
│   ├── routes/                 # Route guards (ProtectedRoute)
│   ├── services/               # API and Firebase services
│   └── utils/                  # Helper functions (Export helpers)
├── eslint.config.js            # Linting configuration
├── package.json                # Dependencies and scripts
├── vercel.json                 # Vercel deployment config
└── vite.config.js              # Vite configuration
🚀 Getting Started
Prerequisites
Node.js (Latest LTS recommended)

npm or yarn

Installation
Clone the repository:

Bash
git clone <repository-url>
cd volt-admin
Install dependencies:

Bash
npm install
Running the App
Start the development server:

Bash
npm run dev
Open your browser to http://localhost:5173 (or the port shown in your terminal).

☁️ Deployment
This project is configured for seamless deployment on Vercel.

The vercel.json file handles the build configuration.

Push changes to your main branch to trigger a redeploy (if connected to Git).

🧪 Scripts
npm run dev: Starts the Vite development server.

npm run build: Builds the app for production.

npm run preview: Locally preview the production build.

npm run lint: Runs ESLint to check code quality.