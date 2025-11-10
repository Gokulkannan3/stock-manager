import React, { useState, useEffect } from 'react';
import { FiLogOut } from 'react-icons/fi';
import Sidebar from '../Sidebar/Sidebar';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa';
import Logout from '../Logout';
import Modal from 'react-modal';

Modal.setAppElement('#root');

export default function Inventory() {
  const [focused, setFocused] = useState({});
  const [values, setValues] = useState({ productName: '', price: '', perCase: '', brand: '' }); // Removed caseCount
  const [productType, setProductType] = useState('');
  const [newProductType, setNewProductType] = useState('');
  const [productTypes, setProductTypes] = useState([]);
  const [newBrand, setNewBrand] = useState('');
  const [newAgentName, setNewAgentName] = useState('');
  const [brands, setBrands] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Brand cards
  const [brandSearch, setBrandSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const brandsPerPage = 10;

  // Edit modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState({ id: '', name: '', agent_name: '' });

  const styles = {
    input: { 
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", 
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)", 
      border: "1px solid rgba(2,132,199,0.3)", 
      borderDark: "1px solid rgba(59,130,246,0.4)"
    },
    button: { 
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", 
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)", 
      border: "1px solid rgba(125,211,252,0.4)", 
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)"
    }
  };

  const fetchProductTypes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/product-types`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed');
      const validTypes = data
        .filter(item => item && item.product_type && typeof item.product_type === 'string')
        .map(item => item.product_type);
      setProductTypes(validTypes);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchBrands = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/brands`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed');
      setBrands(data.map(b => ({ id: b.id, name: b.name, agent_name: b.agent_name || '' })));
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchProductTypes();
    fetchBrands();
    const intervalId = setInterval(() => {
      fetchProductTypes();
      fetchBrands();
    }, 180000);
    return () => clearInterval(intervalId);
  }, []);

  const handleFocus = (id) => setFocused(prev => ({ ...prev, [id]: true }));
  const handleBlur = (id) => setFocused(prev => ({ ...prev, [id]: values[id] !== '' }));
  const handleChange = (id, e) => setValues(prev => ({ ...prev, [id]: e.target.value }));

  const handleProductTypeChange = (e) => {
    setProductType(e.target.value);
    setValues({ productName: '', price: '', perCase: '', brand: '' });
    setError(''); setSuccess('');
  };

  const handleCreateBrand = async () => {
    if (!newBrand) return setError('Brand name is required');
    const formatted = newBrand.toLowerCase().replace(/\s+/g, '_');
    if (brands.some(b => b.name === formatted)) return setError('Brand already exists');

    try {
      const res = await fetch(`${API_BASE_URL}/api/brands`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formatted, agent_name: newAgentName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchBrands();
      setNewBrand(''); setNewAgentName(''); setSuccess('Brand created!');
    } catch (err) { setError(err.message); }
  };

  const handleCreateProductType = async () => {
    if (!newProductType) return setError('Product type is required');
    const formatted = newProductType.toLowerCase().replace(/\s+/g, '_');
    if (productTypes.includes(formatted)) return setError('Product type exists');

    try {
      const res = await fetch(`${API_BASE_URL}/api/product-types`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ product_type: formatted }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      fetchProductTypes();
      setNewProductType(''); setSuccess('Product type created!');
    } catch (err) { setError(err.message); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!values.productName || !values.price || !values.perCase || !values.brand || !productType)
      return setError('All fields required');

    const payload = {
      productname: values.productName,
      price: values.price,
      per_case: values.perCase,
      brand: values.brand,
      product_type: productType,
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setSuccess('Product saved!');
      setValues({ productName: '', price: '', perCase: '', brand: '' });
    } catch (err) { setError(err.message); }
  };

  const handleEditBrand = (brand) => {
    setEditingBrand(brand);
    setEditModalOpen(true);
  };

  const handleUpdateBrand = async () => {
    const formatted = editingBrand.name.toLowerCase().replace(/\s+/g, '_');
    try {
      const res = await fetch(`${API_BASE_URL}/api/brands/${editingBrand.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: formatted, agent_name: editingBrand.agent_name }),
      });
      if (!res.ok) throw new Error('Failed to update');
      fetchBrands();
      setEditModalOpen(false);
      setSuccess('Brand updated!');
    } catch (err) { setError(err.message); }
  };

  const handleDeleteBrand = async (id) => {
    if (!window.confirm('Delete this brand?')) return;
    try {
      await fetch(`${API_BASE_URL}/api/brands/${id}`, { method: 'DELETE' });
      fetchBrands();
      setSuccess('Brand deleted!');
    } catch (err) { setError(err.message); }
  };

  const formatDisplay = (str) => str
    ? str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
    : '';

  const filteredBrands = brands.filter(b =>
    b.name.toLowerCase().includes(brandSearch.toLowerCase()) ||
    (b.agent_name && b.agent_name.toLowerCase().includes(brandSearch.toLowerCase()))
  );

  const totalPages = Math.ceil(filteredBrands.length / brandsPerPage);
  const paginatedBrands = filteredBrands.slice(
    (currentPage - 1) * brandsPerPage,
    currentPage * brandsPerPage
  );

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-6 mobile:p-4 pt-16 mobile:pt-14">
        <div className="max-w-4xl mx-auto">
          {/* PAGE TITLE */}
          <h2 className="text-3xl mobile:text-2xl text-center font-bold text-gray-900 dark:text-gray-100 mb-6 mobile:mb-4">Add Items</h2>
          
          {error && <div className="mb-5 mobile:mb-4 text-red-600 dark:text-red-400 text-base mobile:text-sm text-center font-medium">{error}</div>}
          {success && <div className="mb-5 mobile:mb-4 text-green-600 dark:text-green-400 text-base mobile:text-sm text-center font-medium">{success}</div>}

          <div className="space-y-10 mobile:space-y-8">

            {/* === SELECT PRODUCT TYPE (TOP) === */}
            <div>
              <label className="block text-base mobile:text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Select Product Type</label>
              <select
                value={productType}
                onChange={handleProductTypeChange}
                className="w-full rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
              >
                <option value="">Select Type</option>
                {productTypes.map(t => (
                  <option key={t} value={t} className="text-base">{formatDisplay(t)}</option>
                ))}
              </select>
            </div>

            {/* === PRODUCT FORM (TOP) === */}
            {productType && (
              <form onSubmit={handleSubmit} className="space-y-8 mobile:space-y-6 border-b border-gray-900/10 dark:border-gray-700 pb-10 mobile:pb-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mobile:gap-5">
                  {['productName', 'price', 'perCase'].map(field => (
                    <div key={field}>
                      <label className="block text-base mobile:text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">
                        {field === 'productName' ? 'Product Name*' : field === 'price' ? 'Price (INR)*' : 'Quantity / case'}
                      </label>
                      <input
                        type={field.includes('price') ? 'number' : field.includes('Case') ? 'number' : 'text'}
                        value={values[field] || ''}
                        onChange={e => handleChange(field, e)}
                        onFocus={() => handleFocus(field)}
                        onBlur={() => handleBlur(field)}
                        min="0"
                        step={field === 'price' ? '0.01' : '1'}
                        required
                        className="w-full rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                        style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-base mobile:text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Brand*</label>
                    <select
                      value={values.brand || ''}
                      onChange={e => handleChange('brand', e)}
                      required
                      className="w-full rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                      style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                    >
                      <option value="">Select Brand</option>
                      {brands.map(b => (
                        <option key={b.id} value={b.name} className="text-base">{formatDisplay(b.name)}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-4 mobile:gap-3">
                  <button type="button" onClick={() => { setValues({ productName: '', price: '', perCase: '', brand: '' }); setProductType(''); }} className="text-base mobile:text-sm font-medium text-gray-900 dark:text-gray-100">
                    Cancel
                  </button>
                  <button type="submit" className="rounded-lg px-6 mobile:px-4 py-3 mobile:py-2.5 text-base mobile:text-sm font-semibold text-white shadow-md"
                    style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}>
                    Save Product
                  </button>
                </div>
              </form>
            )}

            {/* === CREATE BRAND & PRODUCT TYPE (BELOW) === */}
            <div className="border-b border-gray-900/10 dark:border-gray-700 pb-10 mobile:pb-8">
              <div className="grid grid-cols-1 gap-8 mobile:gap-6">

                {/* Create New Brand */}
                <div>
                  <label className="block text-base mobile:text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Create New Brand</label>
                  <div className="flex flex-col sm:flex-row gap-4 mobile:gap-3">
                    <input
                      type="text"
                      value={newBrand}
                      onChange={e => setNewBrand(e.target.value)}
                      placeholder="Brand name"
                      className="flex-1 rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600 placeholder:text-gray-500 dark:placeholder:text-gray-400"
                      style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                    />
                    <input
                      type="text"
                      value={newAgentName}
                      onChange={e => setNewAgentName(e.target.value)}
                      placeholder="Agent name"
                      className="flex-1 rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                      style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                    />
                    <button
                      onClick={handleCreateBrand}
                      className="w-full sm:w-auto rounded-lg px-6 mobile:px-4 py-3 mobile:py-2.5 text-base mobile:text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-md"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      <FaPlus className="h-5 w-5 mobile:h-4 mobile:w-4" /> Add Brand
                    </button>
                  </div>
                </div>

                {/* Create New Product Type */}
                <div>
                  <label className="block text-base mobile:text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Create New Product Type</label>
                  <div className="flex gap-4 mobile:gap-3">
                    <input
                      type="text"
                      value={newProductType}
                      onChange={e => setNewProductType(e.target.value)}
                      placeholder="Product type"
                      className="flex-1 rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                      style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
                    />
                    <button
                      onClick={handleCreateProductType}
                      className="rounded-lg px-6 mobile:px-4 py-3 mobile:py-2.5 text-base mobile:text-sm font-semibold text-white flex items-center justify-center gap-2 shadow-md"
                      style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
                    >
                      <FaPlus className="h-5 w-5 mobile:h-4 mobile:w-4" /> Add Type
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* === BRAND CARDS (BOTTOM) === */}
            <div className="mt-12 mobile:mt-10">
              <h3 className="text-2xl mobile:text-xl font-bold mb-5 mobile:mb-4 text-gray-900 dark:text-gray-100">All Brands</h3>
              <input
                type="text"
                value={brandSearch}
                onChange={e => { setBrandSearch(e.target.value); setCurrentPage(1); }}
                placeholder="Search brand or agent..."
                className="w-full mb-6 mobile:mb-5 rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                style={{ background: styles.input.background, border: styles.input.border, backdropFilter: styles.input.backdropFilter }}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mobile:gap-5">
                {paginatedBrands.map(b => (
                  <div key={b.id} className="bg-white dark:bg-gray-800 p-5 mobile:p-4 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-start mb-3">
                      <h4 className="font-bold text-base mobile:text-sm text-gray-900 dark:text-gray-100">{formatDisplay(b.name)}</h4>
                      <div className="flex gap-3">
                        <button onClick={() => handleEditBrand(b)} className="text-blue-600 hover:text-blue-800">
                          <FaEdit className="h-5 w-5 mobile:h-4 mobile:w-4" />
                        </button>
                        <button onClick={() => handleDeleteBrand(b.id)} className="text-red-600 hover:text-red-800">
                          <FaTrash className="h-5 w-5 mobile:h-4 mobile:w-4" />
                        </button>
                      </div>
                    </div>
                    {b.agent_name && (
                      <p className="text-sm mobile:text-xs text-gray-600 dark:text-gray-400 font-medium">Agent: <span className="font-normal">{b.agent_name}</span></p>
                    )}
                  </div>
                ))}
              </div>
              {totalPages > 1 && (
                <div className="mt-8 mobile:mt-6 flex justify-center gap-4 items-center">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="px-5 mobile:px-4 py-2.5 mobile:py-2 text-base mobile:text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={currentPage > 1 ? { background: styles.button.background, color: 'white', border: styles.button.border } : {}}
                  >
                    Previous
                  </button>
                  <span className="text-base mobile:text-sm font-medium">Page {currentPage} of {totalPages}</span>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="px-5 mobile:px-4 py-2.5 mobile:py-2 text-base mobile:text-sm font-medium rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed"
                    style={currentPage < totalPages ? { background: styles.button.background, color: 'white', border: styles.button.border } : {}}
                  >
                    Next
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={editModalOpen}
        onRequestClose={() => setEditModalOpen(false)}
        className="fixed inset-0 flex items-center justify-center p-6 mobile:p-4 z-50"
        overlayClassName="fixed inset-0 bg-black/60"
      >
        <div className="bg-white dark:bg-gray-800 rounded-xl p-8 mobile:p-6 max-w-lg w-full shadow-2xl">
          <h3 className="text-xl mobile:text-lg font-bold mb-6 mobile:mb-5 text-gray-900 dark:text-gray-100">Edit Brand</h3>
          <div className="space-y-5 mobile:space-y-4">
            <div>
              <label className="block text-base mobile:text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Brand Name</label>
              <input
                type="text"
                value={formatDisplay(editingBrand.name)}
                onChange={e => setEditingBrand({ ...editingBrand, name: e.target.value.replace(/\s+/g, '_').toLowerCase() })}
                className="w-full rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                style={{ background: styles.input.background, border: styles.input.border }}
              />
            </div>
            <div>
              <label className="block text-base mobile:text-sm font-semibold text-gray-900 dark:text-gray-300 mb-2">Agent Name</label>
              <input
                type="text"
                value={editingBrand.agent_name}
                onChange={e => setEditingBrand({ ...editingBrand, agent_name: e.target.value })}
                placeholder="Agent name"
                className="w-full rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 text-lg mobile:text-base border border-gray-300 dark:border-gray-600"
                style={{ background: styles.input.background, border: styles.input.border }}
              />
            </div>
          </div>
          <div className="mt-8 mobile:mt-6 flex justify-end gap-4">
            <button onClick={() => setEditModalOpen(false)} className="px-5 mobile:px-4 py-2.5 mobile:py-2 text-base mobile:text-sm font-medium text-gray-700 dark:text-gray-300">
              Cancel
            </button>
            <button
              onClick={handleUpdateBrand}
              className="px-6 mobile:px-5 py-2.5 mobile:py-2 text-base mobile:text-sm font-semibold text-white rounded-lg shadow-md"
              style={{ background: styles.button.background, border: styles.button.border, boxShadow: styles.button.boxShadow }}
            >
              Update Brand
            </button>
          </div>
        </div>
      </Modal>

      <style>{`
        [style*="backgroundDark"] { background: var(--bg, ${styles.input.background}); }
        [style*="backgroundDark"][data-dark] { --bg: ${styles.input.backgroundDark}; }
        [style*="borderDark"] { border: var(--border, ${styles.input.border}); }
        [style*="borderDark"][data-dark] { --border: ${styles.input.borderDark}; }
        [style*="boxShadowDark"] { box-shadow: var(--shadow, ${styles.button.boxShadow}); }
        [style*="boxShadowDark"][data-dark] { --shadow: ${styles.button.boxShadowDark}; }
      `}</style>
    </div>
  );
}