const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, LevelFormat } = require("docx");

const ACCENT = "6A00FF";
const CYAN = "00F0FF";
const DARK = "0D0D0D";
const LIGHT_BG = "1A1A2E";
const WHITE = "FFFFFF";
const ASH = "B0B0B0";
const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9qr6KaEqx6q9Bab5aR5918YqROYgGXHiU3EF6rlJVQ-geVS-a7nDbdWrjFeCeAxrA/exec";

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 400, after: 200 },
    children: [new TextRun({ text, bold: true, size: 36, font: "Arial", color: ACCENT })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 300, after: 150 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: CYAN })] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: opts.color || WHITE, bold: opts.bold, italics: opts.italics })] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: WHITE })] });
}
function numbered(text, ref) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: WHITE })] });
}
function code(text) {
  return new Paragraph({ spacing: { after: 100 },
    indent: { left: 360 },
    children: [new TextRun({ text, size: 18, font: "Consolas", color: CYAN })] });
}
function spacer() {
  return new Paragraph({ spacing: { after: 200 }, children: [] });
}
function divider() {
  return new Paragraph({ spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: ACCENT, space: 1 } },
    children: [] });
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "333355" };
const borders = { top: border, bottom: border, left: border, right: border };

function tableCell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || 3120, type: WidthType.DXA },
    shading: { fill: opts.header ? "2A1A4E" : LIGHT_BG, type: ShadingType.CLEAR },
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial", color: opts.header ? CYAN : WHITE, bold: opts.header })] })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: WHITE } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 36, bold: true, font: "Arial", color: ACCENT },
        paragraph: { spacing: { before: 400, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial", color: CYAN },
        paragraph: { spacing: { before: 300, after: 150 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "steps1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "steps2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "steps3", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "steps4", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
        background: { color: DARK }
      }
    },
    headers: {
      default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT,
        children: [new TextRun({ text: "RealmRender — GHL Webhook Setup Guide", size: 16, font: "Arial", color: ASH, italics: true })] })] })
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", size: 16, font: "Arial", color: ASH }), new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: ASH })] })] })
    },
    children: [
      // TITLE PAGE
      spacer(), spacer(), spacer(),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 100 },
        children: [new TextRun({ text: "REALMRENDER", bold: true, size: 56, font: "Arial", color: ACCENT })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 },
        children: [new TextRun({ text: "GHL Webhook Setup Guide", size: 32, font: "Arial", color: CYAN })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "Automate purchases → instant access", size: 22, font: "Arial", color: ASH })] }),
      divider(),

      // SECTION 1
      h1("1. Overview"),
      p("When a customer purchases a product through GoHighLevel, a webhook automatically grants them access by adding their email to your Google Sheet."),
      p("You need ONE webhook per product (or bundle). So yes — every generator, art pack, music pack, and bundle needs its own webhook URL with the matching product ID.", { bold: true }),
      divider(),

      // SECTION 2
      h1("2. What You Need Before Starting"),
      bullet("Your Google Apps Script Web App URL (already deployed):"),
      code(SCRIPT_URL),
      bullet("Your product IDs from column A of your Google Sheet “Products” tab"),
      bullet("GHL admin access to create workflows"),
      divider(),

      // SECTION 3
      h1("3. The Webhook URL Format"),
      h2("For a Single Product:"),
      code(SCRIPT_URL + "?action=grant&email={{contact.email}}&productId=YOUR-PRODUCT-ID"),
      p("Replace YOUR-PRODUCT-ID with the exact value from column A of your Products sheet. It must match exactly (case-sensitive).", { italics: true, color: ASH }),
      spacer(),
      h2("For All-Access (Bundles That Unlock Everything):"),
      code(SCRIPT_URL + "?action=grantAll&email={{contact.email}}"),
      divider(),

      // SECTION 4
      h1("4. Step-by-Step — Creating a Webhook Workflow in GHL"),

      h2("Step 1: Go to Automation"),
      bullet("In your GHL dashboard, click “Automation” in the left sidebar"),
      bullet("Click “Workflows”"),
      bullet("Click “+ Create Workflow”"),
      bullet("Choose “Start from Scratch”"),
      spacer(),

      h2("Step 2: Set the Trigger"),
      bullet("Click “Add New Trigger”"),
      bullet("Select “Payment Received” (or “Invoice Paid” or “Order Form Submission” depending on your setup)"),
      bullet("Under Filters, select the specific product/offer this workflow is for"),
      bullet("Click “Save Trigger”"),
      spacer(),

      h2("Step 3: Add the Webhook Action"),
      bullet("Click the “+” below your trigger to add an action"),
      bullet("Search for “Webhook” or find it under “External Communications”"),
      bullet("Select “Send Webhook”"),
      bullet("Set Method to: GET"),
      bullet("Paste your webhook URL (see Section 3) with the correct productId"),
      p("Example for “Still Standing” generator:", { italics: true, color: ASH }),
      code(SCRIPT_URL + "?action=grant&email={{contact.email}}&productId=still-standing"),
      bullet("Click “Save Action”"),
      spacer(),

      h2("Step 4: Add Confirmation Email (Optional but Recommended)"),
      bullet("Click “+” to add another action after the webhook"),
      bullet("Select “Send Email”"),
      bullet("Set To: {{contact.email}}"),
      bullet("Subject: Your RealmRender Purchase is Ready!"),
      p("Suggested email body:", { bold: true }),
      spacer(),
      p("Hey {{contact.first_name}},", { color: ASH }),
      spacer(),
      p("Thanks for your purchase! Your generator is ready to use.", { color: ASH }),
      spacer(),
      p("How to access it:", { color: ASH }),
      p("1. Open the RealmRender app", { color: ASH }),
      p("2. Sign in with this email address: {{contact.email}}", { color: ASH }),
      p("3. Your purchased generator(s) will be unlocked automatically", { color: ASH }),
      spacer(),
      p("If you have any questions, just reply to this email.", { color: ASH }),
      p("— The RealmRender Team", { color: ASH }),
      spacer(),

      h2("Step 5: Activate the Workflow"),
      bullet("Toggle the workflow to “Published” (top right)"),
      bullet("Name it clearly, e.g., “RealmRender — Still Standing Purchase”"),
      divider(),

      // SECTION 5
      h1("5. Do I Need One Workflow Per Product?"),
      p("YES — you need one workflow for each product you sell. Here’s why:", { bold: true }),
      bullet("Each product has a unique product ID"),
      bullet("The webhook URL contains that specific product ID"),
      bullet("GHL triggers are filtered by which product was purchased"),
      spacer(),
      p("However, you can save time:", { bold: true }),
      bullet("Create your first workflow fully"),
      bullet("Click the three dots on the workflow → “Clone”"),
      bullet("Change only the trigger (different product) and the productId in the webhook URL"),
      bullet("Rename and publish"),
      divider(),

      // SECTION 6
      h1("6. Quick Reference — Webhook URLs"),
      p("Use this table to map all your products:"),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2400, 2160, 4800],
        rows: [
          new TableRow({ children: [
            tableCell("Product Name", { header: true, width: 2400 }),
            tableCell("Product ID", { header: true, width: 2160 }),
            tableCell("Webhook URL", { header: true, width: 4800 }),
          ]}),
          new TableRow({ children: [
            tableCell("Still Standing", { width: 2400 }),
            tableCell("still-standing", { width: 2160 }),
            tableCell("...exec?action=grant&email={{contact.email}}&productId=still-standing", { width: 4800 }),
          ]}),
          new TableRow({ children: [
            tableCell("(Your Product)", { width: 2400 }),
            tableCell("(its-id)", { width: 2160 }),
            tableCell("...exec?action=grant&email={{contact.email}}&productId=(its-id)", { width: 4800 }),
          ]}),
          new TableRow({ children: [
            tableCell("ALL ACCESS BUNDLE", { width: 2400 }),
            tableCell("(use grantAll)", { width: 2160 }),
            tableCell("...exec?action=grantAll&email={{contact.email}}", { width: 4800 }),
          ]}),
        ]
      }),
      divider(),

      // SECTION 7
      h1("7. Bundles — Granting Multiple Products at Once"),
      h2("Option A — All Access"),
      p("Use the grantAll action. This gives the buyer access to every product in your store, current and future."),
      code(SCRIPT_URL + "?action=grantAll&email={{contact.email}}"),
      spacer(),
      h2("Option B — Specific Bundle"),
      p("If you want a bundle that only unlocks certain products (not everything), add multiple webhook actions in the same workflow — one for each product in the bundle."),
      p("For example, a “Dark Fantasy Bundle” containing 3 generators would have 3 webhook actions:"),
      bullet("...exec?action=grant&email={{contact.email}}&productId=still-standing"),
      bullet("...exec?action=grant&email={{contact.email}}&productId=hyper-baddie"),
      bullet("...exec?action=grant&email={{contact.email}}&productId=dark-ambient-vol1"),
      divider(),

      // SECTION 8
      h1("8. Testing Your Webhook"),
      numbered("In GHL, open your workflow", "steps3"),
      numbered("Click “Test Workflow” (or manually trigger with a test contact)", "steps3"),
      numbered("Check your Google Sheet “Access” tab — you should see a new row with the test email", "steps3"),
      numbered("Open the RealmRender app, sign in with that email", "steps3"),
      numbered("The purchased product should be unlocked", "steps3"),
      divider(),

      // SECTION 9
      h1("9. Troubleshooting"),
      h2("Webhook fires but no row appears in the sheet"),
      bullet("Make sure you deployed a NEW version of the Apps Script (not just saved it)"),
      bullet("Check the Apps Script URL is correct in the webhook"),
      bullet("Make sure the sheet has an “Access” tab (run RealmRender → Grant Access manually once to create it)"),
      spacer(),
      h2("Row appears but product doesn’t unlock in the app"),
      bullet("Check the product_id in the Access tab matches column A in the Products tab exactly"),
      bullet("Make sure the status column says “active”"),
      bullet("Click Refresh in the app"),
      spacer(),
      h2("Email variable not working"),
      bullet("Make sure you’re using {{contact.email}} not a hardcoded email"),
      bullet("Check the contact has an email address in GHL"),
      divider(),

      // SECTION 10
      h1("10. Summary"),
      bullet("One workflow per product (clone to save time)"),
      bullet("Each workflow: Trigger (payment) → Webhook (grant access) → Email (confirm)"),
      bullet("Bundles: use grantAll for everything, or multiple grant webhooks for specific bundles"),
      bullet("Test with your own email first"),
      bullet("Check the Access tab in your Google Sheet to verify it’s working"),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:\\Htmlappidea\\RealmRender-GHL-Webhook-Setup-Guide.docx", buffer);
  console.log("Document created successfully!");
});
