const fs = require("fs");
const { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
        Header, Footer, AlignmentType, HeadingLevel, BorderStyle, WidthType,
        ShadingType, PageNumber, LevelFormat } = require("docx");

function h1(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_1, spacing: { before: 360, after: 200 },
    children: [new TextRun({ text, bold: true, size: 28, font: "Arial", color: "000000" })] });
}
function h2(text) {
  return new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 140 },
    children: [new TextRun({ text, bold: true, size: 24, font: "Arial", color: "000000" })] });
}
function p(text, opts = {}) {
  return new Paragraph({ spacing: { after: 120 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: "000000", bold: opts.bold, italics: opts.italics })] });
}
function bullet(text) {
  return new Paragraph({ numbering: { reference: "bullets", level: 0 }, spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: "000000" })] });
}
function numbered(text, ref) {
  return new Paragraph({ numbering: { reference: ref, level: 0 }, spacing: { after: 80 },
    children: [new TextRun({ text, size: 22, font: "Arial", color: "000000" })] });
}
function code(text) {
  return new Paragraph({ spacing: { after: 100 }, indent: { left: 360 },
    children: [new TextRun({ text, size: 18, font: "Consolas", color: "333333" })] });
}
function spacer() {
  return new Paragraph({ spacing: { after: 160 }, children: [] });
}

