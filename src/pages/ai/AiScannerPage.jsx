import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ScanLine,
  UploadCloud,
  FileText,
  CheckCircle2,
  Trash2,
  Plus,
  ArrowRight,
  AlertCircle,
  Sparkles,
  RefreshCw,
  Box,
  ShoppingCart,
  UtensilsCrossed,
} from 'lucide-react';
import { scanInvoice, confirmScannedInvoice } from '../../api/ai.js';
import { getProducts, createProduct, updateProduct } from '../../api/products.js';
import { createSale } from '../../api/sales.js';
import {
  getRestaurantInventory,
  createRestaurantInventoryItem,
  adjustInventoryQuantity,
} from '../../api/restaurant.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import Alert from '../../components/ui/Alert.jsx';
import Spinner from '../../components/ui/Spinner.jsx';

const OCR_STAGES = [
  'Preparing and encoding invoice image...',
  'Scanning text with AI OCR...',
  'Detecting items, quantities & unit prices...',
  'Finalizing extracted invoice items...',
];

const DEMO_ITEMS = [
  { name: 'Fresh Milk 1L', quantity: 12, purchasePrice: 135 },
  { name: 'Artisan Baguette', quantity: 30, purchasePrice: 20 },
  { name: 'Pure Olive Oil 750ml', quantity: 6, purchasePrice: 950 },
  { name: 'Sugar Bag 1kg', quantity: 10, purchasePrice: 95 },
];

