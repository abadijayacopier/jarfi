# GitHub Release: JARFI MGT Core v4.1 (NOC Edition)

## 🏷️ Release Details
- **Tag version:** `v4.1.0-NOC`
- **Release title:** `JARFI MGT Core - Industrial v4.1 (NOC Edition)`
- **Target branch:** `master` (as seen in your screenshot)

---

## 📝 Release Notes (Copy & Paste this)

### 🚀 Industrial v4.1 - "The NOC Excellence"
This release marks a significant milestone in modernization for JARFI MGT Core, focusing on high-density ISP operations and professional-grade branding.

#### 🖨️ Voucher Printing Engine v4.1
- **Scan-to-Login QR Codes:** Automated QR Code generation for every voucher using the dynamic Hotspot Domain setting.
- **Clean UI Print Logic:** Overhauled printing CSS for A4 and Thermal paper. Removed UI clutter for a high-contrast, professional grid layout.
- **MicroTik Handshake Ready:** Integrated login query parameters for seamless authentication flow.

#### 🎨 Professional Branding & UI
- **Dynamic Identity:** Sidebar, browser tab title, and favicon now sync automatically with the ISP name and logo configured in Settings.
- **High-Density NOC Theme:** Refined "Slate-950" dark mode aesthetics with improved typography and accentuation.
- **Logo Upload Engine:** Implemented a Base64-driven file upload system for company branding.

#### ⚙️ Technical Enhancements
- **Storage Optimization:** Upgraded `Settings` database schema to `LONGTEXT` to support high-resolution branding assets.
- **Code Integrity:** Resolved React console warnings (key props) and hydration errors in the Voucher and Profile modules.
- **Localization:** Full Indonesian translation using professional ISP/Network jargon.

#### 🛠️ Internal Matriks Core
- **Hotspot Domain Config:** Dedicated field for Hotspot DNS Name to ensure link accuracy.
- **Auto-Sync:** Real-time page synchronization after parameter updates.

---

### 📦 Installation
1. Pull the latest `master` branch.
2. Run `npm install` and `npm run build`.
3. Database schema will auto-update upon visiting the Settings page.

**By: Supriyanto Developer Magetan**
*Engineered for High-Density ISP Environments.*
