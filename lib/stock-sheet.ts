import {createHash, sign, timingSafeEqual} from 'node:crypto';
import {validateStock, type Product, type Stock} from './stock.ts';

const normalize = (value: string) => value.trim().normalize('NFC').toLowerCase();
const identity = (name: string, supplier: string, category: string) =>
  JSON.stringify([name, supplier, category].map(normalize));

export function mergeSheetProducts(stock: Stock, rows: unknown[][]) {
  const headers = (rows[0] ?? []).map(value => normalize(String(value)));
  for (const field of ['name', 'supplier', 'type', 'unit', 'pack']) {
    if (headers.filter(header => header === field).length !== 1) {
      throw Error(`Invalid Stock Control sheet: expected exactly one "${field}" column.`);
    }
  }

  const products = [...stock.products];
  const seen = new Set<string>();
  let added = 0;
  let updated = 0;
  for (const [index, row] of rows.slice(1).entries()) {
    if (row.every(value => String(value ?? '').trim() === '')) continue;
    const cell = (column: string) => String(row[headers.indexOf(column)] ?? '').trim();
    const name = cell('name');
    const supplier = cell('supplier');
    const category = cell('type');
    const sku = cell('sku');
    const key = identity(name, supplier, category);
    const sheetId = 'sheet-' + createHash('sha256').update(sku ? 'sku:' + normalize(sku) : key).digest('hex');
    const fail = (message: string): never => { throw Error(`Invalid sheet row ${index + 2}: ${message}`); };
    if (!name) fail('enter a product name.');

    const matches = products.filter(product => product.id === sheetId ||
      (sku && normalize(product.sku) === normalize(sku)) ||
      (identity(product.name, product.supplier, product.category) === key && (!sku || !product.sku)));
    if (matches.length > 1) fail('multiple stock products match. Use a unique SKU.');
    const previous = matches[0];
    const id = previous?.id ?? sheetId;
    if (seen.has(id)) fail('duplicate product. Use distinct SKUs for separate products.');
    seen.add(id);

    const unitText = normalize(cell('unit'));
    let unit: Product['unit'] = previous?.unit ?? 'each';
    if (unitText === 'l') unit = 'L';
    else if (unitText === 'each' || unitText === 'kg') unit = unitText;
    else if (unitText) fail('unit must be L, each or kg.');

    const packText = cell('pack');
    if (unit !== (previous?.unit ?? 'each') && !packText) fail('enter a pack quantity for the new unit.');
    const pack = packText ? Number(packText.replace(',', '.')) : previous?.pack ?? 1;
    if (!Number.isFinite(pack) || pack < 0.0001 || pack > 10000000) fail('pack must be a positive quantity in the selected unit.');
    if (previous && previous.unit !== unit && stock.sales.some(item => item.ingredients.some(part => part.productId === id))) {
      fail('remove or update the till mapping before changing this product’s unit.');
    }

    const activeText = normalize(cell('active'));
    if (activeText && activeText !== 'true' && activeText !== 'false') fail('Active must be TRUE or FALSE.');
    const product: Product = {
      id, name, supplier, category, sku: sku || previous?.sku || '', unit, pack,
      packCost: previous?.packCost ?? 0,
      par: previous ? (pack === previous.pack ? previous.par : previous.par / previous.pack * pack) : 7 * pack,
      threshold: previous?.threshold ?? 5,
      active: activeText ? activeText === 'true' : previous?.active ?? true,
    };
    if (!previous) {
      products.push(product);
      added++;
    } else if ((Object.keys(product) as (keyof Product)[]).some(key => product[key] !== previous[key])) {
      products[products.indexOf(previous)] = product;
      updated++;
    }
  }
  if (!seen.size) throw Error('Invalid Stock Control sheet: no products found.');
  return {document: validateStock({...stock, products}), added, updated};
}

const scope = 'https://www.googleapis.com/auth/spreadsheets.readonly';
const tokenUrl = 'https://oauth2.googleapis.com/token';

export function stockSheetEnabled() {
  return Boolean(process.env.STOCK_SHEET_ID || process.env.STOCK_SHEET_SERVICE_ACCOUNT_JSON);
}

export function stockAccessAllowed(request: Request) {
  if (!stockSheetEnabled() && !process.env.STOCK_ACCESS_KEY) return true;
  const key = process.env.STOCK_ACCESS_KEY;
  const authorization = request.headers.get('authorization');
  if (!key || key.length < 32 || !authorization?.startsWith('Bearer ')) return false;
  const hash = (value: string) => createHash('sha256').update(value).digest();
  return timingSafeEqual(hash(key), hash(authorization.slice(7)));
}

export async function readStockSheet(): Promise<unknown[][]> {
  const id = process.env.STOCK_SHEET_ID;
  const credentials = process.env.STOCK_SHEET_SERVICE_ACCOUNT_JSON;
  if (!id || !/^[\w-]+$/.test(id) || !credentials) throw Error('Connect the private Google Sheet in the deployment settings.');
  let account: {client_email?: string; private_key?: string};
  try { account = JSON.parse(credentials); } catch { throw Error('Invalid Google service account configuration.'); }
  if (!account?.client_email || !account.private_key) throw Error('Invalid Google service account configuration.');

  const now = Math.floor(Date.now() / 1000);
  const encode = (value: object) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const claims = encode({iss: account.client_email, scope, aud: tokenUrl, iat: now, exp: now + 300});
  const unsigned = encode({alg: 'RS256', typ: 'JWT'}) + '.' + claims;
  const assertion = unsigned + '.' + sign('RSA-SHA256', Buffer.from(unsigned), account.private_key).toString('base64url');
  const token = await fetch(tokenUrl, {
    method: 'POST',
    body: new URLSearchParams({grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion}),
    cache: 'no-store',
    signal: AbortSignal.timeout(8000),
  });
  if (!token.ok) throw Error('Connect a valid Google Sheets service account in the deployment settings.');
  const {access_token} = await token.json();
  if (typeof access_token !== 'string') throw Error('Invalid Google Sheets token response.');

  const range = encodeURIComponent("'Sheet1'!A1:Z");
  const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${id}/values/${range}?valueRenderOption=UNFORMATTED_VALUE`, {
    headers: {Authorization: 'Bearer ' + access_token},
    cache: 'no-store',
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw Error('Connect the Sheet1 tab by enabling the Google Sheets API and sharing the sheet with the service account as Viewer.');
  const {values} = await response.json();
  if (!Array.isArray(values) || !values.every(Array.isArray)) throw Error('Invalid Google Sheet response.');
  return values;
}
