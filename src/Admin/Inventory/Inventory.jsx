import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaEdit, FaTrash, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import Modal from 'react-modal';

Modal.setAppElement('#root');

export default function Inventory() {
  const [productTypes, setProductTypes] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState('');
  const [selectedType, setSelectedType] = useState('');
  
  const [newProductType, setNewProductType] = useState('');
  const [newBrand, setNewBrand] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  
  const [form, setForm] = useState({ productName: '', price: '', perCase: '' });

  const [brandSearch, setBrandSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState({ id: '', name: '', agent_name: '' });

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const brandsPerPage = 10;

  // NEW: Collapsible states (closed by default)
  const [isBrandSectionOpen, setIsBrandSectionOpen] = useState(false);
  const [isTypeSectionOpen, setIsTypeSectionOpen] = useState(false);

  // Fetch Data
  const fetchData = async () => {
    try {
      const [typeRes, brandRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/product-types`),
        fetch(`${API_BASE_URL}/api/brands`)
      ]);
      const types = await typeRes.json();
      const brandData = await brandRes.json();
      
      setProductTypes(types.map(t => t.product_type).filter(Boolean));
      setBrands(brandData.map(b => ({ id: b.id, name: b.name, agent_name: b.agent_name || '' })));
    } catch (err) {
      setError('Failed to load data');
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 180000);
    return () => clearInterval(interval);
  }, []);

  // Create Product Type
  const handleCreateProductType = async () => {
    if (!newProductType.trim()) return setError('Product type required');
    const formatted = newProductType.toLowerCase().trim().replace(/\s+/g, '_');
    if (productTypes.includes(formatted)) return setError('Already exists');

    try {
      await fetch(`${API_BASE_URL}/api/product-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: formatted })
      });
      setNewProductType('');
      setSuccess('Product type created!');
      setIsTypeSectionOpen(false); // Close after success
      fetchData();
    } catch (err) {
      setError('Failed to create type');
    }
  };

  // Create Brand
  const handleCreateBrand = async () => {
    if (!newBrand.trim()) return setError('Brand name required');
    const formatted = newBrand.toLowerCase().trim().replace(/\s+/g, '_');
    if (brands.some(b => b.name === formatted)) return setError('Brand exists');

    try {
      await fetch(`${API_BASE_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formatted, agent_name: newAgentName.trim() || null })
      });
      setNewBrand(''); 
      setNewAgentName('');
      setSuccess('Brand created!');
      setIsBrandSectionOpen(false); // Close after success
      fetchData();
    } catch (err) {
      setError('Failed to create brand');
    }
  };

  // Save Product
  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!selectedBrand || !selectedType || !form.productName || !form.price || !form.perCase) {
      return setError('All fields are required');
    }

    const payload = {
      productname: form.productName.trim(),
      product_type: selectedType,
      price: parseFloat(form.price),
      per_case: parseInt(form.perCase),
      brand: selectedBrand
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Failed');
      setSuccess('Product saved successfully!');
      setForm({ productName: '', price: '', perCase: '' });
      setSelectedType('');
    } catch (err) {
      setError('Failed to save product');
    }
  };

  // Edit & Delete Brand
  const handleUpdateBrand = async () => {
    const formatted = editingBrand.name.toLowerCase().trim().replace(/\s+/g, '_');
    try {
      await fetch(`${API_BASE_URL}/api/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formatted, agent_name: editingBrand.agent_name || null })
      });
      setEditModalOpen(false);
      setSuccess('Brand updated');
      fetchData();
    } catch (err) {
      setError('Update failed');
    }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete this brand and all products?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/brands/${id}`, { method: 'DELETE' });
      setSuccess('Brand deleted');
      fetchData();
    } catch (err) {
      setError('Delete failed');
    }
  };

  const formatDisplay = (str) => str
    ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
    (b.agent_name && b.agent_name.toLowerCase().includes(brandSearch.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
  const paginated = filteredBrands.slice((currentPage - 1) * brandsPerPage, currentPage * brandsPerPage);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 mobile:p-3 pt-16 mobile:pt-14 md:p-8 md:ml-64">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-3xl mobile:text-2xl font-bold text-center mb-8 text-black dark:text-white">
            Inventory Management
          </h1>

          {error && <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 rounded-lg text-center font-medium text-sm mobile:text-xs">{error}</div>}
          {success && <div className="mb-4 p-4 bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 rounded-lg text-center font-medium text-sm mobile:text-xs">{success}</div>}

          {/* COLLAPSIBLE: Add New Brand */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-6 overflow-hidden">
            <button
              onClick={() => setIsBrandSectionOpen(prev => !prev)}
              className="w-full p-5 mobile:p-4 flex justify-between items-center text-left font-bold text-lg mobile:text-base bg-gradient-to-r from-indigo-600 to-purple-700 text-white"
            >
              Add New Brand
              {isBrandSectionOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isBrandSectionOpen && (
              <div className="p-6 mobile:p-5 space-y-4">
                <input
                  type="text"
                  value={newBrand}
                  onChange={e => setNewBrand(e.target.value)}
                  placeholder="Brand name"
                  className="w-full px-4 py-3 mobile:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
                <input
                  type="text"
                  value={newAgentName}
                  onChange={e => setNewAgentName(e.target.value)}
                  placeholder="Agent (optional)"
                  className="w-full px-4 py-3 mobile:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                />
                <button onClick={handleCreateBrand} className="w-full py-3 mobile:py-2.5 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white rounded-lg font-medium transition shadow">
                  Save Brand
                </button>
              </div>
            )}
          </div>

          {/* COLLAPSIBLE: Add Product Type */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-10 overflow-hidden">
            <button
              onClick={() => setIsTypeSectionOpen(prev => !prev)}
              className="w-full p-5 mobile:p-4 flex justify-between items-center text-left font-bold text-lg mobile:text-base bg-gradient-to-r from-teal-600 to-cyan-700 text-white"
            >
              Add Product Type
              {isTypeSectionOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isTypeSectionOpen && (
              <div className="p-6 mobile:p-5">
                <div className="flex mobile:flex-col gap-3">
                  <input
                    type="text"
                    value={newProductType}
                    onChange={e => setNewProductType(e.target.value)}
                    placeholder="e.g. multi_shot, fancy"
                    className="flex-1 px-4 py-3 mobile:py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white"
                  />
                  <button onClick={handleCreateProductType} className="px-6 mobile:w-full py-3 mobile:py-2.5 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-700 hover:to-cyan-800 text-white rounded-lg flex items-center justify-center gap-2 transition font-medium shadow">
                    <FaPlus /> Add Type
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* STEP 1: SELECT BRAND FIRST */}
          <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg mb-8">
            <label className="block text-lg mobile:text-base font-bold mb-4 text-black dark:text-white">
              Step 1: Select Brand
            </label>
            <select
              value={selectedBrand}
              onChange={e => {
                setSelectedBrand(e.target.value);
                setSelectedType(''); 
                setForm({ productName: '', price: '', perCase: '' });
              }}
              className="w-full px-5 py-4 mobile:py-3 rounded-lg border-2 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white text-lg mobile:text-base focus:border-blue-500 outline-none"
            >
              <option value="">Choose a brand...</option>
              {brands.map(b => (
                <option key={b.id} value={b.name}>
                  {formatDisplay(b.name)} {b.agent_name && `(${b.agent_name})`}
                </option>
              ))}
            </select>
          </div>

          {/* STEP 2: SELECT PRODUCT TYPE */}
          {selectedBrand && (
            <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg mb-8">
              <label className="block text-lg mobile:text-base font-bold mb-4 text-black dark:text-white">
                Step 2: Select Product Type
              </label>
              <select
                value={selectedType}
                onChange={e => setSelectedType(e.target.value)}
                className="w-full px-5 py-4 mobile:py-3 rounded-lg border-2 border-blue-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white text-lg mobile:text-base focus:border-blue-500 outline-none"
              >
                <option value="">Choose type...</option>
                {productTypes.map(t => (
                  <option key={t} value={t}>{formatDisplay(t)}</option>
                ))}
              </select>
            </div>
          )}

          {/* STEP 3: PRODUCT FORM */}
          {selectedBrand && selectedType && (
            <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg mb-10">
              <h3 className="text-xl mobile:text-lg font-bold mb-6 text-blue-600 dark:text-blue-400">
                Add Product → {formatDisplay(selectedType)} ({formatDisplay(selectedBrand)})
              </h3>
              <form onSubmit={handleSaveProduct} className="grid grid-cols-1 mobile:grid-cols-1 md:grid-cols-2 gap-6 mobile:gap-5">
                <input
                  type="text"
                  placeholder="Product Name * (e.g. 30 SHOT)"
                  value={form.productName}
                  onChange={e => setForm({ ...form, productName: e.target.value })}
                  className="px-5 py-4 mobile:py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white text-lg mobile:text-base"
                  required
                />
                <input
                  type="number"
                  placeholder="Price per Box (₹) *"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="px-5 py-4 mobile:py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white text-lg mobile:text-base"
                  min="0"
                  step="0.01"
                  required
                />
                <input
                  type="number"
                  placeholder="Qty per Case *"
                  value={form.perCase}
                  onChange={e => setForm({ ...form, perCase: e.target.value })}
                  className="px-5 py-4 mobile:py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white text-lg mobile:text-base"
                  min="1"
                  required
                />
                <div className="md:col-span-2 flex flex-col mobile:flex-col gap-4">
                  <button type="button" onClick={() => {
                    setSelectedType('');
                    setForm({ productName: '', price: '', perCase: '' });
                  }} className="px-6 py-3 mobile:py-2.5 border border-gray-400 dark:border-gray-600 rounded-lg text-black dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition text-base mobile:text-sm">
                    Back to Types
                  </button>
                  <button type="submit" className="px-8 py-4 mobile:py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-lg mobile:text-base transition">
                    Save Product
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* ALL BRANDS GRID */}
          <div className="bg-white dark:bg-gray-800 p-8 mobile:p-6 rounded-xl shadow-lg">
            <h3 className="text-2xl mobile:text-xl font-bold mb-6 text-black dark:text-white">All Brands</h3>
            <input
              type="text"
              placeholder="Search brand or agent..."
              value={brandSearch}
              onChange={e => { setBrandSearch(e.target.value); setCurrentPage(1); }}
              className="w-full mb-6 px-5 py-4 mobile:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white"
            />
            <div className="grid grid-cols-1 mobile:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mobile:gap-4">
              {paginated.map(b => (
                <div key={b.id} className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-gray-700 dark:to-gray-800 p-5 mobile:p-4 rounded-xl shadow border border-blue-200 dark:border-gray-600">
                  <div className="flex justify-between items-start mb-3">
                    <h4 className="font-bold text-base mobile:text-sm text-black dark:text-white">{formatDisplay(b.name)}</h4>
                    <div className="flex gap-2">
                      <button onClick={() => { setEditingBrand(b); setEditModalOpen(true); }} className="text-blue-600 hover:text-blue-800">
                        <FaEdit size={18} />
                      </button>
                      <button onClick={() => handleDeleteBrand(b.id)} className="text-red-600 hover:text-red-800">
                        <FaTrash size={18} />
                      </button>
                    </div>
                  </div>
                  {b.agent_name && <p className="text-sm mobile:text-xs text-black dark:text-white opacity-80">Agent: {b.agent_name}</p>}
                </div>
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex justify-center gap-4 flex-wrap">
                <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="px-5 mobile:px-4 py-2.5 mobile:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm mobile:text-xs transition">
                  Previous
                </button>
                <span className="py-2.5 px-5 text-base mobile:text-sm font-medium text-black dark:text-white">
                  Page {currentPage} / {totalPages}
                </span>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="px-5 mobile:px-4 py-2.5 mobile:py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg text-sm mobile:text-xs transition">
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Brand Modal */}
      <Modal isOpen={editModalOpen} onRequestClose={() => setEditModalOpen(false)}
        className="bg-white dark:bg-gray-800 rounded-xl p-8 mobile:p-6 max-w-md mx-4 shadow-2xl"
        overlayClassName="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
        <h3 className="text-2xl mobile:text-xl font-bold mb-6 text-black dark:text-white">Edit Brand</h3>
        <input
          type="text"
          value={formatDisplay(editingBrand.name || '')}
          onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
          className="w-full px-5 py-4 mobile:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white mb-4"
        />
        <input
          type="text"
          value={editingBrand.agent_name || ''}
          onChange={e => setEditingBrand({ ...editingBrand, agent_name: e.target.value })}
          placeholder="Agent name"
          className="w-full px-5 py-4 mobile:py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-black dark:text-white mb-6"
        />
        <div className="flex justify-end gap-4 mobile:flex-col">
          <button onClick={() => setEditModalOpen(false)} className="px-6 mobile:px-5 py-3 mobile:py-2.5 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition">
            Cancel
          </button>
          <button onClick={handleUpdateBrand} className="px-6 mobile:px-5 py-3 mobile:py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold transition">
            Update Brand
          </button>
        </div>
      </Modal>
    </div>
  );
}