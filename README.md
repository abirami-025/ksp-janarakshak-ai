# 🛡️ KSP Janarakshak AI
> **Karnataka State Police — Intelligent Conversational AI & Crime Analytics Platform**
> Fully structured, optimized, and ready for deployment on **Zoho Catalyst**.

---

## 📖 Executive Summary
**KSP Janarakshak AI** is a state-of-the-art, dark-themed Tactical Command Center designed for police investigators, SCRB analysts, and law enforcement policymakers. It replaces manual Excel reporting and disjointed databases with a single interactive intelligence platform. 

The application enables natural language querying (in both English and Kannada), geo-spatial crime hotspot analysis, force-directed network modeling of repeat offender syndicates, and predictive threat analytics.

---

## 🛠️ Zoho Catalyst Service Architecture
To ensure maximum points for platform integration, Janarakshak AI has been structured to run natively on the Zoho Catalyst stack:

1. **Catalyst Web Client Hosting (Slate)**: Hosts the high-performance glassmorphic frontend built in raw responsive HTML5, CSS3, and vanilla JS, eliminating bundler overhead and securing rapid load times.
2. **Catalyst Zia Services (NLP & Translation)**: Powers the bilingual query engine. Translates Kannada inputs into structured english queries, performs entity extraction (Suspect name, District, Crime Class), and supports Web Speech Speech-To-Text interface.
3. **Catalyst QuickML**: Serves predictive risk models, generating future 30-day district threat level indexes based on clustering algorithms.
4. **Catalyst Data Store & NoSQL**: Models relational links between FIR records, suspects, victim contacts, and ledger money flows.
5. **Catalyst SmartBrowz**: Powers the instant PDF dossier export tool, generating court-admissible physical case reports from web HTML templates in a single click.

---

## 🌟 Key Features

### 1. 🗺️ Spatial Drishti Map
- Interactive map plotting 200+ detailed FIR records across major Karnataka divisions.
- Toggle between **Heatmap overlay** (representing crime density) and **MarkerCluster group** (simplifying regional navigation).
- Advanced sidebar filters allowing instant drill-downs by District, Crime Category, Severity (Low/Medium/High/Critical), and Year.

### 2. 💬 AI Bilingual Investigator
- Multi-lingual Natural Language Interface (supports English and Kannada queries).
- Voice typing support (Web Speech API integration) with speech auto-detect capabilities.
- Live context sidebar letting investigators click on any indexed case to load its full dossier sheet.
- Integrated suggestion chips for rapid training-free operation.

### 3. 🕸️ Sambandha Connection Graph
- Interactive, draggable physics node graph rendered on a high-refresh rate HTML5 Canvas.
- Mapped relationships linking: Accused/Suspects (Red), FIRs (Blue), Victims (Yellow), Financial Nodes (Purple).
- Force-directed simulation handles collision detection, friction, center-gravity attraction, and spring tension along connected edges.
- Click to view deep suspect files and hover to audit associated financial trails.

### 4. 📊 Strategic Predictor Dashboard
- 7 animated datasets rendered via Chart.js:
  - Crime Type Doughnut breakdown.
  - Monthly filing trends.
  - District ranking counts.
  - Polar Area severity breakdown.
  - Hourly incident analysis.
  - Demographics distribution.
  - Radar-based QuickML predictive danger zones.

---

## 📁 Repository Structure
```
ksp-janarakshak-ai/
├── catalyst-config.json       # Zoho Catalyst Project Configuration
├── server.js                  # Local Development Static Web Server
├── generate-data.js           # Synthetic Crime Data Generator
├── client/                    # Primary Deployable Client Folder (Web Client Hosting)
│   ├── index.html             # UI Structure & DOM Elements
│   ├── style.css              # Glassmorphic Styling Sheet
│   ├── app.js                 # Event Listeners, Leaflet Map, Canvas Physics Graph, Chat Engine
│   └── crime-data.json        # Main Database (200 FIRs, Victims, Suspects, Ledgers)
```

---

## 🚀 Setup & Execution Instructions

### 1. Run Locally
Prerequisites: **Node.js** (v14 or higher recommended)

1. Clone or copy this project folder.
2. Open your terminal in the `ksp-janarakshak-ai` directory.
3. Start the static local web server:
   ```bash
   node server.js
   ```
4. Open your browser and navigate to:
   **`http://localhost:8080`**

*(Optional)* To regenerate the synthetic database with fresh randomized coordinates and link weights:
```bash
node generate-data.js
```

### 2. Deploying to Zoho Catalyst
Prerequisites: **Catalyst CLI** installed (`npm install -g zcatalyst-cli`)

1. Login to your Zoho Catalyst account from the terminal:
   ```bash
   catalyst login
   ```
2. Associate the project with your developer console environment:
   ```bash
   catalyst project:use
   ```
   Select your project from the list.
3. Deploy the client web application:
   ```bash
   catalyst deploy --only client
   ```
4. Once deployment succeeds, the CLI will output the live hosting link.
