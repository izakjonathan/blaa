// Install in the Stock Control spreadsheet via Extensions → Apps Script.
function doPost(event) {
  const properties = PropertiesService.getScriptProperties();
  const key = properties.getProperty('STOCK_SHEET_SCRIPT_KEY');
  const content = event && event.postData && event.postData.contents;
  if (!key || key.length < 32 || !content || content.length > 1024) return stockResponse({error: 'Unauthorized'});

  let request;
  try {
    request = JSON.parse(content);
  } catch (_) {
    return stockResponse({error: 'Unauthorized'});
  }
  if (!request || typeof request.key !== 'string' || !stockKeyMatches(key, request.key)) {
    return stockResponse({error: 'Unauthorized'});
  }

  try {
    const spreadsheet = SpreadsheetApp.openById(properties.getProperty('STOCK_SHEET_ID'));
    const sheet = spreadsheet.getSheetByName('Sheet1');
    if (!sheet || sheet.getLastRow() > 1001) return stockResponse({error: 'Invalid Sheet1 tab'});
    const height = sheet.getLastRow();
    const width = Math.min(26, sheet.getLastColumn());
    return stockResponse({rows: height && width ? sheet.getRange(1, 1, height, width).getValues() : []});
  } catch (_) {
    return stockResponse({error: 'Stock sheet is unavailable'});
  }
}

function stockKeyMatches(expected, supplied) {
  const digest = value => Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8);
  const left = digest(expected);
  const right = digest(supplied);
  let difference = 0;
  for (let index = 0; index < left.length; index++) difference |= left[index] ^ right[index];
  return difference === 0;
}

function stockResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
