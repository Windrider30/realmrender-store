# RealmRender — Setup Guide

## Architecture Overview

```
USER buys generator on GHL
  → GHL sends access code (via workflow/email)
    → User enters code on RealmRender store page
      → Code validated against Google Sheet
        → Generator loads in iframe overlay
          → Generator hosted on separate domain (code hidden)
```

## 3 Files You Have

| File | Purpose |
|------|---------|
| `realmrender-store.html` | The storefront — embed this on GHL |
| `realmrender-google-apps-script.js` | Paste into Google Sheets Apps Script |
| Your generator HTML files (e.g. `still-standing.html`) | Hosted on GitHub Pages / Netlify |

---

## STEP 1: Create the Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) → create new spreadsheet
2. Name it **"RealmRender Store"**
3. Go to **Extensions → Apps Script**
4. Delete any existing code
5. Paste the entire contents of `realmrender-google-apps-script.js`
6. Click **Save** (disk icon)
7. Go back to your sheet — you'll see a **RealmRender** menu appear
8. Click **RealmRender → Setup Sheets** — this creates both tabs automatically

## STEP 2: Set Up the Products Tab

Your **Products** sheet has these columns:

| Column | Field | Example |
|--------|-------|---------|
| A | `id` | `still-standing` |
| B | `title` | `Still Standing` |
| C | `description` | `Fallen Angel Resilience Portrait Generator` |
| D | `category` | `generators` (options: generators, art-packs, music, bundles) |
| E | `price` | `$27.00` (or `Free`) |
| F | `image` | `https://your-image-url.com/image.jpg` |
| G | `generator_url` | `https://yourusername.github.io/generators/still-standing.html` |
| H | `tags` | `featured,premium` (comma-separated: featured, premium, new, free) |
| I | `featured` | `TRUE` or `FALSE` |
| J | `access_type` | `paid` or `free` |

## STEP 3: Publish the Sheet

1. In your Google Sheet go to **File → Share → Publish to web**
2. Select **Entire Document** → **Web page**
3. Click **Publish**
4. Copy the Sheet ID from the URL — it's the long string between `/d/` and `/edit`
   - Example URL: `https://docs.google.com/spreadsheets/d/1aBcDeFgHiJkLmNoPqRsTuVwXyZ/edit`
   - Sheet ID: `1aBcDeFgHiJkLmNoPqRsTuVwXyZ`
5. Paste this ID into `realmrender-store.html` where it says `YOUR_GOOGLE_SHEET_ID_HERE`

## STEP 4: Deploy the Apps Script as Web App

1. In the Apps Script editor, click **Deploy → New deployment**
2. Click the gear icon → select **Web app**
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**
5. Copy the Web App URL
6. In `realmrender-store.html`, add this line right after the `SHEET_ID` config:

```javascript
var APPS_SCRIPT_URL = 'https://script.google.com/macros/s/YOUR_DEPLOYMENT_ID/exec';
```

## STEP 5: Generate Access Codes

Two ways:

**From the Sheet menu:**
1. Click **RealmRender → Generate 10 Codes**
2. Enter the product ID (e.g., `still-standing`)
3. Codes appear in the AccessCodes tab

**From the URL (for GHL automation):**
```
https://script.google.com/macros/s/YOUR_ID/exec?action=generateCodes&productId=still-standing&count=1
```
This returns a JSON with the generated code — perfect for GHL webhook workflows.

## STEP 6: Host Your Generators

**Option A: GitHub Pages (Free, Recommended)**

1. Create a GitHub account if you don't have one
2. Create a new repository called `realmrender-generators`
3. Upload your HTML generator files (e.g., `still-standing.html`)
4. Go to Settings → Pages → Source: main branch
5. Your generators will be at: `https://yourusername.github.io/realmrender-generators/still-standing.html`

**Option B: Netlify (Free)**

1. Go to [netlify.com](https://netlify.com)
2. Drag and drop your generators folder
3. Get your URL

## STEP 7: Embed on GHL

In GHL, create a page/funnel and add a **Custom HTML** block.
Paste the entire `realmrender-store.html` content into it.

Or better — host the store HTML on the same domain as your generators and iframe IT into GHL.

## STEP 8: GHL Purchase → Auto-Code Workflow

When someone buys a generator on GHL:

1. **GHL Workflow triggers** on purchase
2. **Webhook action** calls your Apps Script to generate a code:
   ```
   GET https://script.google.com/macros/s/YOUR_ID/exec?action=generateCodes&productId=still-standing&count=1
   ```
3. **The response** contains the access code
4. **Email action** sends the code to the buyer
5. Buyer enters code on the store → generator unlocks

---

## AccessCodes Sheet Structure

| Column | Field | Notes |
|--------|-------|-------|
| A | `code` | Auto-generated (e.g., `RR4K-X7M2`) |
| B | `product_id` | Matches product `id` column, or `all` for universal access |
| C | `used` | `TRUE` / `FALSE` |
| D | `used_date` | Auto-filled when redeemed |
| E | `used_by` | Optional identifier |

---

## Code Protection Layers

1. **Cross-origin iframe** — F12 can't inspect iframe content from another domain
2. **Referrer check** — add this to the top of each generator HTML file:

```html
<script>
(function(){
  var allowed = ['yourdomain.com', 'your-ghl-domain.com', 'localhost'];
  var ref = document.referrer || '';
  var ok = false;
  for (var i = 0; i < allowed.length; i++) {
    if (ref.indexOf(allowed[i]) !== -1) { ok = true; break; }
  }
  if (!ok && window.self !== window.top) {
    document.body.innerHTML = '<div style="color:#666;text-align:center;padding:100px;font-family:sans-serif;">Access denied.</div>';
  }
})();
</script>
```

3. **Obfuscate your generators** — use [obfuscator.io](https://obfuscator.io) to scramble the JavaScript before hosting
4. **Disable right-click** (optional deterrent):

```html
<script>
document.addEventListener('contextmenu', function(e) { e.preventDefault(); });
document.addEventListener('keydown', function(e) {
  if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) e.preventDefault();
});
</script>
```