const border = { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" };
const borders = { top: border, bottom: border, left: border, right: border };

function cell(text, opts = {}) {
  return new TableCell({
    borders,
    width: { size: opts.width || 3120, type: WidthType.DXA },
    shading: opts.header ? { fill: "E8E8E8", type: ShadingType.CLEAR } : undefined,
    margins: { top: 60, bottom: 60, left: 100, right: 100 },
    children: [new Paragraph({ children: [new TextRun({ text, size: 20, font: "Arial", color: "000000", bold: opts.header })] })]
  });
}

const doc = new Document({
  styles: {
    default: { document: { run: { font: "Arial", size: 22, color: "000000" } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 28, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 360, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 24, bold: true, font: "Arial" },
        paragraph: { spacing: { before: 280, after: 140 }, outlineLevel: 1 } },
    ]
  },
  numbering: {
    config: [
      { reference: "bullets", levels: [{ level: 0, format: LevelFormat.BULLET, text: "•", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "s1", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
      { reference: "s2", levels: [{ level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
        style: { paragraph: { indent: { left: 720, hanging: 360 } } } }] },
    ]
  },
  sections: [{
    properties: {
      page: {
        size: { width: 12240, height: 15840 },
        margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
      }
    },
    footers: {
      default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: "Page ", size: 16, font: "Arial", color: "888888" }), new TextRun({ children: [PageNumber.CURRENT], size: 16, font: "Arial", color: "888888" })] })] })
    },
    children: [
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 },
        children: [new TextRun({ text: "GHL Webhook Setup Guide", bold: true, size: 36, font: "Arial" })] }),
      new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 400 },
        children: [new TextRun({ text: "How to automate purchase access with GoHighLevel", size: 22, font: "Arial", color: "666666", italics: true })] }),

      // SECTION 1
      h1("1. Overview"),
      p("When a customer purchases a product through GoHighLevel (GHL), a webhook automatically grants them access by adding their email to your Google Sheet. They then sign into the app with that email and their purchased products are unlocked."),
      p("You need one webhook per product or bundle.", { bold: true }),
      spacer(),

      // SECTION 2
      h1("2. What You Need"),
      bullet("Your Google Apps Script Web App URL (provided to you during setup)"),
      bullet("Your product IDs from column A of your Google Sheet Products tab"),
      bullet("GHL admin access to create workflows"),
      spacer(),

      // SECTION 3
      h1("3. Webhook URL Format"),
      h2("For a Single Product"),
      p("Replace YOUR-SCRIPT-URL with your Apps Script URL and YOUR-PRODUCT-ID with the product ID from column A of your Products sheet."),
      code("YOUR-SCRIPT-URL?action=grant&email={{contact.email}}&productId=YOUR-PRODUCT-ID"),
      spacer(),
      h2("For All-Access (Unlocks Everything)"),
      code("YOUR-SCRIPT-URL?action=grantAll&email={{contact.email}}"),
      p("The product ID must match column A exactly (case-sensitive).", { italics: true }),
      spacer(),

      // SECTION 4
      h1("4. Creating a Webhook Workflow in GHL"),

      h2("Step 1: Create the Workflow"),
      bullet("In GHL, go to Automation > Workflows"),
      bullet("Click + Create Workflow"),
      bullet("Choose Start from Scratch"),
      spacer(),

      h2("Step 2: Set the Trigger"),
      bullet("Click Add New Trigger"),
      bullet("Select Payment Received (or Invoice Paid / Order Form Submission depending on your setup)"),
      bullet("Under Filters, select the specific product this workflow is for"),
      bullet("Click Save Trigger"),
      spacer(),

      h2("Step 3: Add the Webhook"),
      bullet("Click the + below your trigger to add an action"),
      bullet("Search for Webhook or find it under External Communications"),
      bullet("Select Send Webhook"),
      bullet("Set Method to: GET"),
      bullet("Paste your webhook URL with the correct product ID (see Section 3)"),
      bullet("Click Save Action"),
      spacer(),

      h2("Step 4: Add a Confirmation Email (Recommended)"),
      bullet("Click + to add another action after the webhook"),
      bullet("Select Send Email"),
      bullet("Set To: {{contact.email}}"),
      bullet("Subject: Your Purchase is Ready!"),
      p("Suggested email body:", { bold: true }),
      spacer(),
      p("Hey {{contact.first_name}},"),
      p("Thanks for your purchase! Your product is ready to use."),
      spacer(),
      p("How to access it:"),
      p("1. Open the app"),
      p("2. Sign in with this email address: {{contact.email}}"),
      p("3. Your purchased product(s) will be unlocked automatically"),
      spacer(),
      p("If you have any questions, just reply to this email."),
      spacer(),

      h2("Step 5: Activate"),
      bullet("Toggle the workflow to Published (top right)"),
      bullet("Name it clearly, e.g., Product Name — Purchase Workflow"),
      spacer(),

      // SECTION 5
      h1("5. One Workflow Per Product"),
      p("Yes, you need one workflow for each product. But you can save time:", { bold: true }),
      numbered("Create your first workflow fully", "s1"),
      numbered("Click the three dots on the workflow and select Clone", "s1"),
      numbered("Change only the trigger (different product) and the product ID in the webhook URL", "s1"),
      numbered("Rename and publish", "s1"),
      spacer(),

      // SECTION 6
      h1("6. Quick Reference Table"),
      p("Fill in this table with your products for easy reference:"),
      spacer(),
      new Table({
        width: { size: 9360, type: WidthType.DXA },
        columnWidths: [2800, 2200, 4360],
        rows: [
          new TableRow({ children: [
            cell("Product Name", { header: true, width: 2800 }),
            cell("Product ID", { header: true, width: 2200 }),
            cell("Webhook URL", { header: true, width: 4360 }),
          ]}),
          new TableRow({ children: [
            cell("(Your product)", { width: 2800 }),
            cell("(column A value)", { width: 2200 }),
            cell("...?action=grant&email={{contact.email}}&productId=(id)", { width: 4360 }),
          ]}),
          new TableRow({ children: [
            cell("(Another product)", { width: 2800 }),
            cell("(column A value)", { width: 2200 }),
            cell("...?action=grant&email={{contact.email}}&productId=(id)", { width: 4360 }),
          ]}),
          new TableRow({ children: [
            cell("ALL ACCESS BUNDLE", { width: 2800 }),
            cell("(use grantAll)", { width: 2200 }),
            cell("...?action=grantAll&email={{contact.email}}", { width: 4360 }),
          ]}),
        ]
      }),
      spacer(),

      // SECTION 7
      h1("7. Bundles"),
      h2("Option A: All Access"),
      p("Use the grantAll action. This gives the buyer access to every product, current and future."),
      code("YOUR-SCRIPT-URL?action=grantAll&email={{contact.email}}"),
      spacer(),
      h2("Option B: Specific Bundle"),
      p("Add multiple webhook actions in the same workflow — one per product in the bundle. For example, a bundle with 3 products would have 3 webhook actions in the same workflow, each with a different product ID."),
      spacer(),

      // SECTION 8
      h1("8. Testing"),
      numbered("Open your workflow in GHL", "s2"),
      numbered("Click Test Workflow (or trigger with a test contact)", "s2"),
      numbered("Check the Access tab in your Google Sheet — you should see a new row", "s2"),
      numbered("Open the app and sign in with the test email", "s2"),
      numbered("The product should be unlocked", "s2"),
      spacer(),

      // SECTION 9
      h1("9. Troubleshooting"),
      h2("Webhook fires but nothing appears in the sheet"),
      bullet("Make sure you deployed a NEW version of the Apps Script (not just saved it)"),
      bullet("Double-check the Apps Script URL in the webhook is correct"),
      bullet("Make sure the Access tab exists in the sheet"),
      spacer(),
      h2("Row appears but product won't unlock"),
      bullet("Check that the product_id in the Access tab matches column A in the Products tab exactly"),
      bullet("Make sure the status column says active"),
      bullet("Click Refresh in the app"),
      spacer(),
      h2("Email variable not working"),
      bullet("Make sure you are using {{contact.email}} not a hardcoded email"),
      bullet("Confirm the contact has an email address in GHL"),
      spacer(),

      // SECTION 10
      h1("10. Summary"),
      bullet("One workflow per product (clone to save time)"),
      bullet("Each workflow: Trigger (payment) > Webhook (grant access) > Email (confirm)"),
      bullet("Bundles: use grantAll for everything, or multiple webhooks for specific products"),
      bullet("Test with your own email first"),
      bullet("Check the Access tab in your Google Sheet to verify"),
    ]
  }]
});

Packer.toBuffer(doc).then(buffer => {
  fs.writeFileSync("D:\\Htmlappidea\\GHL-Webhook-Setup-Guide.docx", buffer);
  console.log("Document created!");
});
