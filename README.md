# Packing List — Web App

A responsive React + Vite web version of the Packing List inventory management app, deployed on Vercel and connected to the Google Cloud Run backend.

## Features

- **Role-Based Access Control**: Login with username/password, role-based authorization (`admin`, `manager`, `operator`), location and status restrictions, and global history permissions.
- **Inventory by Location**: Location tabs with live item counters, search across all locations, and advanced multi-parameter search (item name, barcode, location, category, sub-location, status, date range).
- **Item Management**: Add, edit, and delete inventory items. Stepper controls for quantity, status badge picker (`Ready to pack`, `Packed`, `Used`, `Cleaned`), and "Mark as Seen" with timestamp.
- **Barcode & Camera Scanning**: In-browser camera barcode and QR code scanner via `html5-qrcode` (works on mobile, tablet, and desktop webcams) plus manual barcode input.
- **Photo Uploads**: Capture photos directly via camera or upload images from device, stored on the backend.
- **Relocation & Transfers**:
  - Single item move to other locations with optional sub-location.
  - Quick CLS scan move (scan barcode to move item to active location and mark seen).
  - Multi-select bulk update (location & sub-location).
  - Batch transfers: send batches of items between locations with in-transit tracking.
  - Batch & barcode receive with automatic recognition and pre-filling.
- **Administration & Audit**:
  - Global and per-item timeline / audit history with event details, timestamps, username, IP, location, and user-agent.
  - Location management (add, inline rename, delete).
  - User management (create/delete accounts, configure allowed locations/statuses/history access).
  - Batch management (edit in-transit and completed batches, modify items, delete batches).
  - JSON data migration import.

## Tech Stack

- **Framework**: React 19 + TypeScript + Vite
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React
- **Barcode Scanner**: html5-qrcode
- **Deployment**: Vercel (configured with API/uploads reverse proxy in `vercel.json`)
- **Backend**: Google Cloud Run Express backend (`https://packing-list-1081640935031.us-west1.run.app`)

## Development

```bash
# Install dependencies
npm install

# Start local dev server (proxies /api and /uploads to Cloud Run)
npm run dev

# Build for production
npm run build
```

## Deployment on Vercel

The project contains a pre-configured `vercel.json` with reverse-proxy rewrites for `/api/(.*)` and `/uploads/(.*)` to the Cloud Run backend, eliminating CORS restrictions across all web browsers.