export default function AiScannerPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Available modes
  const isRestaurant = company?.business_type === 'restaurant' || company?.business_type === 'cafe';
  const isPharmacy = company?.business_type === 'pharmacy';
  const isClothing = company?.business_type === 'clothing';

  const [mode, setMode] = useState(isRestaurant ? 'restaurantInventory' : 'stock');
  const [stage, setStage] = useState('upload'); // 'upload' | 'scanning' | 'review' | 'success'
  const [ocrStageIndex, setOcrStageIndex] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const [scannedItems, setScannedItems] = useState([]);
  const [existingProducts, setExistingProducts] = useState([]);
  const [logId, setLogId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch existing products for matching & pre-filling sale prices
  useEffect(() => {
    getProducts({ limit: 500 })
      .then((res) => {
        setExistingProducts(res?.products || (Array.isArray(res) ? res : []));
      })
      .catch(() => {});
  }, [mode]);

  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    processImageFile(file);
  }

  function handleDrop(e) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    processImageFile(file);
  }

  function processImageFile(file) {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (JPEG, PNG, or WebP).');
      return;
    }

    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      startOcrScan(dataUrl, file.type);
    };
    reader.readAsDataURL(file);
  }

  function handleDemoScan() {
    setError(null);
    setImagePreview(null);
    setStage('scanning');
    setOcrStageIndex(0);

    const interval = setInterval(() => {
      setOcrStageIndex((prev) => {
        if (prev < OCR_STAGES.length - 1) return prev + 1;
        clearInterval(interval);
        return prev;
      });
    }, 700);

    setTimeout(() => {
      clearInterval(interval);
      setLogId(null);
      setScannedItems(
        DEMO_ITEMS.map((item) => {
          const match = existingProducts.find(
            (p) => p.name.trim().toLowerCase() === item.name.trim().toLowerCase()
          );
          return {
            name: item.name,
            quantity: item.quantity,
            purchasePrice: item.purchasePrice,
            salePrice:
              match?.selling_price != null
                ? match.selling_price
                : match?.sellingPrice != null
                ? match.sellingPrice
                : '',
            matchedProductId: match?.id || '',
            expirationDate: '',
            size: '',
            color: '',
            brand: '',
          };
        })
      );
      setStage('review');
    }, 2800);
  }

  async function startOcrScan(base64Data, mimeType) {
    setStage('scanning');
    setOcrStageIndex(0);

    const stageInterval = setInterval(() => {
      setOcrStageIndex((prev) => (prev < OCR_STAGES.length - 1 ? prev + 1 : prev));
    }, 2000);

    try {
      const rawBase64 = base64Data.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      const result = await scanInvoice({
        imageBase64: rawBase64,
        mimeType: mimeType || 'image/jpeg',
      });

      clearInterval(stageInterval);

      const items = (result?.items || []).map((raw) => {
        const rawName = (raw.name || '').trim();
        const match = existingProducts.find(
          (p) => p.name.trim().toLowerCase() === rawName.toLowerCase()
        );
        return {
          name: rawName,
          quantity: Number(raw.quantity) || 1,
          purchasePrice: Number(raw.unitPrice || raw.purchasePrice) || 0,
          salePrice:
            match?.selling_price != null
              ? match.selling_price
              : match?.sellingPrice != null
              ? match.sellingPrice
              : '',
          matchedProductId: match?.id || '',
          expirationDate: '',
          size: '',
          color: '',
          brand: '',
        };
      });

      setLogId(result?.logId || null);

      if (items.length === 0) {
        setScannedItems([
          {
            name: '',
            quantity: 1,
            purchasePrice: 0,
            salePrice: '',
            matchedProductId: '',
            expirationDate: '',
            size: '',
            color: '',
            brand: '',
          },
        ]);
        setError('No text line items detected in invoice. You can enter them manually below.');
      } else {
        setScannedItems(items);
      }

      setStage('review');
    } catch (err) {
      clearInterval(stageInterval);
      const msg =
        err.response?.data?.message ||
        err.message ||
        'AI Invoice OCR failed. You can proceed with manual entry.';
      setError(msg);
      // Fallback to manual review
      setScannedItems([
        {
          name: '',
          quantity: 1,
          purchasePrice: 0,
          salePrice: '',
          matchedProductId: '',
          expirationDate: '',
          size: '',
          color: '',
          brand: '',
        },
      ]);
      setStage('review');
    }
  }

  function handleItemChange(index, field, value) {
    setScannedItems((prev) => {
      const next = [...prev];
      const item = { ...next[index], [field]: value };

      if (field === 'matchedProductId' && value) {
        const match = existingProducts.find((p) => p.id === value);
        if (
          match &&
          (item.salePrice === '' || item.salePrice === undefined || item.salePrice === null)
        ) {
          item.salePrice = match.selling_price ?? match.sellingPrice ?? '';
        }
      } else if (field === 'name' && value) {
        const match = existingProducts.find(
          (p) => p.name.trim().toLowerCase() === value.trim().toLowerCase()
        );
        if (match) {
          if (item.salePrice === '' || item.salePrice === undefined || item.salePrice === null) {
            item.salePrice = match.selling_price ?? match.sellingPrice ?? '';
          }
          if (!item.matchedProductId) {
            item.matchedProductId = match.id;
          }
        }
      }

      next[index] = item;
      return next;
    });
  }

  function addItemRow() {
    setScannedItems((prev) => [
      ...prev,
      {
        name: '',
        quantity: 1,
        purchasePrice: 0,
        salePrice: '',
        matchedProductId: '',
        expirationDate: '',
        size: '',
        color: '',
        brand: '',
      },
    ]);
  }

  function removeItemRow(index) {
    setScannedItems((prev) => prev.filter((_, i) => i !== index));
  }

  const totalPurchaseCost = scannedItems.reduce(
    (acc, it) => acc + (Number(it.purchasePrice) || 0) * (Number(it.quantity) || 1),
    0
  );

  const totalSaleValue = scannedItems.reduce(
    (acc, it) => acc + (Number(it.salePrice) || 0) * (Number(it.quantity) || 1),
    0
  );

  const projectedGrossProfit = totalSaleValue - totalPurchaseCost;
  const grandTotal = totalPurchaseCost;

  async function handleConfirmSubmit() {
    if (scannedItems.length === 0) {
      setError(t('pleaseAddOneItem', 'Please add at least one line item.'));
      return;
    }

    // Strict Validation
    for (const it of scannedItems) {
      if (!it.name || !it.name.trim()) {
        setError(t('itemNeedsName', 'All items must have a valid product name.'));
        return;
      }
      if (!it.quantity || Number(it.quantity) <= 0 || isNaN(Number(it.quantity))) {
        setError(t('invalidQuantity', 'All items must have a valid quantity greater than 0.'));
        return;
      }
      if (it.purchasePrice === '' || isNaN(Number(it.purchasePrice)) || Number(it.purchasePrice) < 0) {
        setError(t('invalidPurchasePrice', 'Purchase price must be a valid non-negative number.'));
        return;
      }
      if (mode === 'stock') {
        const sPriceNum = Number(it.salePrice);
        if (
          it.salePrice === '' ||
          it.salePrice === undefined ||
          it.salePrice === null ||
          isNaN(sPriceNum) ||
          sPriceNum <= 0
        ) {
          setError(
            `${t('invalidSalePrice', 'Sale price must be a valid positive number for every item.')} (${it.name.trim() || 'Item'})`
          );
          return;
        }
      }
    }

    if (mode === 'sales') {
      const unmatched = scannedItems.some((it) => !it.matchedProductId);
      if (unmatched) {
        setError(
          t('matchAllItems', 'All scanned items must be matched to an existing product in stock before recording a sale.')
        );
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      if (mode === 'restaurantInventory') {
        // Kitchen Inventory restock
        const existingKitchen = await getRestaurantInventory().catch(() => []);
        for (const it of scannedItems) {
          const match = existingKitchen.find(
            (k) => k.name.trim().toLowerCase() === it.name.trim().toLowerCase()
          );
          let targetId = match?.id;
          if (!targetId) {
            const created = await createRestaurantInventoryItem({
              name: it.name.trim(),
              unit: 'kg',
              currentStock: 0,
              minimumStock: 5,
              costPerUnit: Number(it.purchasePrice) || 0,
            });
            targetId = created.id;
          }

          if (Number(it.quantity) > 0) {
            await adjustInventoryQuantity(targetId, {
              delta: Number(it.quantity),
              reason: 'purchase',
              notes: 'AI-scanned invoice',
            });
          }
        }
        setSuccessMessage(`Successfully updated kitchen inventory with ${scannedItems.length} items!`);
      } else if (mode === 'sales') {
        // Sales Mode
        const saleItems = scannedItems.map((it) => {
          const prod = existingProducts.find((p) => p.id === it.matchedProductId);
          const unitPrice =
            it.salePrice !== '' && !isNaN(Number(it.salePrice)) && Number(it.salePrice) > 0
              ? Number(it.salePrice)
              : prod?.selling_price || Number(it.purchasePrice) || 0;
          return {
            product_id: it.matchedProductId,
            quantity: Number(it.quantity) || 1,
            unit_price: unitPrice,
          };
        });

        await createSale({
          items: saleItems,
          payment_method: 'cash',
        });
        setSuccessMessage('Sale successfully recorded from scanned invoice!');
      } else {
        // Stock mode: create or update inventory products
        for (const it of scannedItems) {
          const pPrice = Number(it.purchasePrice) || 0;
          const sPrice = Number(it.salePrice);
          const qty = Number(it.quantity) || 1;

          const match = existingProducts.find(
            (p) =>
              (it.matchedProductId && p.id === it.matchedProductId) ||
              p.name.trim().toLowerCase() === it.name.trim().toLowerCase()
          );

          if (match) {
            await updateProduct(match.id, {
              quantity: (Number(match.quantity) || 0) + qty,
              purchasePrice: pPrice,
              sellingPrice: sPrice,
              purchase_price: pPrice,
              selling_price: sPrice,
              expirationDate: it.expirationDate || match.expiration_date || undefined,
              size: it.size || match.size || undefined,
              color: it.color || match.color || undefined,
              brand: it.brand || match.brand || undefined,
            });
          } else {
            await createProduct({
              name: it.name.trim(),
              category: 'Scanned Invoices',
              purchasePrice: pPrice,
              sellingPrice: sPrice,
              purchase_price: pPrice,
              selling_price: sPrice,
              quantity: qty,
              expirationDate: it.expirationDate || undefined,
              size: it.size || undefined,
              color: it.color || undefined,
              brand: it.brand || undefined,
            });
          }
        }
        setSuccessMessage(`Successfully added/updated ${scannedItems.length} products in inventory!`);
      }

      // Mark ai_logs as confirmed
      if (logId) {
        await confirmScannedInvoice(logId).catch(() => {});
      }

      setStage('success');
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to save items to database.');
    } finally {
      setIsSubmitting(false);
    }
  }

  function resetScanner() {
    setStage('upload');
    setImagePreview(null);
    setScannedItems([]);
    setError(null);
    setSuccessMessage('');
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <ScanLine className="text-brand-blue" />
            {t('aiScannerTitle', 'AI Invoice Scanner')}
          </h1>
          <p className="text-sm text-slate-400">
            {t('aiScannerSubtitle', 'Extract products, quantities, and prices automatically with Vision AI OCR')}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-1 rounded-xl border border-line bg-ink-900 p-1">
          <button
            type="button"
            onClick={() => setMode('stock')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'stock'
                ? 'bg-brand-blue text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Box size={14} />
            {t('navInventory', 'Stock Inbound')}
          </button>

          {isRestaurant && (
            <button
              type="button"
              onClick={() => setMode('restaurantInventory')}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                mode === 'restaurantInventory'
                  ? 'bg-brand-amber text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UtensilsCrossed size={14} />
              {t('kitchenInventory', 'Kitchen Stock')}
            </button>
          )}

          <button
            type="button"
            onClick={() => setMode('sales')}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
              mode === 'sales'
                ? 'bg-emerald-500 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ShoppingCart size={14} />
            {t('navSales', 'Sales Outbound')}
          </button>
        </div>
      </div>

      {error && <Alert type="error" message={error} onClose={() => setError(null)} />}

      {/* STAGE 1: UPLOAD */}
      {stage === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="flex min-h-[340px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-line bg-ink-900/60 p-8 text-center transition hover:border-brand-blue/50 hover:bg-ink-800/60"
            >
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-blue/15 text-brand-blue border border-brand-blue/30 shadow-glow">
                <UploadCloud size={32} />
              </div>
              <h3 className="text-base font-semibold text-white">
                {t('uploadInvoicePrompt', 'Drop invoice or receipt image here, or browse')}
              </h3>
              <p className="mt-1 text-xs text-slate-400 max-w-sm">
                {t('scannerHelp')}
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              <button
                type="button"
                className="mt-6 rounded-xl bg-brand-gradient px-4 py-2 text-xs font-semibold text-white shadow-glow"
              >
                {t('scanNow', 'Select Invoice File')}
              </button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-line bg-ink-900/80 p-6 backdrop-blur shadow-panel">
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-white">
                <Sparkles size={16} className="text-brand-violet" />
                {t('noCameraInvoice')}
              </div>
              <p className="text-xs leading-relaxed text-slate-400">
                {t('demoInvoiceDescription')}
              </p>
              <div className="rounded-xl border border-line bg-ink-800/60 p-3 space-y-1.5 text-xs text-slate-300">
                <div className="font-semibold text-white">{t('sampleDemoInvoice')}</div>
                <div>• 12x Fresh Milk 1L (135 DZD)</div>
                <div>• 30x Artisan Baguette (20 DZD)</div>
                <div>• 6x Olive Oil 750ml (950 DZD)</div>
                <div>• 10x Sugar 1kg (95 DZD)</div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleDemoScan}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-brand-violet/40 bg-brand-violet/15 py-2.5 text-xs font-semibold text-brand-violet hover:bg-brand-violet/25 transition"
            >
              <Sparkles size={14} />
              {t('tryDemoInvoice')}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 2: SCANNING PROGRESS */}
      {stage === 'scanning' && (
        <div className="flex min-h-[360px] flex-col items-center justify-center rounded-2xl border border-line bg-ink-900/80 p-8 text-center shadow-panel">
          <div className="relative mb-6">
            <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-brand-blue/20 text-brand-blue border border-brand-blue/40 shadow-glow animate-pulse">
              <ScanLine size={40} />
            </div>
          </div>

          <h2 className="text-xl font-bold text-white">{t('analyzingInvoice')}</h2>
          <p className="mt-2 text-sm font-medium text-brand-blue">
            {OCR_STAGES[ocrStageIndex]}
          </p>

          <div className="mt-6 w-full max-w-xs overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-2 rounded-full bg-brand-gradient transition-all duration-500"
              style={{ width: `${((ocrStageIndex + 1) / OCR_STAGES.length) * 100}%` }}
            />
          </div>

          <p className="mt-4 text-xs text-slate-500">
            {t('visionValidation')}
          </p>
        </div>
      )}

      {/* STAGE 3: MANDATORY HUMAN REVIEW GATE */}
      {stage === 'review' && (
        <div className="flex flex-col gap-6">
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-brand-blue/30 bg-brand-blue/10 p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 size={24} className="text-brand-blue shrink-0" />
              <div>
                <h3 className="text-sm font-bold text-white">
                  {t('extractedItemsReview')}
                </h3>
                <p className="text-xs text-slate-300">
                  {mode === 'sales'
                    ? 'Sales mode: match each line to an existing product to reduce stock and record sale.'
                    : mode === 'restaurantInventory'
                    ? 'Kitchen mode: items will update raw material quantities in kitchen stock.'
                    : 'Stock mode: items will be saved as new inventory products.'}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={addItemRow}
              className="flex items-center gap-1.5 rounded-xl border border-line bg-ink-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-ink-800"
            >
              <Plus size={14} />
              {t('addItem')}
            </button>
          </div>

          {/* Items Table */}
          <div className="overflow-hidden rounded-2xl border border-line bg-ink-900/80 shadow-panel backdrop-blur">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="border-b border-line bg-ink-800/70 text-xs font-semibold uppercase text-slate-400">
                  <tr>
                    <th className="px-4 py-3 min-w-[170px]">{t('itemName')}</th>
                    {mode === 'sales' && <th className="px-4 py-3 min-w-[200px]">{t('matchedProduct')}</th>}
                    <th className="px-4 py-3 w-20 text-center">{t('quantity')}</th>
                    <th className="px-4 py-3 w-36">
                      <div className="flex flex-col">
                        <span>{t('purchasePrice')}</span>
                        <span className="text-[10px] font-normal lowercase text-slate-400">
                          ({company?.currency || 'DZD'})
                        </span>
                      </div>
                    </th>
                    {mode !== 'restaurantInventory' && (
                      <th className="px-4 py-3 w-36">
                        <div className="flex flex-col">
                          <span className="text-white">{t('salePrice')}</span>
                          <span className="text-[10px] font-normal lowercase text-brand-blue">
                            ({company?.currency || 'DZD'})
                          </span>
                        </div>
                      </th>
                    )}
                    {mode !== 'restaurantInventory' && (
                      <th className="px-4 py-3 w-28 text-center">{t('unitProfit')}</th>
                    )}
                    {isPharmacy && mode !== 'sales' && <th className="px-4 py-3 w-36">{t('expiration')}</th>}
                    {isClothing && mode !== 'sales' && (
                      <>
                        <th className="px-4 py-3 w-24">{t('size')}</th>
                        <th className="px-4 py-3 w-24">{t('color')}</th>
                      </>
                    )}
                    <th className="px-4 py-3 text-right w-32">{t('subtotal')}</th>
                    <th className="px-4 py-3 text-center w-12">{t('action')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line/60">
                  {scannedItems.map((item, idx) => {
                    const pPrice = Number(item.purchasePrice) || 0;
                    const qty = Number(item.quantity) || 1;
                    const subtotal = qty * pPrice;
                    const hasSale =
                      item.salePrice !== '' &&
                      item.salePrice !== undefined &&
                      item.salePrice !== null &&
                      !isNaN(Number(item.salePrice));
                    const sPrice = hasSale ? Number(item.salePrice) : null;
                    const unitProfit = sPrice !== null ? sPrice - pPrice : null;
                    const marginPercent =
                      sPrice !== null && sPrice > 0 ? ((unitProfit / sPrice) * 100).toFixed(1) : null;
                    const isSellingBelowCost = sPrice !== null && sPrice < pPrice;

                    return (
                      <tr key={idx} className="hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-2.5">
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) => handleItemChange(idx, 'name', e.target.value)}
                            placeholder={t('productName')}
                            className="w-full rounded-lg border border-line bg-ink-950 px-2.5 py-1.5 text-sm text-white focus:border-brand-blue focus:outline-none"
                          />
                        </td>

                        {mode === 'sales' && (
                          <td className="px-4 py-2.5">
                            <select
                              value={item.matchedProductId || ''}
                              onChange={(e) =>
                                handleItemChange(idx, 'matchedProductId', e.target.value)
                              }
                              className="w-full rounded-lg border border-line bg-ink-950 px-2.5 py-1.5 text-xs text-white focus:border-brand-blue focus:outline-none"
                            >
                              <option value="">{t('matchExistingProduct')}</option>
                              {existingProducts.map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.name} ({t('stockLabelPrefix')} {p.quantity})
                                </option>
                              ))}
                            </select>
                          </td>
                        )}

                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                            className="w-full rounded-lg border border-line bg-ink-950 px-2.5 py-1.5 text-sm text-white text-center focus:border-brand-blue focus:outline-none"
                          />
                        </td>

                        {/* Purchase Price (AI extracted, editable) */}
                        <td className="px-4 py-2.5">
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            value={item.purchasePrice}
                            onChange={(e) =>
                              handleItemChange(idx, 'purchasePrice', e.target.value)
                            }
                            className="w-full rounded-lg border border-line bg-ink-950 px-2.5 py-1.5 text-sm text-white focus:border-brand-blue focus:outline-none"
                          />
                        </td>

                        {/* Sale Price (User manual entry, editable) */}
                        {mode !== 'restaurantInventory' && (
                          <td className="px-4 py-2.5">
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              value={item.salePrice ?? ''}
                              placeholder="0.00"
                              onChange={(e) =>
                                handleItemChange(idx, 'salePrice', e.target.value)
                              }
                              className={`w-full rounded-lg border px-2.5 py-1.5 text-sm text-white focus:outline-none ${
                                isSellingBelowCost
                                  ? 'border-amber-500/60 bg-amber-500/10 focus:border-amber-400'
                                  : 'border-line bg-ink-950 focus:border-brand-blue'
                              }`}
                            />
                            {isSellingBelowCost && (
                              <span className="mt-1 block text-[10px] text-amber-400 leading-tight">
                                {t('sellingBelowPurchaseWarning')}
                              </span>
                            )}
                          </td>
                        )}

                        {/* Unit Profit / Margin */}
                        {mode !== 'restaurantInventory' && (
                          <td className="px-4 py-2.5 text-center">
                            {unitProfit === null ? (
                              <span className="text-xs text-slate-500 italic">—</span>
                            ) : unitProfit >= 0 ? (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center rounded-md bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/20">
                                  +{unitProfit.toFixed(2)}
                                </span>
                                {marginPercent !== null && (
                                  <span className="mt-0.5 text-[10px] text-emerald-400/80">
                                    {marginPercent}%
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center">
                                <span className="inline-flex items-center rounded-md bg-rose-500/10 px-2 py-0.5 text-xs font-semibold text-rose-400 border border-rose-500/20">
                                  {unitProfit.toFixed(2)}
                                </span>
                                <span className="mt-0.5 text-[10px] text-rose-400/80">
                                  {t('loss', 'Loss')}
                                </span>
                              </div>
                            )}
                          </td>
                        )}

                        {isPharmacy && mode !== 'sales' && (
                          <td className="px-4 py-2.5">
                            <input
                              type="date"
                              value={item.expirationDate || ''}
                              onChange={(e) =>
                                handleItemChange(idx, 'expirationDate', e.target.value)
                              }
                              className="w-full rounded-lg border border-line bg-ink-950 px-2 py-1 text-xs text-white focus:border-brand-blue focus:outline-none"
                            />
                          </td>
                        )}

                        {isClothing && mode !== 'sales' && (
                          <>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                placeholder={t('exampleSizes')}
                                value={item.size || ''}
                                onChange={(e) => handleItemChange(idx, 'size', e.target.value)}
                                className="w-full rounded-lg border border-line bg-ink-950 px-2 py-1 text-xs text-white focus:border-brand-blue focus:outline-none"
                              />
                            </td>
                            <td className="px-4 py-2.5">
                              <input
                                type="text"
                                placeholder={t('color')}
                                value={item.color || ''}
                                onChange={(e) => handleItemChange(idx, 'color', e.target.value)}
                                className="w-full rounded-lg border border-line bg-ink-950 px-2 py-1 text-xs text-white focus:border-brand-blue focus:outline-none"
                              />
                            </td>
                          </>
                        )}

                        <td className="px-4 py-2.5 text-right font-medium text-white">
                          {subtotal.toLocaleString(document.documentElement.lang || undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}{' '}
                          <span className="text-xs text-slate-400">{company?.currency || 'DZD'}</span>
                        </td>

                        <td className="px-4 py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => removeItemRow(idx)}
                            className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
                            aria-label={t('removeItem')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Total Footer Summary */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-ink-800/40 p-4">
              <div className="text-sm text-slate-400">
                {t('totalLineItems')}: <span className="font-semibold text-white">{scannedItems.length}</span>
              </div>

              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <span className="text-xs text-slate-400 block">{t('totalPurchase', 'Total Purchase')}</span>
                  <span className="text-base font-bold text-white">
                    {totalPurchaseCost.toLocaleString(document.documentElement.lang || undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}{' '}
                    <span className="text-xs text-slate-400">{company?.currency || 'DZD'}</span>
                  </span>
                </div>

                {mode !== 'restaurantInventory' && (
                  <div>
                    <span className="text-xs text-slate-400 block">{t('totalSale', 'Total Sale Value')}</span>
                    <span className="text-base font-bold text-brand-blue">
                      {totalSaleValue.toLocaleString(document.documentElement.lang || undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs text-slate-400">{company?.currency || 'DZD'}</span>
                    </span>
                  </div>
                )}

                {mode !== 'restaurantInventory' && totalSaleValue > 0 && (
                  <div>
                    <span className="text-xs text-slate-400 block">{t('projectedProfit', 'Projected Profit')}</span>
                    <span
                      className={`text-base font-bold ${
                        projectedGrossProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {projectedGrossProfit >= 0 ? '+' : ''}
                      {projectedGrossProfit.toLocaleString(document.documentElement.lang || undefined, {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}{' '}
                      <span className="text-xs text-slate-400">{company?.currency || 'DZD'}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4">
            <button
              type="button"
              onClick={resetScanner}
              disabled={isSubmitting}
              className="rounded-xl border border-line bg-white/5 px-4 py-2.5 text-xs font-semibold text-slate-300 hover:bg-white/10"
            >
              {t('scanNow', 'Scan Another Invoice')}
            </button>

            <button
              type="button"
              onClick={handleConfirmSubmit}
              disabled={isSubmitting || scannedItems.length === 0}
              className="flex items-center gap-2 rounded-xl bg-brand-gradient px-6 py-2.5 text-sm font-bold text-white shadow-glow hover:opacity-95 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Spinner size="sm" />
                  {t('saving', 'Saving to Database...')}
                </>
              ) : (
                <>
                  <CheckCircle2 size={16} />
                  {t('confirmAndSave', 'Confirm & Write to Database')}
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STAGE 4: SUCCESS */}
      {stage === 'success' && (
        <div className="flex min-h-[320px] flex-col items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-8 text-center shadow-panel">
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <CheckCircle2 size={36} />
          </div>
          <h2 className="text-xl font-bold text-white">{t('invoiceSaved', 'Invoice Processed Successfully!')}</h2>
          <p className="mt-2 text-sm text-emerald-200">{successMessage}</p>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={resetScanner}
              className="rounded-xl border border-line bg-ink-900 px-4 py-2 text-xs font-semibold text-white hover:bg-ink-800"
            >
              {t('scanNow', 'Scan Another Invoice')}
            </button>
            <button
              type="button"
              onClick={() => navigate(mode === 'sales' ? '/sales' : mode === 'restaurantInventory' ? '/restaurant/inventory' : '/products')}
              className="rounded-xl bg-brand-gradient px-4 py-2 text-xs font-semibold text-white shadow-glow"
            >
              {t('navInventory', 'View Updated Inventory')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
