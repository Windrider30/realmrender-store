/* ═══════════════════════════════════════════════════════════════
   UNIVERSAL STORE — GOOGLE APPS SCRIPT

   Deploy as a Web App in your Google Sheet.
   Set "Execute as: Me" and "Who has access: Anyone".

   Sheet tabs required:
     Products  — store products
     Access    — purchase records
     Bundles   — bundle → product ID mappings
     Settings  — key/value brand + color + cube config
     Nav       — navigation buttons (Label | Category | URL)

   SETUP:
   1. Open your Google Sheet → Extensions → Apps Script
   2. Paste this entire file
   3. Deploy → New deployment → Web App
   4. Copy the Web App URL → paste into config-XX.json as appsScriptUrl
   ═══════════════════════════════════════════════════════════════ */

var PRODUCTS_SHEET = 'Products';
var ACCESS_SHEET   = 'Access';
var BUNDLES_SHEET  = 'Bundles';
var SETTINGS_SHEET = 'Settings';
var NAV_SHEET      = 'Nav';

var SPREADSHEET_ID = '';

function getSpreadsheet(sid) {
  var id = sid || SPREADSHEET_ID;
  if (id) return SpreadsheetApp.openById(id);
  return SpreadsheetApp.getActiveSpreadsheet();
}

// ━━━ WEB APP ENTRY POINTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function doGet(e) {
  return handleRequest(e, null);
}

function doPost(e) {
  var body = null;
  try {
    if (e.postData && e.postData.contents) {
      try { body = JSON.parse(e.postData.contents); } catch(ex) { body = null; }
    }
  } catch(err) { body = null; }
  if (!body && Object.keys(e.parameter || {}).length > 0) body = e.parameter;
  return handleRequest(e, body);
}

function handleRequest(e, body) {
  var p = e.parameter || {};
  var sid = p.sheetId || (body && body.sheetId) || '';
  var action = p.action || (body && body.action) || (body ? 'grant' : '');
  var result = { success: false, message: 'Unknown action' };

  try {
    switch (action) {

      case 'grant':
        var email = p.email || (body ? extractEmail(body) : '');
        var productId = p.productId || (body && body.productId) || '';
        var productName = p.productName || (body ? extractProductName(body) : '');
        result = grantAccess(email, productId, productName, sid);
        result.debug = {
          email: email, productId: productId, productName: productName,
          bodyKeys: body ? Object.keys(body) : [],
          payment: body && body.payment ? JSON.stringify(body.payment) : null,
          triggerData: body && body.triggerData ? JSON.stringify(body.triggerData) : null
        };
        break;

      case 'grantAll':
        result = grantAllAccess(p.email || (body && body.email) || '', sid);
        break;

      case 'check':
        result = checkAccess(p.email || (body && body.email) || '', sid);
        break;

      case 'checkProduct':
        result = checkProductAccess(p.email || '', p.productId || '', sid);
        break;

      case 'revoke':
        result = revokeAccess(p.email || '', p.productId || '', sid);
        break;

      case 'getProducts':
        result = getProducts(sid);
        break;

      case 'getSettings':
        result = getSettings(sid);
        break;

      case 'getNav':
        result = getNav(sid);
        break;

      case 'debug':
        result = { success: true, params: p, body: body, postData: e.postData ? e.postData.contents : null };
        break;

      default:
        result = { success: false, message: 'Actions: grant, grantAll, check, checkProduct, revoke, getProducts, getSettings, getNav' };
    }
  } catch(err) {
    result = { success: false, message: err.toString() };
  }

  return ContentService
    .createTextOutput(JSON.stringify(result))
    .setMimeType(ContentService.MimeType.JSON);
}


// ━━━ EXTRACT EMAIL FROM GHL POST BODY ━━━━━━━━━━━━━━━━━━━━━━━
function extractEmail(body) {
  if (!body) return '';
  return body.email || body.contact_email ||
    (body.contact && body.contact.email) || '';
}


