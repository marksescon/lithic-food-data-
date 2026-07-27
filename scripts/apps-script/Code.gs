/**
 * Lithic iOS → Google Sheets writeback (no public input website).
 *
 * The iOS app POSTs JSON here. Users never enter food data in a browser.
 *
 * Setup:
 * 1. Open your food spreadsheet in Google Sheets.
 * 2. Catalog tab: rename the sheet that backs SHEET_CSV_URL to "Catalog"
 *    (or leave the name and set CATALOG_SHEET below to match). Headers:
 *      food | servingSize | totalCalories | protein | fat | carbs
 * 3. Create a second tab named "FoodLog" with headers:
 *      loggedAt | food | servingSize | servings | calories | protein | fat | carbs
 * 4. Extensions → Apps Script → paste this file → save.
 * 5. Project Settings → Script properties:
 *      APPEND_SECRET = a long random string (same value in Lithic Settings)
 * 6. Deploy → New deployment → type: Web app
 *      Execute as: Me
 *      Who has access: Anyone
 *    (This URL is an API endpoint for the app, not a data-entry site.)
 * 7. Paste the web app URL into Lithic → Settings → Sheets webhook URL.
 *
 * POST JSON body:
 *   { "secret": "...", "type": "catalog"|"log", "row": { ... } }
 */

var CATALOG_SHEET = 'Catalog';
var LOG_SHEET = 'FoodLog';

function doPost(e) {
  try {
    var body = JSON.parse(e.postData.contents);
    var expected = PropertiesService.getScriptProperties().getProperty('APPEND_SECRET');
    if (!expected || body.secret !== expected) {
      return jsonResponse({ ok: false, error: 'unauthorized' });
    }

    var type = String(body.type || '').toLowerCase();
    var row = body.row || {};

    if (type === 'catalog') {
      appendCatalog_(row);
    } else if (type === 'log') {
      appendLog_(row);
    } else {
      return jsonResponse({ ok: false, error: 'unknown type' });
    }

    return jsonResponse({ ok: true });
  } catch (err) {
    return jsonResponse({ ok: false, error: String(err) });
  }
}

function doGet() {
  return jsonResponse({ ok: true, service: 'lithic-sheets-append' });
}

function appendCatalog_(row) {
  // Prefer an explicit "Catalog" tab; otherwise append to the first sheet
  // so new foods land on the same tab your published CSV already exports.
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(CATALOG_SHEET) || ss.getSheets()[0];
  if (!sheet) {
    throw new Error('No spreadsheet tabs found');
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(['food', 'servingSize', 'totalCalories', 'protein', 'fat', 'carbs']);
  }
  sheet.appendRow([
    String(row.food || '').trim(),
    String(row.servingSize || '').trim(),
    Number(row.totalCalories) || 0,
    Number(row.protein) || 0,
    Number(row.fat) || 0,
    Number(row.carbs) || 0
  ]);
}

function appendLog_(row) {
  var sheet = getOrCreateSheet_(LOG_SHEET, [
    'loggedAt', 'food', 'servingSize', 'servings', 'calories', 'protein', 'fat', 'carbs'
  ]);
  sheet.appendRow([
    String(row.loggedAt || ''),
    String(row.food || '').trim(),
    String(row.servingSize || '').trim(),
    Number(row.servings) || 0,
    Number(row.calories) || 0,
    Number(row.protein) || 0,
    Number(row.fat) || 0,
    Number(row.carbs) || 0
  ]);
}

function getOrCreateSheet_(name, headers) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    sheet.appendRow(headers);
    return sheet;
  }
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
  return sheet;
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
