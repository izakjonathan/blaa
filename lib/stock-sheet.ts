import {createHash, timingSafeEqual} from 'node:crypto';
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

export function stockSheetEnabled() {
  return Boolean(process.env.STOCK_SHEET_SCRIPT_URL || process.env.STOCK_SHEET_SCRIPT_KEY);
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
  const url = process.env.STOCK_SHEET_SCRIPT_URL;
  const key = process.env.STOCK_SHEET_SCRIPT_KEY;
  if (!url || !/^https:\/\/script\.google\.com\/macros\/s\/[\w-]+\/exec$/.test(url) || !key || key.length < 32) {
    throw Error('Connect the Stock Control Apps Script using its deployment URL and sync key.');
  }

  const signal = AbortSignal.timeout(12000);
  try {
    let response = await fetch(url, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({key}),
      cache: 'no-store',
      redirect: 'manual',
      signal,
    });

    // ContentService serves the response from a one-time Google URL.
    // Follow it with a GET so the sync key stays on the original request.
    if (response.status === 302 || response.status === 303) {
      const location = response.headers.get('location');
      if (!location || new URL(location).origin !== 'https://script.googleusercontent.com') {
        throw Error('Unexpected Apps Script redirect.');
      }
      response = await fetch(location, {cache: 'no-store', redirect: 'error', signal});
    }
    if (!response.ok) throw Error('Apps Script request failed.');
    const {rows} = await response.json();
    if (!Array.isArray(rows) || rows.length > 1001 || !rows.every(row => Array.isArray(row) && row.length <= 26)) {
      throw Error('Unexpected Apps Script response.');
    }
    return rows;
  } catch {
    throw Error('Connect to the Apps Script deployment. Check its access settings, sync key and Sheet1 tab.');
  }
}