// ━━━ EXTRACT PRODUCT NAME FROM GHL POST BODY ━━━━━━━━━━━━━━━━
function extractProductName(body) {
  if (!body) return '';

  var payment = body.payment || null;
  if (payment) {
    if (payment.product_name) return payment.product_name;
    if (payment.productName)  return payment.productName;
    if (payment.title)        return payment.title;
    if (payment.name)         return payment.name;
    if (payment.product_title) return payment.product_title;
    if (payment.line_items && payment.line_items.length > 0) {
      var li = payment.line_items[0];
      return li.name || li.title || li.product_name || li.product_title || '';
    }
    if (payment.items && payment.items.length > 0) {
      var item = payment.items[0];
      return item.name || item.title || item.product_name || '';
    }
  }

  var td = body.triggerData || null;
  if (td) {
    if (td.product_name) return td.product_name;
    if (td.productName)  return td.productName;
    if (td.title)        return td.title;
    if (td.name)         return td.name;
    if (td.line_items && td.line_items.length > 0) {
      var tli = td.line_items[0];
      return tli.name || tli.title || tli.product_name || '';
    }
  }

  var order = body.order || body.invoice || null;
  if (order) {
    if (order.product_name) return order.product_name;
    if (order.productName)  return order.productName;
    if (order.title)        return order.title;
    if (order.name)         return order.name;
    if (order.line_items && order.line_items.length > 0) {
      var oli = order.line_items[0];
      return oli.name || oli.title || oli.product_name || '';
    }
  }

  if (body.product_name) return body.product_name;
  if (body.productName)  return body.productName;
  if (body.last_purchased_product) return body.last_purchased_product;

  return '';
}


// ━━━ FIND PRODUCT ID BY TITLE ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function findProductIdByTitle(productName, sid) {
  var sheet = getSpreadsheet(sid).getSheetByName(PRODUCTS_SHEET);
  if (!sheet) return null;
  var data = sheet.getDataRange().getValues();
  var normalize = function(s) {
    return String(s).toLowerCase().replace(/[\s\-_.,!@#$%^&*()\[\]@]+/g, '');
  };
  var needle = normalize(productName);
  for (var i = 1; i < data.length; i++) {
    var rowId    = String(data[i][0]).trim();
    var rowTitle = String(data[i][1]).trim();
    if (!rowId) continue;
    if (normalize(rowTitle) === needle || normalize(rowId) === needle) return rowId;
    var normTitle = normalize(rowTitle);
    if (needle.indexOf(normTitle) !== -1 && normTitle.length > 3) return rowId;
  }
  return null;
}


// ━━━ GRANT ACCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function grantAccess(email, productId, productName, sid) {
  if (!email) return { success: false, message: 'Email required' };
  email = email.toLowerCase().trim();

  if (!productId && productName) {
    productId = findProductIdByTitle(productName, sid) || productName.toLowerCase().trim();
  }
  if (!productId) return { success: false, message: 'productId or productName required' };
  productId = productId.toLowerCase().trim();

  var sheet = getOrCreateAccessSheet(sid);
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === email &&
        String(data[i][1]).toLowerCase().trim() === productId) {
      return { success: true, message: 'Access already granted', email: email, productId: productId };
    }
  }

  sheet.appendRow([email, productId, new Date(), 'active']);
  return { success: true, message: 'Access granted', email: email, productId: productId };
}


// ━━━ GRANT ALL ACCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function grantAllAccess(email, sid) {
  if (!email) return { success: false, message: 'Email required' };
  email = email.toLowerCase().trim();

  var sheet = getOrCreateAccessSheet(sid);
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === email &&
        String(data[i][1]).toLowerCase().trim() === 'all') {
      return { success: true, message: 'All-access already granted', email: email };
    }
  }

  sheet.appendRow([email, 'all', new Date(), 'active']);
  return { success: true, message: 'All-access granted', email: email };
}


