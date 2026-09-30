import { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Plus,
  Search,
  Barcode,
  Edit2,
  Trash2,
  AlertTriangle,
  X,
  Upload,
  Calendar,
  Sparkles,
  Tag,
  Check,
  Eye,
  DollarSign,
  TrendingUp,
  Building2,
  Truck,
} from 'lucide-react';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductByBarcode,
} from '../../api/products';
import { getSuppliers } from '../../api/suppliers';
import { uploadImage, getFullImageUrl } from '../../api/images';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function ProductsPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';
  const isPharmacy = company?.business_type === 'pharmacy';
  const isClothing = company?.business_type === 'clothing';

  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Detailed Product Modal
  const [viewProduct, setViewProduct] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    barcode: '',
    purchasePrice: '',
    sellingPrice: '',
    quantity: '',
    minimumStock: '5',
    supplierId: '',
    imageUrl: '',
    expirationDate: '',
    size: '',
    color: '',
    brand: '',
  });
  const [uploadingImage, setUploadingImage] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [prods, sups] = await Promise.all([
        getProducts({ search: search || undefined }),
        getSuppliers(),
      ]);
      setProducts(prods);
      setSuppliers(sups);
    } catch (err) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Barcode quick lookup
  async function handleBarcodeLookup(e) {
    e.preventDefault();
    if (!barcodeQuery.trim()) return;
    try {
      const match = await getProductByBarcode(barcodeQuery.trim());
      if (match) {
        openEditModal(match);
      } else {
        alert(`No product found with barcode "${barcodeQuery}".`);
      }
    } catch (err) {
      alert(`Barcode lookup error: ${err.message}`);
    }
  }

  function openCreateModal() {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: '',
      barcode: '',
      purchasePrice: '',
      sellingPrice: '',
      quantity: '0',
      minimumStock: '5',
      supplierId: '',
      imageUrl: '',
      expirationDate: '',
      size: '',
      color: '',
      brand: '',
    });
    setError('');
    setModalOpen(true);
  }

  function openEditModal(prod) {
    setEditingProduct(prod);
    setFormData({
      name: prod.name || '',
      category: prod.category || '',
      barcode: prod.barcode || '',
      purchasePrice: prod.purchase_price?.toString() || '',
      sellingPrice: prod.selling_price?.toString() || '',
      quantity: prod.quantity?.toString() || '0',
      minimumStock: prod.minimum_stock?.toString() || '5',
      supplierId: prod.supplier_id || '',
      imageUrl: prod.image_url || '',
      expirationDate: prod.expiration_date ? prod.expiration_date.split('T')[0] : '',
      size: prod.size || '',
      color: prod.color || '',
      brand: prod.brand || '',
    });
    setError('');
    setModalOpen(true);
  }

  async function handleImageUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const res = await uploadImage(file, 'products');
      setFormData((prev) => ({ ...prev, imageUrl: res.imageUrl || res.url || '' }));
    } catch (err) {
      alert(`Failed to upload photo: ${err.message}`);
    } finally {
      setUploadingImage(false);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.sellingPrice) {
      setError('Please provide product name and selling price.');
      return;
    }
    setSubmitting(true);
    setError('');

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim() || 'General',
      barcode: formData.barcode.trim() || undefined,
      purchasePrice: Number(formData.purchasePrice) || 0,
      sellingPrice: Number(formData.sellingPrice),
      quantity: Number(formData.quantity) || 0,
      minimumStock: Number(formData.minimumStock) || 5,
      supplierId: formData.supplierId || undefined,
      imageUrl: formData.imageUrl || undefined,
      expirationDate: formData.expirationDate || undefined,
      size: formData.size.trim() || undefined,
      color: formData.color.trim() || undefined,
      brand: formData.brand.trim() || undefined,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, payload);
      } else {
        await createProduct(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      setError(err.message || 'Failed to save product');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(prod) {
    if (!confirm(t('confirmDelete') || `Delete "${prod.name}" permanently?`)) return;
    try {
      await deleteProduct(prod.id);
      if (viewProduct && viewProduct.id === prod.id) {
        setViewProduct(null);
      }
      loadData();
    } catch (err) {
      alert(`Failed to delete product: ${err.message}`);
    }
  }

  // Categories list
  const categories = ['ALL', ...new Set(products.map((p) => p.category).filter(Boolean))];

  const filteredProducts = products.filter((p) => {
    if (selectedCategory !== 'ALL' && p.category !== selectedCategory) return false;
    return true;
  });

  const lowStockCount = products.filter((p) => p.quantity <= (p.minimum_stock ?? 5)).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <Package className="text-brand-blue" />
            {t('productsAndStock') || 'Products & Inventory'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {t('stock')}, {t('price')}, {t('barcode')}, {t('supplier')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} /> {t('addProductTitle') || 'Add Product'}
        </button>
      </div>

      {/* KPI Stats Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="panel p-4 border-line">
          <p className="text-xs text-slate-400">{t('total') + ' ' + (t('productsAndStock') || 'Products')}</p>
          <p className="text-2xl font-bold text-white mt-1">{products.length}</p>
        </div>
        <div className="panel p-4 border-line">
          <p className="text-xs text-slate-400">{t('lowStock') || 'Low Stock Alert'}</p>
          <p className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
            {lowStockCount} {t('itemCount')}
          </p>
        </div>
        <div className="panel p-4 border-line">
          <p className="text-xs text-slate-400">{t('category') || 'Categories'}</p>
          <p className="text-2xl font-bold text-brand-blue mt-1">
            {categories.filter((c) => c !== 'ALL').length}
          </p>
        </div>
      </div>

      {/* Search & Barcode Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('searchPlaceholder') || 'Search product name, category, barcode...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input-field pl-10 py-2.5 text-xs sm:text-sm"
          />
        </div>

        {/* Barcode scanner input */}
        <form onSubmit={handleBarcodeLookup} className="flex items-center gap-2">
          <div className="relative">
            <Barcode size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-blue" />
            <input
              type="text"
              placeholder={t('barcode') || 'Scan Barcode...'}
              value={barcodeQuery}
              onChange={(e) => setBarcodeQuery(e.target.value)}
              className="input-field pl-9 py-2.5 text-xs sm:text-sm w-44 font-mono"
            />
          </div>
          <button type="submit" className="btn-ghost py-2.5 px-3 text-xs font-semibold">
            {t('search') || 'Lookup'}
          </button>
        </form>
      </div>

      {/* Category Pills */}
      {categories.length > 2 ? (
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                selectedCategory === cat
                  ? 'bg-brand-blue text-white shadow-sm'
                  : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {cat === 'ALL' ? (t('all') || 'All') : cat}
            </button>
          ))}
        </div>
      ) : null}

      {/* Product List */}
      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner size={32} />
        </div>
      ) : filteredProducts.length === 0 ? (
        <EmptyState
          icon={Package}
          title={t('noData') || 'No products found'}
          description="Add your inventory items to enable POS sales and stock tracking."
          action={
            <button onClick={openCreateModal} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('addProductTitle') || 'Add First Product'}
            </button>
          }
        />
      ) : (
        <div className="panel border-line overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-ink-950 border-b border-line text-slate-400 uppercase text-[11px] font-semibold">
                <tr>
                  <th className="py-3 px-4">{t('productsAndStock') || 'Product'}</th>
                  <th className="py-3 px-4">{t('category')}</th>
                  <th className="py-3 px-4 font-mono">{t('purchasePrice')}</th>
                  <th className="py-3 px-4 font-mono">{t('sellingPrice')}</th>
                  <th className="py-3 px-4 text-center">{t('stock')}</th>
                  {isPharmacy && <th className="py-3 px-4">{t('expirationDate')}</th>}
                  {isClothing && <th className="py-3 px-4">{t('size')} / {t('color')}</th>}
                  <th className="py-3 px-4 text-right">{t('actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line text-slate-200">
                {filteredProducts.map((prod) => {
                  const isLow = prod.quantity <= (prod.minimum_stock ?? 5);
                  const isOut = prod.quantity <= 0;

                  return (
                    <tr key={prod.id} className="hover:bg-white/[0.02] transition">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div
                            onClick={() => setViewProduct(prod)}
                            className="h-10 w-10 rounded-xl bg-ink-900 border border-line overflow-hidden flex items-center justify-center shrink-0 cursor-pointer"
                          >
                            {prod.image_url ? (
                              <img
                                src={getFullImageUrl(prod.image_url)}
                                alt={prod.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Package size={18} className="text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span
                              onClick={() => setViewProduct(prod)}
                              className="font-semibold text-white hover:text-brand-blue cursor-pointer block"
                            >
                              {prod.name}
                            </span>
                            {prod.barcode ? (
                              <span className="text-[11px] font-mono text-slate-400">
                                {prod.barcode}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-4 text-slate-300">
                        <span className="px-2 py-0.5 rounded-md bg-white/5 border border-line text-[11px]">
                          {prod.category}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-mono text-slate-400">
                        {formatMoney(prod.purchase_price, currency)}
                      </td>

                      <td className="py-3 px-4 font-mono font-semibold text-emerald-400">
                        {formatMoney(prod.selling_price, currency)}
                      </td>

                      <td className="py-3 px-4 text-center">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            isOut
                              ? 'bg-red-500/20 text-red-300'
                              : isLow
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-emerald-500/10 text-emerald-400'
                          }`}
                        >
                          {prod.quantity}
                        </span>
                      </td>

                      {isPharmacy && (
                        <td className="py-3 px-4 text-xs font-mono text-slate-300">
                          {prod.expiration_date ? prod.expiration_date.split('T')[0] : '—'}
                        </td>
                      )}

                      {isClothing && (
                        <td className="py-3 px-4 text-xs text-slate-300">
                          {[prod.brand, prod.size, prod.color].filter(Boolean).join(' · ') || '—'}
                        </td>
                      )}

                      <td className="py-3 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Details */}
                          <button
                            type="button"
                            onClick={() => setViewProduct(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('viewDetails') || 'View Details'}
                          >
                            <Eye size={16} />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            onClick={() => openEditModal(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                            title={t('edit') || 'Edit Product'}
                          >
                            <Edit2 size={16} />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                            title={t('delete') || 'Delete Product'}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DETAILED PRODUCT PAGE / MODAL */}
      {viewProduct ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-brand-blue/20 flex items-center justify-center text-brand-blue border border-brand-blue/30">
                  <Package size={18} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {t('productDetails') || 'Product Details'}
                  </h3>
                  <p className="text-xs text-slate-400">{viewProduct.category} · {company?.name}</p>
                </div>
              </div>
              <button onClick={() => setViewProduct(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5 text-xs">
              {/* Product Image & Main Header */}
              <div className="flex items-center gap-4 bg-white/5 p-4 rounded-xl border border-line">
                <div className="h-20 w-20 rounded-xl bg-ink-950 border border-line overflow-hidden flex items-center justify-center shrink-0">
                  {viewProduct.image_url ? (
                    <img
                      src={getFullImageUrl(viewProduct.image_url)}
                      alt={viewProduct.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Package size={32} className="text-slate-500" />
                  )}
                </div>
                <div className="flex-1">
                  <h2 className="text-base font-bold text-white">{viewProduct.name}</h2>
                  {viewProduct.barcode && (
                    <p className="font-mono text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
                      <Barcode size={14} className="text-brand-blue" />
                      {viewProduct.barcode}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                        viewProduct.quantity <= 0
                          ? 'bg-red-500/20 text-red-300'
                          : viewProduct.quantity <= (viewProduct.minimum_stock ?? 5)
                          ? 'bg-amber-500/20 text-amber-300'
                          : 'bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {t('stock')}: {viewProduct.quantity}
                    </span>
                    <span className="text-slate-500 text-[11px]">
                      {t('minStock')}: {viewProduct.minimum_stock ?? 5}
                    </span>
                  </div>
                </div>
              </div>

              {/* Pricing & Margins Grid */}
              <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-white/5 border border-line text-center">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('purchasePrice')}</span>
                  <p className="font-mono font-bold text-slate-300 text-sm mt-1">
                    {formatMoney(viewProduct.purchase_price, currency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('sellingPrice')}</span>
                  <p className="font-mono font-bold text-emerald-400 text-sm mt-1">
                    {formatMoney(viewProduct.selling_price, currency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('profit')} {t('margin')}</span>
                  <p className="font-mono font-bold text-brand-blue text-sm mt-1">
                    {viewProduct.purchase_price > 0
                      ? `${(((viewProduct.selling_price - viewProduct.purchase_price) / viewProduct.purchase_price) * 100).toFixed(1)}%`
                      : '100%'}
                  </p>
                </div>
              </div>

              {/* Additional Attributes */}
              <div className="space-y-2 p-3.5 rounded-xl border border-line bg-ink-950">
                {viewProduct.supplier_id && (
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-400 flex items-center gap-1.5"><Truck size={13} /> {t('supplier')}:</span>
                    <span className="text-white font-medium">
                      {suppliers.find((s) => s.id === viewProduct.supplier_id)?.name || viewProduct.supplier_id}
                    </span>
                  </div>
                )}
                {isPharmacy && viewProduct.expiration_date && (
                  <div className="flex justify-between items-center py-1 border-t border-line/60">
                    <span className="text-slate-400">{t('expirationDate')}:</span>
                    <span className="text-amber-300 font-mono">{viewProduct.expiration_date.split('T')[0]}</span>
                  </div>
                )}
                {isClothing && (
                  <>
                    {viewProduct.size && (
                      <div className="flex justify-between items-center py-1 border-t border-line/60">
                        <span className="text-slate-400">{t('size')}:</span>
                        <span className="text-white font-medium">{viewProduct.size}</span>
                      </div>
                    )}
                    {viewProduct.color && (
                      <div className="flex justify-between items-center py-1 border-t border-line/60">
                        <span className="text-slate-400">{t('color')}:</span>
                        <span className="text-white font-medium">{viewProduct.color}</span>
                      </div>
                    )}
                    {viewProduct.brand && (
                      <div className="flex justify-between items-center py-1 border-t border-line/60">
                        <span className="text-slate-400">{t('brand')}:</span>
                        <span className="text-white font-medium">{viewProduct.brand}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    const p = viewProduct;
                    setViewProduct(null);
                    handleDelete(p);
                  }}
                  className="btn-ghost py-2 px-3 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> {t('delete')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const p = viewProduct;
                    setViewProduct(null);
                    openEditModal(p);
                  }}
                  className="btn-primary py-2 px-4 text-xs font-semibold flex items-center gap-1.5"
                >
                  <Edit2 size={14} /> {t('edit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Add / Edit Product Modal */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between border-b border-line pb-4 mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Package size={20} className="text-brand-blue" />
                {editingProduct ? (t('editProductTitle') || 'Edit Product') : (t('addProductTitle') || 'Add New Product')}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X size={18} />
              </button>
            </div>

            <Alert>{error}</Alert>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Product Photo Upload */}
              <div className="flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-dashed border-slate-600 bg-white/5 overflow-hidden shrink-0">
                  {formData.imageUrl ? (
                    <img
                      src={getFullImageUrl(formData.imageUrl)}
                      alt={t('uploadedPreview')}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <Upload size={20} className="text-slate-400" />
                  )}
                  {uploadingImage ? (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <Spinner size={16} />
                    </div>
                  ) : null}
                </div>
                <div>
                  <label className="btn-ghost py-1.5 px-3 text-xs font-semibold cursor-pointer inline-flex items-center gap-1.5">
                    <Upload size={14} />
                    {formData.imageUrl ? (t('changeImage') || 'Change Photo') : (t('selectImage') || 'Upload Photo')}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[11px] text-slate-400 mt-1">{t('imageFileLimit')}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('productsAndStock') || 'Product Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('category')} *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('barcode')}
                  </label>
                  <input
                    type="text"
                    value={formData.barcode}
                    onChange={(e) => setFormData({ ...formData, barcode: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('purchasePrice')} ({currency})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={formData.purchasePrice}
                    onChange={(e) => setFormData({ ...formData, purchasePrice: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('sellingPrice')} ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    value={formData.sellingPrice}
                    onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('quantity')} ({t('stock')})
                  </label>
                  <input
                    type="number"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('minStock')}
                  </label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                    {t('supplier')}
                  </label>
                  <select
                    value={formData.supplierId}
                    onChange={(e) => setFormData({ ...formData, supplierId: e.target.value })}
                    className="input-field py-2 text-sm"
                  >
                    <option value="">{t('noSupplierOption')}</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id} className="bg-ink-900 text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Vertical Specific Fields */}
                {isPharmacy && (
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                      {t('expirationDate')}
                    </label>
                    <input
                      type="date"
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="input-field py-2 text-sm"
                    />
                  </div>
                )}

                {isClothing && (
                  <>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        {t('size')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('sizeExampleValues')}
                        value={formData.size}
                        onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        {t('color')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('colorExampleValues')}
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1">
                        {t('brand')}
                      </label>
                      <input
                        type="text"
                        placeholder={t('brandExampleValues')}
                        value={formData.brand}
                        onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                        className="input-field py-2 text-sm"
                      />
                    </div>
                  </>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-ghost py-2 px-4 text-xs font-semibold"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary py-2 px-6 text-xs font-semibold"
                >
                  {submitting ? <Spinner size={16} /> : (t('save') || 'Save Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
