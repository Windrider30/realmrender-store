# RealmRender Store App — Session Notes
Last updated: 2026-06-24

## What We Built
A multi-brand Electron store app system with:
- **RealmRender** — `realmrender-store.html` / `build-realmrender.bat`
- **The Rabbit Hole** — `rabbit-hole-store.html` / `build-rabbithole.bat`
- **Red Velvet Revolver** — `rvr-store.html` / `build-rvr.bat`

Each brand builds its own `.exe` installer from its own config file.

---

## How It Works

### For each new client:
1. They copy the Google Sheet template
2. They go to **Extensions → Apps Script** in their sheet, paste `google-apps-script.js`, save, deploy as Web App (Execute as: Me, Anyone)
3. They send you their **Sheet ID** and **Apps Script URL**
4. You paste those into the right config file (`config-rr.json`, `config-trh.json`, or `config-rvr.json`)
5. Run the build bat → send them the exe
6. They install and go — their sheet loads automatically

### Config files (one per brand):
- `config-rr.json` → RealmRender
- `config-trh.json` → The Rabbit Hole
- `config-rvr.json` → Red Velvet Revolver

### How the Sheet ID gets to the Apps Script:
The app passes `&sheetId=...` as a URL parameter with every login call. The Apps Script reads it from the request and opens that spreadsheet directly — no binding or hardcoding needed.

---

## Key Files
| File | Purpose |
|---|---|
| `google-apps-script.js` | Master Apps Script — paste into every client's Google Sheet |
| `preload.js` | Exposes `electronAPI.checkAccess()` to renderer via IPC |
| `main.js` | RealmRender entry, reads config, handles IPC |
| `main-trh.js` | Rabbit Hole entry |
| `main-rvr.js` | RVR entry |
| `electron-builder-rr.json` | RealmRender build config |
| `electron-builder-trh.json` | Rabbit Hole build config |
| `electron-builder-rvr.json` | RVR build config |

---

## Bundle System
- Bundles live in the **Products** sheet as `category = bundles`
- The `generator_url` column stores comma-separated product IDs (e.g. `aurora-i,aurora-b`)
- Clicking a bundle card opens a picker showing each generator with a Launch button
- GHL grants the `bundle_id` on purchase — the Apps Script expands it to individual product IDs

---

## Features To Add Next Session
1. **Favorites** — heart/save generators for quick access
2. **Search** — real-time keyword filter on the product grid
3. **Access status view** — clearly separate owned (unlocked) vs available to purchase, instead of everything mixed in one grid

---

## Current Client: Vallee (RVR)
- Sheet ID: `19-J7g7DpcCguYFRszVLn5Mu7zn_If6xRU00Uno8Pcgw`
- Apps Script URL: in `config-rvr.json`
- Status: Working after updating to new `sheetId` parameter approach
- Her email for testing: `designs.vallee@gmail.com`
- Remember to add her email to the Access tab of her sheet

---

## Windrider30 (Rabbit Hole)
- Sheet ID: `1WamZqIaT_XPSd5MVoO0zPdebEKG3ox4EIg93O8i3AX4`
- Apps Script URL: in `config-trh.json`
- Status: Needs rebuilt exe with new script + sheetId approach