// ━━━ CHECK ACCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function checkAccess(email, sid) {
  if (!email) return { success: false, message: 'Email required' };
  email = email.toLowerCase().trim();

  var sheet   = getOrCreateAccessSheet(sid);
  var data    = sheet.getDataRange().getValues();
  var granted = [];
  var hasAll  = false;

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === email &&
        String(data[i][3]).toLowerCase() === 'active') {
      var pid = String(data[i][1]).toLowerCase().trim();
      if (pid === 'all') hasAll = true;
      granted.push(pid);
    }
  }

  if (granted.length === 0) {
    return { success: false, message: 'No purchases found for this email', email: email, products: [] };
  }

  var bundleMap = getBundleMap(sid);
  var products  = [];
  granted.forEach(function(pid) {
    if (bundleMap[pid]) {
      bundleMap[pid].forEach(function(p) { if (products.indexOf(p) === -1) products.push(p); });
    } else {
      if (products.indexOf(pid) === -1) products.push(pid);
    }
  });

  return { success: true, email: email, products: products, allAccess: hasAll };
}


// ━━━ BUNDLE MAP ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getBundleMap(sid) {
  var sheet = getSpreadsheet(sid).getSheetByName(BUNDLES_SHEET);
  var map   = {};
  if (!sheet) return map;
  var data  = sheet.getDataRange().getValues();
  for (var i = 1; i < data.length; i++) {
    var bundleId   = String(data[i][0]).toLowerCase().trim();
    var productIds = String(data[i][4]).toLowerCase().trim();
    if (bundleId && productIds) {
      map[bundleId] = productIds.split(',').map(function(p) { return p.trim(); }).filter(Boolean);
    }
  }
  return map;
}


// ━━━ CHECK SINGLE PRODUCT ACCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function checkProductAccess(email, productId, sid) {
  if (!email || !productId) return { success: false, message: 'Email and productId required' };
  email = email.toLowerCase().trim();

  var sheet = getOrCreateAccessSheet(sid);
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === email &&
        String(data[i][3]).toLowerCase() === 'active') {
      var pid = String(data[i][1]).toLowerCase().trim();
      if (pid === productId.toLowerCase() || pid === 'all') {
        return { success: true, message: 'Access confirmed', email: email, productId: productId };
      }
    }
  }
  return { success: false, message: 'No access for this product', email: email, productId: productId };
}


// ━━━ REVOKE ACCESS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function revokeAccess(email, productId, sid) {
  if (!email || !productId) return { success: false, message: 'Email and productId required' };
  email = email.toLowerCase().trim();

  var sheet = getOrCreateAccessSheet(sid);
  var data  = sheet.getDataRange().getValues();

  for (var i = 1; i < data.length; i++) {
    if (String(data[i][0]).toLowerCase().trim() === email &&
        String(data[i][1]).toLowerCase().trim() === productId.toLowerCase()) {
      sheet.getRange(i + 1, 4).setValue('revoked');
      return { success: true, message: 'Access revoked', email: email, productId: productId };
    }
  }
  return { success: false, message: 'No matching access found' };
}


// ━━━ GET PRODUCTS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function getProducts(sid) {
  var sheet = getSpreadsheet(sid).getSheetByName(PRODUCTS_SHEET);
  if (!sheet) return { success: false, message: 'Products sheet not found' };
  var data    = sheet.getDataRange().getValues();
  var headers = data[0];
  var products = [];
  for (var i = 1; i < data.length; i++) {
    var product = {};
    for (var j = 0; j < headers.length; j++) {
      product[String(headers[j]).toLowerCase().replace(/\s+/g, '_')] = data[i][j];
    }
    products.push(product);
  }
  return { success: true, products: products };
}


// ━━━ GET SETTINGS ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sheet tab: "Settings" — two columns: Key | Value
// Supported keys:
//   brand_name, brand_tagline, eyebrow_text, window_title, loading_text
//   featured_label, all_label, showcase_label, showcase_title
//   color_bg, color_card, color_primary, color_secondary, color_accent, color_text, color_muted
//   cube_front, cube_back, cube_left, cube_right, cube_top, cube_bottom
//   cube2_front, cube2_back, cube2_left, cube2_right, cube2_top, cube2_bottom
function getSettings(sid) {
  var sheet = getSpreadsheet(sid).getSheetByName(SETTINGS_SHEET);
  if (!sheet) return { success: false, message: 'Settings sheet not found' };
  var data     = sheet.getDataRange().getValues();
  var settings = {};
  for (var i = 0; i < data.length; i++) {
    var key = String(data[i][0]).trim().toLowerCase();
    var val = String(data[i][1]).trim();
    if (key && val && key !== 'key') settings[key] = val;
  }
  return { success: true, settings: settings };
}


