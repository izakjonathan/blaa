import {createHash, timingSafeEqual} from 'node:crypto';
import {validateStock, type Product, type Stock} from './stock.ts';

const normalize = (value: string) => value.trim().normalize('NFC').toLowerCase();
const identity = (name: string, supplier: string, category: string) =>
  JSON.stringify([name, supplier, category].map(normalize));

export function mergeSheetProducts(stock: Stock, rows: unknown[][]) {
  const headers = (rows[0] ?? []).map(value => normalize(String(value)));
  const sizeHeader = headers.includes('unit size (l.)') ? 'unit size (l.)' : 'unit size';
  const packColumns = headers.includes('pack qty') || headers.includes(sizeHeader);
  const required = packColumns ? ['name', 'supplier', 'unit', sizeHeader, 'pack qty'] :
    ['name', 'supplier', 'type', 'unit', 'pack'];
  for (const field of required) {
    if (headers.filter(header => header === field).length !== 1) {
      throw Error(`Invalid Stock Control sheet: expected exactly one "${field}" column.`);
    }
  }

  for (const field of ['low ideal', 'high ideal']) {
    if (headers.filter(header => header === field).length > 1) {
      throw Error(`Invalid Stock Control sheet: duplicate "${field}" column.`);
    }
  }

  const usedProducts = new Set([
    ...stock.weeks.flatMap(week => week.rows.map(row => row.product.id)),
    ...(stock.deliveries ?? []).map(delivery => delivery.product.id),
    ...(stock.salesEntries ?? []).flatMap(entry => entry.item.ingredients.map(part => part.productId)),
    ...stock.sales.flatMap(item => item.ingredients.map(part => part.productId)),
  ]);
  const recognized = [...required, 'type', 'sku', 'active', 'low ideal', 'high ideal'];
  const products = [...stock.products];
  const seen = new Set<string>();
  let added = 0;
  let updated = 0;
  for (const [index, row] of rows.slice(1).entries()) {
    const cell = (column: string) => String(row[headers.indexOf(column)] ?? '').trim();
    if (recognized.every(column => !cell(column))) continue;
    const name = cell('name');
    const supplier = cell('supplier');
    const category = cell('type') || (packColumns ? cell('unit') : '');
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
    let pack = previous?.pack ?? 1;
    let unitLabel = previous?.unitLabel;
    let unitSizeL = previous?.unitSizeL;
    let packQty = previous?.packQty;
    if (packColumns) {
      const size = cell(sizeHeader);
      const qty = cell('pack qty');
      unitLabel = cell('unit') || undefined;
      unitSizeL = size ? Number(size.replace(',', '.')) : undefined;
      packQty = qty ? Number(qty.replace(',', '.')) : undefined;
      if (unitSizeL !== undefined && (!Number.isFinite(unitSizeL) || unitSizeL < .0001 || unitSizeL > 10000000)) {
        fail('unit size must be a positive number of litres.');
      }
      if (packQty !== undefined && (!Number.isSafeInteger(packQty) || packQty < 1 || packQty > 10000000)) {
        fail('pack qty must be a positive whole number of units.');
      }
      const unitsPerPack = packQty ?? previous?.packQty ?? (previous?.unit === 'each' ? previous.pack : 1);
      // Existing counts and till mappings store amounts in their original base unit.
      if (unitSizeL !== undefined && !usedProducts.has(id)) unit = 'L';
      if (unit === 'L') {
        const litresPerUnit = unitSizeL ?? previous?.unitSizeL;
        if (litresPerUnit !== undefined) pack = litresPerUnit * unitsPerPack;
        else if (packQty !== undefined && previous) pack = previous.pack / (previous.packQty ?? 1) * packQty;
      } else if (unit === 'each') {
        pack = unitsPerPack;
      }
    } else {
      if (unitText === 'l') unit = 'L';
      else if (unitText === 'each' || unitText === 'kg') unit = unitText;
      else if (unitText) fail('unit must be L, each or kg.');

      const packText = cell('pack');
      if (unit !== (previous?.unit ?? 'each') && !packText) fail('enter a pack quantity for the new unit.');
      if (packText) pack = Number(packText.replace(',', '.'));
    }
    if (!Number.isFinite(pack) || pack < 0.0001 || pack > 10000000) fail('pack must be a positive quantity in the selected unit.');
    if (previous && previous.unit !== unit && stock.sales.some(item => item.ingredients.some(part => part.productId === id))) {
      fail('remove or update the till mapping before changing this product’s unit.');
    }

    const activeText = normalize(cell('active'));
    if (activeText && activeText !== 'true' && activeText !== 'false') fail('Active must be TRUE or FALSE.');
    const ideal = (column: string, saved: number | undefined) => {
      if (!headers.includes(column)) return saved;
      const value = cell(column);
      if (!value) return undefined;
      const amount = Number(value.replace(',', '.'));
      if (!Number.isFinite(amount) || amount < 0 || amount > 10000000) {
        fail(`${column} must be a number from 0 to 10,000,000 packs.`);
      }
      return amount;
    };
    const lowIdeal = ideal('low ideal', previous?.lowIdeal);
    const highIdeal = ideal('high ideal', previous?.highIdeal);
    const product: Product = {
      id, name, supplier, category, sku: sku || previous?.sku || '', unit, pack,
      packCost: previous?.packCost ?? 0,
      par: previous ? (pack === previous.pack ? previous.par : previous.par / previous.pack * pack) : 7 * pack,
      threshold: previous?.threshold ?? 5,
      active: activeText ? activeText === 'true' : previous?.active ?? true,
      unitLabel,
      unitSizeL,
      packQty,
      lowIdeal,
      highIdeal,
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
