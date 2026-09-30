import { useState, useEffect, useCallback, useRef } from 'react';
import {
  ClipboardList,
  Plus,
  Edit2,
  Trash2,
  Upload,
  Check,
  X,
  Layers,
  UtensilsCrossed,
  Package,
  Eye,
  Image as ImageIcon,
} from 'lucide-react';
import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  setMenuItemAvailability,
  getMenuItemIngredients,
  setMenuItemIngredients,
  getRestaurantInventory,
} from '../../api/restaurant';
import { uploadImage, getFullImageUrl } from '../../api/images';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLanguage } from '../../context/LanguageContext.jsx';
import { formatMoney } from '../../utils/currency.js';
import Spinner from '../../components/ui/Spinner.jsx';
import EmptyState from '../../components/ui/EmptyState.jsx';
import Alert from '../../components/ui/Alert.jsx';

export default function RestaurantMenuPage() {
  const { company } = useAuth();
  const { t } = useLanguage();
  const currency = company?.currency || 'DZD';
  const fileInputRef = useRef(null);

  const [menuItems, setMenuItems] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Item Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Main Course',
    price: '',
    description: '',
    isAvailable: true,
    imageUrl: '',
  });

  // Recipe Modal
  const [recipeModalOpen, setRecipeModalOpen] = useState(false);
  const [selectedMenuItem, setSelectedMenuItem] = useState(null);
  const [recipeIngredients, setRecipeIngredients] = useState([]);
  const [loadingRecipe, setLoadingRecipe] = useState(false);
  const [savingRecipe, setSavingRecipe] = useState(false);

  // Detailed View Modal
  const [viewItem, setViewItem] = useState(null);
  const [viewItemIngredients, setViewItemIngredients] = useState([]);
  const [loadingViewIngredients, setLoadingViewIngredients] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [items, inv] = await Promise.all([getMenuItems(), getRestaurantInventory()]);
      setMenuItems(items);
      setInventoryItems(inv);
    } catch (err) {
      setError(err.message || 'Failed to load restaurant menu');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function openCreateModal() {
    setEditingItem(null);
    setFormData({
      name: '',
      category: 'Main Course',
      price: '',
      description: '',
      isAvailable: true,
      imageUrl: '',
    });
    setModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setFormData({
      name: item.name || '',
      category: item.category || 'Main Course',
      price: item.price?.toString() || '',
      description: item.description || '',
      isAvailable: item.is_available ?? item.isAvailable ?? true,
      imageUrl: item.image_url || item.imageUrl || '',
    });
    setModalOpen(true);
  }

  async function openDetailsModal(item) {
    setViewItem(item);
    setLoadingViewIngredients(true);
    try {
      const ings = await getMenuItemIngredients(item.id);
      setViewItemIngredients(ings || []);
    } catch {
      setViewItemIngredients([]);
    } finally {
      setLoadingViewIngredients(false);
    }
  }

  async function handleToggleAvailability(item) {
    const nextVal = !(item.is_available ?? item.isAvailable ?? true);
    try {
      await setMenuItemAvailability(item.id, nextVal);
      setMenuItems((prev) =>
        prev.map((m) => (m.id === item.id ? { ...m, is_available: nextVal, isAvailable: nextVal } : m))
      );
      if (viewItem && viewItem.id === item.id) {
        setViewItem({ ...viewItem, is_available: nextVal, isAvailable: nextVal });
      }
    } catch (err) {
      alert(`Could not toggle availability: ${err.message}`);
    }
  }

  async function handleImageFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const localPreview = URL.createObjectURL(file);
    setFormData((prev) => ({ ...prev, imageUrl: localPreview }));
    setUploadingImage(true);
    try {
      const uploaded = await uploadImage(file, 'restaurant-menu');
      setFormData((prev) => ({ ...prev, imageUrl: uploaded.imageUrl || uploaded.url || '' }));
    } catch (err) {
      alert(`Image upload failed: ${err.message}`);
      setFormData((prev) => ({ ...prev, imageUrl: editingItem ? (editingItem.image_url || editingItem.imageUrl || '') : '' }));
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim() || !formData.price || uploadingImage) return;
    setSubmitting(true);

    const cleanImageUrl = formData.imageUrl?.startsWith('blob:')
      ? (editingItem ? (editingItem.image_url || editingItem.imageUrl || '') : undefined)
      : formData.imageUrl;

    const payload = {
      name: formData.name.trim(),
      category: formData.category.trim(),
      price: Number(formData.price),
      description: formData.description.trim() || undefined,
      isAvailable: formData.isAvailable,
      imageUrl: cleanImageUrl !== undefined ? cleanImageUrl : undefined,
    };

    try {
      if (editingItem) {
        await updateMenuItem(editingItem.id, payload);
      } else {
        await createMenuItem(payload);
      }
      setModalOpen(false);
      loadData();
    } catch (err) {
      alert(`Save failed: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(item) {
    if (!confirm(t('confirmDelete') || `Delete "${item.name}" from the menu?`)) return;
    try {
      await deleteMenuItem(item.id);
      if (viewItem && viewItem.id === item.id) {
        setViewItem(null);
      }
      loadData();
    } catch (err) {
      alert(`Delete failed: ${err.message}`);
    }
  }

  async function openRecipe(item) {
    setSelectedMenuItem(item);
    setRecipeModalOpen(true);
    setLoadingRecipe(true);
    try {
      const ings = await getMenuItemIngredients(item.id);
      setRecipeIngredients(
        ings.map((i) => ({
          inventoryItemId: i.inventory_item_id || i.inventoryItemId,
          quantity: i.quantity_required ?? i.quantity ?? 1,
        }))
      );
    } catch (err) {
      alert(`Failed to load recipe ingredients: ${err.message}`);
    } finally {
      setLoadingRecipe(false);
    }
  }

  function addIngredientRow() {
    if (inventoryItems.length === 0) {
      alert(t('kitchenInventory') || 'Add kitchen inventory items first before creating a recipe.');
      return;
    }
    setRecipeIngredients([
      ...recipeIngredients,
      { inventoryItemId: inventoryItems[0].id, quantity: 1 },
    ]);
  }

  function removeIngredientRow(idx) {
    setRecipeIngredients(recipeIngredients.filter((_, i) => i !== idx));
  }

  async function handleSaveRecipe() {
    setSavingRecipe(true);
    try {
      await setMenuItemIngredients(selectedMenuItem.id, recipeIngredients);
      alert(t('save') + ': ' + t('recipeIngredients'));
      setRecipeModalOpen(false);
    } catch (err) {
      alert(`Failed to save recipe: ${err.message}`);
    } finally {
      setSavingRecipe(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2.5">
            <ClipboardList className="text-brand-blue" />
            {t('menuAndRecipes') || 'Menu Catalog & Recipes'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            {t('navDashboard')}: {t('addDish')}, {t('price')}, {t('recipeIngredients')}, {t('uploadImage')}
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="btn-primary self-start sm:self-auto py-2.5 px-4 text-sm font-semibold flex items-center gap-2 shadow-lg shadow-brand-blue/20"
        >
          <Plus size={18} /> {t('addDish') || 'Add Dish'}
        </button>
      </div>

      {error ? <div className="panel border-red-500/30 bg-red-500/10 p-4 text-sm text-red-300">{error}</div> : null}

      {/* Menu Grid */}
      {loading ? (
        <div className="flex justify-center py-20"><Spinner size={32} /></div>
      ) : menuItems.length === 0 ? (
        <EmptyState
          icon={UtensilsCrossed}
          title={t('noMenuItemsYetMessage') || 'No menu items registered'}
          description="Create your first delicious dish to make it available for customer ordering."
          action={
            <button onClick={openCreateModal} className="btn-primary mt-4 py-2 px-4 text-xs font-semibold">
              <Plus size={16} className="mr-1 inline" /> {t('addDish') || 'Add First Dish'}
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {menuItems.map((item) => {
            const isAvail = item.is_available ?? item.isAvailable ?? true;
            const imgUrl = item.image_url || item.imageUrl;

            return (
              <div
                key={item.id}
                className="panel p-4 flex flex-col justify-between border-line hover:border-slate-600 transition"
              >
                <div>
                  {/* Dish Image */}
                  <div
                    onClick={() => openDetailsModal(item)}
                    className="relative w-full h-36 rounded-xl bg-ink-950 border border-line mb-3 overflow-hidden flex items-center justify-center cursor-pointer group"
                  >
                    {imgUrl ? (
                      <img
                        src={getFullImageUrl(imgUrl)}
                        alt={item.name}
                        className="w-full h-full object-cover transition group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-slate-500">
                        <UtensilsCrossed size={28} />
                        <span className="text-[10px] mt-1">{t('uploadImage')}</span>
                      </div>
                    )}
                    <span
                      className={`absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        isAvail ? 'bg-emerald-500/90 text-white' : 'bg-red-500/90 text-white'
                      }`}
                    >
                      {isAvail ? (t('available') || 'Available') : (t('unavailable') || 'Out of Stock')}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3
                      onClick={() => openDetailsModal(item)}
                      className="font-bold text-white text-sm truncate cursor-pointer hover:text-brand-blue"
                    >
                      {item.name}
                    </h3>
                    <span className="font-mono font-bold text-sm text-emerald-400 shrink-0">
                      {formatMoney(item.price, currency)}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 capitalize mb-1">{item.category || 'Kitchen'}</p>
                  {item.description && (
                    <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed mb-3">{item.description}</p>
                  )}
                </div>

                <div className="pt-3 border-t border-line mt-2 space-y-2">
                  <div className="flex items-center gap-1.5">
                    {/* View Details */}
                    <button
                      type="button"
                      onClick={() => openDetailsModal(item)}
                      className="btn-ghost py-1 px-2 text-xs flex-1 text-slate-300 hover:text-white flex items-center justify-center gap-1"
                      title={t('viewDetails')}
                    >
                      <Eye size={13} /> {t('details')}
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => openEditModal(item)}
                      className="btn-ghost py-1 px-2 text-xs text-slate-300 hover:text-white"
                      title={t('edit')}
                    >
                      <Edit2 size={13} />
                    </button>

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => handleDelete(item)}
                      className="btn-ghost py-1 px-2 text-xs text-slate-300 hover:text-red-400"
                      title={t('delete')}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Availability Toggle */}
                    <button
                      type="button"
                      onClick={() => handleToggleAvailability(item)}
                      className={`py-1 px-2 rounded-lg text-[11px] font-semibold flex-1 border transition ${
                        isAvail
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                          : 'border-red-500/40 bg-red-500/10 text-red-400 hover:bg-red-500/20'
                      }`}
                    >
                      {isAvail ? t('available') : t('unavailable')}
                    </button>

                    {/* Recipe Linker */}
                    <button
                      type="button"
                      onClick={() => openRecipe(item)}
                      className="btn-ghost py-1 px-2 text-xs text-brand-blue flex items-center gap-1"
                      title={t('recipeIngredients')}
                    >
                      <Layers size={13} />
                      <span className="text-[11px] hidden sm:inline">{t('recipeIngredients') || 'Recipe'}</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DETAILED DISH VIEW MODAL */}
      {viewItem ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-brand-blue" />
                {t('details')}: {viewItem.name}
              </h3>
              <button onClick={() => setViewItem(null)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-4">
              {/* Image Banner */}
              <div className="w-full h-48 rounded-xl bg-ink-950 border border-line overflow-hidden flex items-center justify-center">
                {viewItem.image_url || viewItem.imageUrl ? (
                  <img
                    src={getFullImageUrl(viewItem.image_url || viewItem.imageUrl)}
                    alt={viewItem.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-slate-500">
                    <UtensilsCrossed size={36} />
                    <span className="text-xs mt-1">{t('noImageAttached')}</span>
                  </div>
                )}
              </div>

              {/* Information Row */}
              <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl bg-white/5 border border-line text-xs">
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('price')}:</span>
                  <p className="font-mono font-bold text-emerald-400 text-base mt-0.5">
                    {formatMoney(viewItem.price, currency)}
                  </p>
                </div>
                <div>
                  <span className="text-slate-400 uppercase text-[10px] font-semibold">{t('category')}:</span>
                  <p className="text-white font-semibold text-sm mt-0.5">{viewItem.category}</p>
                </div>
              </div>

              {viewItem.description && (
                <div>
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-1">{t('description')}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed bg-white/5 p-3 rounded-xl border border-line">
                    {viewItem.description}
                  </p>
                </div>
              )}

              {/* Recipe Ingredients linked */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Package size={14} className="text-brand-blue" />
                    {t('recipeIngredients') || 'Deducted Kitchen Ingredients'}
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setViewItem(null);
                      openRecipe(viewItem);
                    }}
                    className="text-xs text-brand-blue hover:underline"
                  >
                    {t('edit')}
                  </button>
                </div>

                {loadingViewIngredients ? (
                  <div className="flex justify-center py-4"><Spinner size={20} /></div>
                ) : viewItemIngredients.length === 0 ? (
                  <p className="text-xs text-slate-500 py-2">{t('noRecipeLinked')}</p>
                ) : (
                  <div className="space-y-1.5 rounded-xl border border-line p-2 bg-ink-950 text-xs">
                    {viewItemIngredients.map((ing, idx) => (
                      <div key={idx} className="flex justify-between items-center py-1 px-2 text-slate-300">
                        <span>{ing.inventory_item_name || ing.name || 'Ingredient'}</span>
                        <span className="font-mono text-brand-blue font-semibold">
                          {ing.quantity_required ?? ing.quantity} {ing.unit || 'unit'}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions Footer */}
              <div className="flex items-center justify-end gap-2 pt-4 border-t border-line">
                <button
                  type="button"
                  onClick={() => {
                    const it = viewItem;
                    setViewItem(null);
                    handleDelete(it);
                  }}
                  className="btn-ghost py-2 px-3 text-xs text-red-400 hover:bg-red-500/10 flex items-center gap-1.5"
                >
                  <Trash2 size={14} /> {t('delete')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const it = viewItem;
                    setViewItem(null);
                    openEditModal(it);
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

      {/* CREATE / EDIT DISH MODAL */}
      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-md rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UtensilsCrossed size={18} className="text-brand-blue" />
                {editingItem ? (t('edit') + ': ' + editingItem.name) : (t('addDish') || 'Add New Dish')}
              </h3>
              <button onClick={() => setModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Dish Image Picker & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1.5">
                  {t('uploadImage') || 'Dish Image'}
                </label>
                <div className="flex items-center gap-3">
                  <div className="h-16 w-16 rounded-xl border border-line bg-ink-950 overflow-hidden flex items-center justify-center shrink-0">
                    {formData.imageUrl ? (
                      <img
                        src={getFullImageUrl(formData.imageUrl)}
                        alt={t('preview')}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <ImageIcon size={22} className="text-slate-500" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileSelect}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={uploadingImage}
                      onClick={() => fileInputRef.current?.click()}
                      className="btn-ghost py-1.5 px-3 text-xs w-full flex items-center justify-center gap-1.5"
                    >
                      {uploadingImage ? <Spinner size={14} /> : <Upload size={14} />}
                      {formData.imageUrl ? (t('changeImage') || 'Change Image') : (t('selectImage') || 'Upload Photo')}
                    </button>
                    {formData.imageUrl && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: '' })}
                        className="text-[11px] text-red-400 hover:underline block"
                      >
                        {t('removeImage') || 'Remove Image'}
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('dishName') || 'Dish Name'} *
                </label>
                <input
                  type="text"
                  required
                  placeholder={t('exampleDishName')}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {t('category')} *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder={t('exampleDishCategory')}
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input-field py-2 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                    {t('price')} ({currency}) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    required
                    placeholder="0.00"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    className="input-field py-2 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                  {t('description')}
                </label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('ingredientsAndAllergens')}
                  className="input-field py-2 text-sm"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl border border-line bg-white/5 text-xs">
                <span className="font-semibold text-slate-300">{t('available') || 'Available for Ordering'}</span>
                <input
                  type="checkbox"
                  checked={formData.isAvailable}
                  onChange={(e) => setFormData({ ...formData, isAvailable: e.target.checked })}
                  className="h-4 w-4 rounded border-line bg-ink-950 text-brand-blue"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-line">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-ghost py-2 px-4 text-xs font-semibold">
                  {t('cancel')}
                </button>
                <button type="submit" disabled={submitting || uploadingImage} className="btn-primary py-2 px-5 text-xs font-semibold">
                  {submitting || uploadingImage ? <Spinner size={16} /> : (t('save') || 'Save Dish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {/* Recipe Ingredients Modal */}
      {recipeModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-line bg-ink-900 p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-line pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers size={18} className="text-brand-blue" />
                  {t('recipeIngredients')} — {selectedMenuItem?.name}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {t('autoDeductInventory')}
                </p>
              </div>
              <button onClick={() => setRecipeModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            {loadingRecipe ? (
              <div className="flex justify-center py-10"><Spinner size={24} /></div>
            ) : (
              <div className="space-y-4">
                {recipeIngredients.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">{t('noIngredientsLinked')}</p>
                ) : (
                  <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                    {recipeIngredients.map((row, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-white/5 p-2 rounded-xl border border-line">
                        <select
                          value={row.inventoryItemId}
                          onChange={(e) => {
                            const val = e.target.value;
                            setRecipeIngredients(
                              recipeIngredients.map((r, i) => (i === idx ? { ...r, inventoryItemId: val } : r))
                            );
                          }}
                          className="input-field py-1.5 text-xs flex-1"
                        >
                          {inventoryItems.map((inv) => (
                            <option key={inv.id} value={inv.id} className="bg-ink-900 text-white">
                              {inv.name} ({inv.unit || 'unit'})
                            </option>
                          ))}
                        </select>
                        <input
                          type="number"
                          step="any"
                          value={row.quantity}
                          onChange={(e) => {
                            const val = Number(e.target.value) || 0;
                            setRecipeIngredients(
                              recipeIngredients.map((r, i) => (i === idx ? { ...r, quantity: val } : r))
                            );
                          }}
                          className="input-field py-1.5 text-xs w-20 font-mono text-center"
                          placeholder={t('qty')}
                        />
                        <button
                          type="button"
                          onClick={() => removeIngredientRow(idx)}
                          className="p-1 text-slate-400 hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-line">
                  <button
                    type="button"
                    onClick={addIngredientRow}
                    className="btn-ghost py-1.5 px-3 text-xs flex items-center gap-1.5 text-brand-blue"
                  >
                    <Plus size={14} /> {t('addIngredient')}
                  </button>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setRecipeModalOpen(false)}
                      className="btn-ghost py-1.5 px-3 text-xs"
                    >
                      {t('cancel')}
                    </button>
                    <button
                      type="button"
                      disabled={savingRecipe}
                      onClick={handleSaveRecipe}
                      className="btn-primary py-1.5 px-4 text-xs font-semibold"
                    >
                      {savingRecipe ? <Spinner size={14} /> : (t('save') || 'Save Recipe')}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