// ━━━ GET NAV ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Sheet tab: "Nav" — three columns: Label | Category | URL
// Category filled  → filters store products by that category
// URL filled       → opens that link in the in-app browser
// Both filled      → URL takes priority
// Row deleted      → button disappears from the app
function getNav(sid) {
  var sheet = getSpreadsheet(sid).getSheetByName(NAV_SHEET);
  if (!sheet) return { success: false, message: 'Nav sheet not found' };
  var data = sheet.getDataRange().getValues();
  var nav  = [];
  for (var i = 0; i < data.length; i++) {
    var label    = String(data[i][0]).trim();
    var category = String(data[i][1]).trim().toLowerCase();
    var url      = String(data[i][2]).trim();
    // Skip header row and empty rows
    if (!label || label.toLowerCase() === 'label') continue;
    if (!category && !url) continue;
    nav.push({ label: label, category: category || '', url: url || '' });
  }
  return { success: true, nav: nav };
}


// ━━━ HELPER: Get or create Access sheet ━━━━━━━━━━━━━━━━━━━━━━
function getOrCreateAccessSheet(sid) {
  var ss    = getSpreadsheet(sid);
  var sheet = ss.getSheetByName(ACCESS_SHEET);
  if (!sheet) {
    sheet = ss.insertSheet(ACCESS_SHEET);
    sheet.appendRow(['email', 'product_id', 'granted_date', 'status']);
    sheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#0D0D0D').setFontColor('#00F0FF');
    sheet.setFrozenRows(1);
  }
  return sheet;
}


// ━━━ MENU ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function onOpen() {
  SpreadsheetApp.getUi().createMenu('Store Admin')
    .addItem('Setup Access Sheet', 'menuSetupAccess')
    .addItem('Grant Access (manual)', 'menuGrantAccess')
    .addItem('Check Access (manual)', 'menuCheckAccess')
    .addSeparator()
    .addItem('Count Active Users', 'menuCountUsers')
    .addToUi();
}

function menuSetupAccess() {
  getOrCreateAccessSheet();
  SpreadsheetApp.getUi().alert('Access sheet is ready!');
}

function menuGrantAccess() {
  var ui = SpreadsheetApp.getUi();
  var emailResp = ui.prompt('Grant Access', 'Enter buyer email:', ui.ButtonSet.OK_CANCEL);
  if (emailResp.getSelectedButton() !== ui.Button.OK) return;
  var prodResp = ui.prompt('Grant Access', 'Enter product ID or name (or "all" for full access):', ui.ButtonSet.OK_CANCEL);
  if (prodResp.getSelectedButton() !== ui.Button.OK) return;

  var email   = emailResp.getResponseText().trim();
  var product = prodResp.getResponseText().trim();
  var result  = product.toLowerCase() === 'all' ? grantAllAccess(email) : grantAccess(email, '', product);
  ui.alert(result.message + (result.productId ? ' (' + result.productId + ')' : ''));
}

function menuCheckAccess() {
  var ui   = SpreadsheetApp.getUi();
  var resp = ui.prompt('Check Access', 'Enter email to check:', ui.ButtonSet.OK_CANCEL);
  if (resp.getSelectedButton() !== ui.Button.OK) return;
  var result = checkAccess(resp.getResponseText().trim());
  ui.alert(result.success
    ? 'Products unlocked:\n\n' + result.products.join('\n')
    : result.message);
}

function menuCountUsers() {
  var sheet = getSpreadsheet().getSheetByName(ACCESS_SHEET);
  if (!sheet) { SpreadsheetApp.getUi().alert('Access sheet not found'); return; }
  var data   = sheet.getDataRange().getValues();
  var emails = {}, active = 0;
  for (var i = 1; i < data.length; i++) {
    if (String(data[i][3]).toLowerCase() === 'active') {
      emails[String(data[i][0]).toLowerCase()] = true;
      active++;
    }
  }
  SpreadsheetApp.getUi().alert('Unique users: ' + Object.keys(emails).length + '\nActive grants: ' + active);
}
