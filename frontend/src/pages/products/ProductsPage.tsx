import React, { useState, useEffect } from 'react';
import { api, formatCurrency } from '../../lib/api.js';
import { Product, ProductType } from '../../types/index.js';
import { useAuth } from '../../context/AuthContext.js';
import { Modal } from '../../components/common/Modal.js';
import { Plus, Package, Edit2, Trash2, Tag, AlertCircle } from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<ProductType>('SOFTWARE');
  const [salesPrice, setSalesPrice] = useState(2000); // in Rupees
  const [costPrice, setCostPrice] = useState(800);   // in Rupees
  const [notes, setNotes] = useState('');
  const [variants, setVariants] = useState<Array<{ attribute: string; value: string; extraPrice: number }>>([
    { attribute: 'Brand', value: 'Odoo Edition', extraPrice: 560 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { isAdmin } = useAuth();

  const fetchProducts = async () => {
    try {
      const res = await api.get('/catalog/products');
      setProducts(res.data.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCreate = () => {
    setEditingProduct(null);
    setName('');
    setType('SOFTWARE');
    setSalesPrice(2000);
    setCostPrice(800);
    setNotes('');
    setVariants([{ attribute: 'Brand', value: 'Odoo Edition', extraPrice: 560 }]);
    setError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setName(p.name);
    setType(p.type);
    setSalesPrice(p.salesPrice / 100);
    setCostPrice(p.costPrice / 100);
    setNotes(p.notes || '');
    setVariants(
      p.variants.map((v) => ({
        attribute: v.attribute,
        value: v.value,
        extraPrice: v.extraPrice / 100,
      }))
    );
    setError(null);
    setIsModalOpen(true);
  };

  const handleAddVariantRow = () => {
    setVariants([...variants, { attribute: 'Brand', value: '', extraPrice: 0 }]);
  };

  const handleRemoveVariantRow = (idx: number) => {
    setVariants(variants.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        name,
        type,
        salesPrice: Math.round(salesPrice * 100),
        costPrice: Math.round(costPrice * 100),
        notes,
        variants: variants.map((v) => ({
          attribute: v.attribute,
          value: v.value,
          extraPrice: Math.round(v.extraPrice * 100),
        })),
      };

      if (editingProduct) {
        await api.patch(`/catalog/products/${editingProduct.id}`, payload);
      } else {
        await api.post('/catalog/products', payload);
      }

      setIsModalOpen(false);
      fetchProducts();
    } catch (err: any) {
      setError(err.response?.data?.error?.message || 'Failed to save product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Stitch Context Banner */}
      <div className="bg-white rounded-card border border-slate-200/90 p-5 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded bg-primary/10 text-primary">
              Inventory & Items
            </span>
            <span className="text-xs text-slate-400 font-mono">Catalog • Multi-Variants</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 font-sans">
            Products & Variants Catalog
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage SaaS software, add-on modules, professional services, and variant pricing
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-primary hover:bg-primary-hover text-white rounded-lg text-xs font-semibold shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>New Product</span>
          </button>
        )}
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-card border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF8FF] border-b border-slate-200/80 uppercase font-semibold text-slate-500 text-[11px] tracking-wider">
              <tr>
                <th className="px-6 py-3.5">Product Name</th>
                <th className="px-6 py-3.5">Type</th>
                <th className="px-6 py-3.5">Base Sales Price</th>
                <th className="px-6 py-3.5">Cost Price</th>
                <th className="px-6 py-3.5">Variants</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-semibold text-slate-900">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary">
                        <Package className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-900 text-xs">{p.name}</span>
                        {p.notes && <p className="text-[11px] font-normal text-slate-400 mt-0.5">{p.notes}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      {p.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900 font-mono text-sm">
                    {formatCurrency(p.salesPrice)}
                  </td>
                  <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                    {formatCurrency(p.costPrice)}
                  </td>
                  <td className="px-6 py-4">
                    {p.variants?.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5">
                        {p.variants.map((v) => (
                          <span
                            key={v.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-medium border border-primary/20"
                          >
                            <Tag className="w-3 h-3" />
                            <span>{v.attribute}: {v.value} (+{formatCurrency(v.extraPrice)})</span>
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-slate-400 italic">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    {isAdmin && (
                      <button
                        onClick={() => handleOpenEdit(p)}
                        className="p-1.5 rounded text-slate-400 hover:text-primary hover:bg-slate-100 transition-colors cursor-pointer"
                        title="Edit Product"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingProduct ? 'Edit Catalog Product' : 'Add New Product'}
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Brightloop CRM Core"
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as ProductType)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              >
                <option value="SOFTWARE">SOFTWARE</option>
                <option value="SERVICE">SERVICE</option>
                <option value="ADDON">ADDON</option>
                <option value="PHYSICAL">PHYSICAL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Base Sales Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={salesPrice}
                onChange={(e) => setSalesPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cost Price (₹) *
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={costPrice}
                onChange={(e) => setCostPrice(parseFloat(e.target.value) || 0)}
                className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description / Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              placeholder="Operational details and inclusions..."
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
            />
          </div>

          {/* Variants Sub-Form (PRD §1, §6) */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-800">
                Product Variants (e.g. Brand: Odoo +₹560)
              </span>
              <button
                type="button"
                onClick={handleAddVariantRow}
                className="text-primary hover:text-primary-hover text-xs font-semibold cursor-pointer"
              >
                + Add Variant
              </button>
            </div>

            <div className="space-y-2">
              {variants.map((v, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Attribute (e.g. Brand)"
                    value={v.attribute}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].attribute = e.target.value;
                      setVariants(updated);
                    }}
                    className="w-1/3 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <input
                    type="text"
                    placeholder="Value (e.g. Odoo Edition)"
                    value={v.value}
                    onChange={(e) => {
                      const updated = [...variants];
                      updated[idx].value = e.target.value;
                      setVariants(updated);
                    }}
                    className="w-1/3 text-xs px-2.5 py-1.5 border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                  />
                  <div className="relative w-1/3">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-xs">
                      ₹
                    </span>
                    <input
                      type="number"
                      placeholder="Extra Price"
                      value={v.extraPrice}
                      onChange={(e) => {
                        const updated = [...variants];
                        updated[idx].extraPrice = parseFloat(e.target.value) || 0;
                        setVariants(updated);
                      }}
                      className="w-full pl-6 pr-2 py-1.5 text-xs border border-slate-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVariantRow(idx)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-white bg-primary hover:bg-primary-hover rounded-md shadow-sm disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? 'Saving...' : editingProduct ? 'Save Changes' : 'Create Product'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
