import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../../Admin/Logout';
import Select from 'react-select';
import Modal from 'react-modal';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaTrash, FaFilePdf, FaSpinner, FaDownload, FaTimes, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';

Modal.setAppElement("#root");

export default function Booking() {
  const [godowns, setGodowns] = useState([]);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [stock, setStock] = useState([]);
  const [filteredStock, setFilteredStock] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loadingCustomers, setLoadingCustomers] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalProducts, setGlobalProducts] = useState([]);
  const [loadingGlobalSearch, setLoadingGlobalSearch] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [godownSearchQuery, setGodownSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [customer, setCustomer] = useState({
    name: '', address: '', gstin: '', lr_number: '', agent_name: '',
    from: '', to: '', through: ''
  });
  const [additionalDiscount, setAdditionalDiscount] = useState(0);
  const [packingPercent, setPackingPercent] = useState(3.0);
  const [taxableValue, setTaxableValue] = useState('');
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [billNumber, setBillNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGodowns, setLoadingGodowns] = useState(true);
  const [loadingStock, setLoadingStock] = useState(false);
  const [loadingPDF, setLoadingPDF] = useState(false);
  const [isCustomerDetailsOpen, setIsCustomerDetailsOpen] = useState(true);
  const [applyProcessingFee, setApplyProcessingFee] = useState(true);
  const [applyCGST, setApplyCGST] = useState(false);
  const [applySGST, setApplySGST] = useState(false);
  const [applyIGST, setApplyIGST] = useState(false);
  const searchInputRef = useRef(null);

  const styles = {
    input: { background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))", backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))", backdropFilter: "blur(10px)", border: "1px solid rgba(2,132,199,0.3)", borderDark: "1px solid rgba(59,130,246,0.4)" },
    button: { background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))", backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))", backdropFilter: "blur(15px)", border: "1px solid rgba(125,211,252,0.4)", borderDark: "1px solid rgba(147,197,253,0.4)", boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)", boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)" }
  };

  const capitalize = (str) => str?.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') || '';
  const shortenGodownName = (name) => name?.replace(/_/g, ' ').trim().split(/\s+/).filter(Boolean).map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase()).join('') || '';

  const fetchGodowns = useCallback(async () => {
    setLoadingGodowns(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/godown`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const options = data.map(g => ({ value: Number(g.id), label: capitalize(g.name), shortName: shortenGodownName(g.name) }));
      setGodowns(options);
    } catch {
      setError('Failed to load godowns');
    } finally {
      setLoadingGodowns(false);
    }
  }, []);

  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/customers`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      const enriched = data.map(c => ({ label: `${c.value.name} (${c.value.to || 'Unknown'})`, value: c.value }));
      setCustomers(enriched);
    } catch {
      setError('Failed to load customers');
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => { fetchGodowns(); }, [fetchGodowns]);
  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  useEffect(() => {
    if (selectedCustomer) {
      const cust = selectedCustomer.value;
      setCustomer({
        name: cust.name || '',
        address: cust.address || '',
        gstin: cust.gstin || '',
        lr_number: cust.lr_number || '',
        agent_name: cust.agent_name || '',
        from: cust.from || '',
        to: cust.to || '',
        through: cust.through || ''
      });
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (selectedGodown) {
      setLoadingStock(true);
      fetch(`${API_BASE_URL}/api/godown/stock/${selectedGodown.value}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          const enriched = data.map(item => ({
            ...item,
            id: Number(item.id),
            rate_per_box: parseFloat(item.rate_per_box) || 0,
            per_case: item.per_case || 1,
            current_cases: item.current_cases || 0
          }));
          setStock(enriched);
          setFilteredStock(enriched);
        })
        .catch(() => setError('Failed to load stock'))
        .finally(() => setLoadingStock(false));
    } else {
      setStock([]);
      setFilteredStock([]);
    }
  }, [selectedGodown]);

  useEffect(() => {
    const term = godownSearchQuery.trim().toLowerCase();
    if (!term) {
      setFilteredStock(stock);
    } else {
      setFilteredStock(stock.filter(s =>
        s.productname.toLowerCase().includes(term) ||
        s.brand.toLowerCase().includes(term)
      ));
    }
  }, [godownSearchQuery, stock]);

  // Fixed: Now uses `rate_per_box` instead of `wprice`
  useEffect(() => {
    const delay = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        setLoadingGlobalSearch(true);
        fetch(`${API_BASE_URL}/api/search/global?name=${encodeURIComponent(searchQuery)}`)
          .then(r => r.ok ? r.json() : [])
          .then(data => data.map(p => ({
            id: Number(p.id),
            product_type: p.product_type,
            productname: p.productname,
            brand: p.brand,
            per_case: p.per_case || 1,
            current_cases: p.current_cases || 0,
            rate_per_box: parseFloat(p.rate_per_box) || 0,  // FIXED: Use rate_per_box
            godown_name: p.godown_name,
            godown_id: Number(p.godown_id),
            shortGodown: shortenGodownName(p.godown_name)
          })))
          .then(products => {
            setGlobalProducts(products);
            setHighlightedIndex(products.length > 0 ? 0 : -1);
          })
          .catch(() => setGlobalProducts([]))
          .finally(() => setLoadingGlobalSearch(false));
      } else {
        setGlobalProducts([]);
        setHighlightedIndex(-1);
      }
    }, 400);

    return () => clearTimeout(delay);
  }, [searchQuery]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (globalProducts.length === 0) return;
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev + 1) % globalProducts.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setHighlightedIndex(prev => (prev - 1 + globalProducts.length) % globalProducts.length);
      } else if (e.key === 'Enter' && highlightedIndex >= 0) {
        e.preventDefault();
        addGlobalProduct(globalProducts[highlightedIndex]);
      } else if (e.key === 'Escape') {
        setSearchQuery('');
        setGlobalProducts([]);
        setHighlightedIndex(-1);
      }
    };

    const input = searchInputRef.current;
    if (input) input.addEventListener('keydown', handleKeyDown);
    return () => {
      if (input) input.removeEventListener('keydown', handleKeyDown);
    };
  }, [globalProducts, highlightedIndex]);

  const addGlobalProduct = (product) => {
    if (cart.some(i => i.id === product.id && i.godown === product.shortGodown)) {
      return setError('Product from this godown already in cart');
    }

    const godownOption = godowns.find(g => g.value === product.godown_id);
    if (!godownOption) return setError('Godown not found');

    if (!selectedGodown || selectedGodown.value !== product.godown_id) {
      setSelectedGodown({ ...godownOption, isAutoSelected: true });
    }

    setCart(prev => [...prev, {
      id: product.id,
      product_type: product.product_type,
      productname: product.productname,
      brand: product.brand,
      per_case: product.per_case,
      current_cases: product.current_cases,
      cases: 1,
      discount: 0,
      godown: product.shortGodown,
      rate_per_box: product.rate_per_box  // Correct rate used
    }]);

    setSearchQuery('');
    setGlobalProducts([]);
    setHighlightedIndex(-1);
    setSuccess(`Added: ${product.productname} (${product.shortGodown})`);
    setTimeout(() => setSuccess(''), 2000);
    setTimeout(() => searchInputRef.current?.focus(), 100);
  };

  const addToCart = (item) => {
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        if (exists.cases + 1 > item.current_cases) return prev;
        return prev.map(i => i.id === item.id ? { ...i, cases: i.cases + 1 } : i);
      }
      const shortGodown = selectedGodown?.shortName || 'Unknown';
      return [...prev, {
        id: Number(item.id),
        product_type: item.product_type,
        productname: item.productname,
        brand: item.brand,
        per_case: item.per_case,
        current_cases: item.current_cases,
        cases: 1,
        discount: 0,
        godown: shortGodown,
        rate_per_box: item.rate_per_box
      }];
    });
  };

  const updateCases = (idx, cases) => {
    cases = Math.max(1, Math.min(cases || 1, cart[idx].current_cases));
    setCart(prev => prev.map((i, index) => index === idx ? { ...i, cases } : i));
  };

  const updateDiscount = (idx, discount) => {
    discount = Math.max(0, Math.min(100, discount || 0));
    setCart(prev => prev.map((i, index) => index === idx ? { ...i, discount } : i));
  };

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const calculate = () => {
    let subtotal = 0, totalCases = 0;
    cart.forEach(item => {
      const qty = item.cases * item.per_case;
      const amountBefore = qty * item.rate_per_box;
      const discountAmt = amountBefore * (item.discount / 100);
      const finalAmt = amountBefore - discountAmt;
      subtotal += finalAmt;
      totalCases += item.cases;
    });

    const packingCharges = applyProcessingFee ? subtotal * (packingPercent / 100) : 0;
    const subtotalWithPacking = subtotal + packingCharges;
    let taxableUsed = subtotalWithPacking;
    if (taxableValue && !isNaN(taxableValue)) taxableUsed += parseFloat(taxableValue);

    const addlDiscountAmt = taxableUsed * (additionalDiscount / 100);
    const netBeforeRound = taxableUsed - addlDiscountAmt;

    const cgstAmt = applyCGST ? netBeforeRound * 0.09 : 0;
    const sgstAmt = applySGST ? netBeforeRound * 0.09 : 0;
    const igstAmt = applyIGST ? netBeforeRound * 0.18 : 0;
    const totalTax = cgstAmt + sgstAmt + igstAmt;
    const grandTotal = Math.round(netBeforeRound + totalTax);
    const roundOff = grandTotal - (netBeforeRound + totalTax);

    return {
      subtotal: subtotal.toFixed(2),
      packingCharges: packingCharges.toFixed(2),
      subtotalWithPacking: subtotalWithPacking.toFixed(2),
      taxableUsed: taxableUsed.toFixed(2),
      addlDiscountAmt: addlDiscountAmt.toFixed(2),
      cgstAmt: cgstAmt.toFixed(2),
      sgstAmt: sgstAmt.toFixed(2),
      igstAmt: igstAmt.toFixed(2),
      totalTax: totalTax.toFixed(2),
      roundOff: roundOff.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      totalCases
    };
  };

  const calc = calculate();

  const submitBooking = async () => {
    if (!customer.name || cart.length === 0 || !selectedGodown || !customer.from || !customer.to || !customer.through) {
      return setError('Please fill all required fields');
    }

    setLoading(true);
    setError('');
    setSuccess('');

    const payload = {
      customer_name: customer.name,
      address: customer.address,
      gstin: customer.gstin,
      lr_number: customer.lr_number,
      agent_name: customer.agent_name,
      from: customer.from,
      to: customer.to,
      through: customer.through,
      additional_discount: additionalDiscount,
      packing_percent: packingPercent,
      taxable_value: taxableValue ? parseFloat(taxableValue) : null,
      stock_from: selectedGodown.shortName,
      apply_processing_fee: applyProcessingFee,
      apply_cgst: applyCGST,
      apply_sgst: applySGST,
      apply_igst: applyIGST,
      items: cart.map(i => ({
        id: i.id,
        product_type: i.product_type,
        productname: i.productname,
        brand: i.brand,
        cases: i.cases,
        per_case: i.per_case,
        discount_percent: i.discount,
        godown: i.godown,
        rate_per_box: i.rate_per_box
      }))
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/booking`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to generate bill');

      setLoadingPDF(true);
      const pdfRes = await fetch(`${API_BASE_URL}${data.pdfPath}`);
      const blob = await pdfRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);
      setBillNumber(data.bill_number);
      setShowPDFModal(true);
      setSuccess('Bill Generated Successfully!');

      // Reset form
      setCart([]);
      setCustomer({ name: '', address: '', gstin: '', lr_number: '', agent_name: '', from: '', to: '', through: '' });
      setSelectedCustomer(null);
      setAdditionalDiscount(0);
      setTaxableValue('');
      setApplyProcessingFee(true);
      setApplyCGST(false); setApplySGST(false); setApplyIGST(false);

    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
      setLoadingPDF(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pdfBlobUrl) URL.revokeObjectURL(pdfBlobUrl);
    };
  }, [pdfBlobUrl]);

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />
      <div className="flex-1 p-4 pt-16 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg mobile:text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">Create Estimate Bill</h2>

          {error && <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-xs mobile:text-sm text-center">{error}</div>}
          {success && <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-xs mobile:text-sm text-center">{success}</div>}

          <div className="space-y-6">

            {/* Customer Selection */}
            <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
              <label className="block font-medium mb-1 text-black dark:text-white text-xs mobile:text-sm">Select Existing Customer (optional)</label>
              {loadingCustomers ? (
                <div className="flex items-center justify-center py-2"><FaSpinner className="animate-spin h-4 w-4 text-blue-600 mr-2" /><span className="text-xs">Loading...</span></div>
              ) : (
                <Select
                  options={customers}
                  value={selectedCustomer}
                  onChange={setSelectedCustomer}
                  placeholder="Search / Select Customer"
                  isClearable
                  className="text-xs mobile:text-sm"
                  styles={{ control: (base) => ({ ...base, ...styles.input, border: '1px solid rgba(2,132,199,0.3)', boxShadow: 'none', '&:hover': { borderColor: 'rgba(2,132,199,0.5)' } }) }}
                />
              )}
            </div>

            {/* Customer Details */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden mb-4">
              <button onClick={() => setIsCustomerDetailsOpen(!isCustomerDetailsOpen)} className="w-full p-3 mobile:p-4 flex justify-between items-center text-left font-semibold text-black dark:text-white bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition">
                <span>Customer Details</span>
                {isCustomerDetailsOpen ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              {isCustomerDetailsOpen && (
                <div className="p-3 mobile:p-4">
                  <div className="grid grid-cols-1 mobile:grid-cols-2 gap-2 mobile:gap-3 text-xs mobile:text-sm">
                    <input placeholder="Party Name *" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                    <input placeholder="Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                    <input placeholder="GSTIN" value={customer.gstin} onChange={e => setCustomer({ ...customer, gstin: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                    <input placeholder="L.R. Number" value={customer.lr_number} onChange={e => setCustomer({ ...customer, lr_number: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                    <input placeholder="Agent Name" value={customer.agent_name} onChange={e => setCustomer({ ...customer, agent_name: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                    <input placeholder="From (e.g. SIVAKASI) *" value={customer.from} onChange={e => setCustomer({ ...customer, from: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                    <input placeholder="To (e.g. BOMMIDI) *" value={customer.to} onChange={e => setCustomer({ ...customer, to: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                    <input placeholder="Through (e.g. ABI TPT) *" value={customer.through} onChange={e => setCustomer({ ...customer, through: e.target.value })} className="rounded px-2 py-1.5 border" style={styles.input} />
                  </div>
                </div>
              )}
            </div>

            {/* Cart Summary */}
            {cart.length > 0 && (
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-3 mobile:p-4 mb-4">
                <h3 className="font-semibold text-sm mobile:text-base mb-3 text-black dark:text-white">Cart Items</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs mobile:text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-700 text-black dark:text-white">
                        <th className="p-1 mobile:p-2 border">S.No</th>
                        <th className="p-1 mobile:p-2 border">Product</th>
                        <th className="p-1 mobile:p-2 border">Cases</th>
                        <th className="p-1 mobile:p-2 border">Per</th>
                        <th className="p-1 mobile:p-2 border">Qty</th>
                        <th className="p-1 mobile:p-2 border">Rate</th>
                        <th className="p-1 mobile:p-2 border">Amount</th>
                        <th className="p-1 mobile:p-2 border">From</th>
                        <th className="p-1 mobile:p-2 border"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {cart.map((item, idx) => {
                        const qty = item.cases * item.per_case;
                        const amountBefore = qty * item.rate_per_box;
                        const discountAmt = amountBefore * (item.discount / 100);
                        const finalAmt = amountBefore - discountAmt;
                        return (
                          <tr key={idx} className="border-b text-black dark:text-white">
                            <td className="p-1 mobile:p-2 border text-center">{idx + 1}</td>
                            <td className="p-1 mobile:p-2 border text-center truncate max-w-24 mobile:max-w-32">{item.productname}</td>
                            <td className="p-1 mobile:p-2 border text-center">
                              <input type="number" min="1" max={item.current_cases} value={item.cases} onChange={e => updateCases(idx, parseInt(e.target.value))} className="w-12 mobile:w-16 p-1 border rounded text-xs text-black" style={styles.input} />
                            </td>
                            <td className="p-1 mobile:p-2 border text-center">{item.per_case}</td>
                            <td className="p-1 mobile:p-2 border text-center">{qty}</td>
                            <td className="p-1 mobile:p-2 border text-center">₹{item.rate_per_box.toFixed(2)}</td>
                            <td className="p-1 mobile:p-2 border text-center">₹{finalAmt.toFixed(2)}</td>
                            <td className="p-1 mobile:p-2 border text-center">{item.godown}</td>
                            <td className="p-1 mobile:p-2 border text-center">
                              <button onClick={() => removeFromCart(idx)} className="text-red-600"><FaTrash className="h-3 w-3 mobile:h-4 mobile:w-4" /></button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="mt-4 grid grid-cols-1 mobile:grid-cols-2 gap-3 mobile:gap-4 text-xs mobile:text-sm text-black dark:text-white">
                  <div>
                    <p className="font-bold">No. of Cases: {calc.totalCases}</p>
                    <p>From: {customer.from || '-'}</p>
                    <p>To: {customer.to || '-'}</p>
                    <p>Through: {customer.through || '-'}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p>GOODS VALUE <span className="float-right">₹{calc.subtotal}</span></p>
                    {applyProcessingFee && <p>PACKING @ {packingPercent}% <span className="float-right">₹{calc.packingCharges}</span></p>}
                    {parseFloat(calc.addlDiscountAmt) > 0 && <p>SPECIAL DISCOUNT <span className="float-right">-₹{calc.addlDiscountAmt}</span></p>}
                    {applyCGST && <p>CGST @ 9% <span className="float-right">₹{calc.cgstAmt}</span></p>}
                    {applySGST && <p>SGST @ 9% <span className="float-right">₹{calc.sgstAmt}</span></p>}
                    {applyIGST && <p>IGST @ 18% <span className="float-right">₹{calc.igstAmt}</span></p>}
                    <p>TAXABLE VALUE <span className="float-right">₹{calc.taxableUsed}</span></p>
                    <p>ROUND OFF <span className="float-right">₹{calc.roundOff}</span></p>
                    <p className="font-bold text-green-600">NET AMOUNT <span className="float-right">₹{calc.grandTotal}</span></p>
                  </div>
                </div>

                <div className="mt-4 grid grid-cols-1 mobile:grid-cols-3 gap-3 text-xs mobile:text-sm">
                  <div>
                    <label className="block font-medium mb-1 text-black dark:text-white">Additional Discount (%)</label>
                    <input type="number" value={additionalDiscount} onChange={e => setAdditionalDiscount(parseFloat(e.target.value) || 0)} className="w-full rounded px-2 py-1.5 border" style={styles.input} />
                  </div>
                  <div>
                    <label className="flex items-center gap-2 font-medium text-black dark:text-white">
                      <input type="checkbox" checked={applyProcessingFee} onChange={e => setApplyProcessingFee(e.target.checked)} className="w-4 h-4" />
                      Packing @ {packingPercent}%
                    </label>
                    <input type="number" step="0.1" value={packingPercent} onChange={e => setPackingPercent(parseFloat(e.target.value) || 0)} className="w-full rounded px-2 py-1.5 border mt-1" style={styles.input} disabled={!applyProcessingFee} />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-black dark:text-white">Additional Taxable Amount</label>
                    <input type="number" placeholder="e.g. 1000" value={taxableValue} onChange={e => setTaxableValue(e.target.value)} className="w-full rounded px-2 py-1.5 border" style={styles.input} />
                  </div>
                </div>

                <div className="mt-3 flex gap-4 text-md text-white mobile:text-sm">
                  <label className="flex items-center gap-2"><input type="checkbox" checked={applyCGST} onChange={e => setApplyCGST(e.target.checked)} className="w-4 h-4" /> CGST 9%</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={applySGST} onChange={e => setApplySGST(e.target.checked)} className="w-4 h-4" /> SGST 9%</label>
                  <label className="flex items-center gap-2"><input type="checkbox" checked={applyIGST} onChange={e => setApplyIGST(e.target.checked)} className="w-4 h-4" /> IGST 18%</label>
                </div>
              </div>
            )}

            {/* Global Search */}
            <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
              <label className="block font-medium mb-1 text-black dark:text-white text-xs mobile:text-sm">Search Products (All Godowns)</label>
              <div className="relative">
                <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                <input
                  ref={searchInputRef}
                  type="text"
                  placeholder="Type product name (min 2 chars)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 border rounded text-xs mobile:text-sm"
                  style={styles.input}
                />
              </div>
              {loadingGlobalSearch && <div className="mt-2 text-xs text-blue-600">Searching...</div>}
              {globalProducts.length > 0 && (
                <div className="mt-2 max-h-48 overflow-y-auto border rounded bg-gray-50 dark:bg-gray-700 p-2">
                  {globalProducts.map((p, idx) => (
                    <div
                      key={p.id}
                      className={`flex justify-between items-center p-2 border-b text-xs cursor-pointer transition ${idx === highlightedIndex ? 'bg-blue-100 dark:bg-blue-900' : 'hover:bg-blue-50 dark:hover:bg-blue-900'}`}
                      onClick={() => addGlobalProduct(p)}
                    >
                      <div>
                        <span className="font-medium text-sm text-black dark:text-white">{p.productname}</span>{' '}
                        <span className="text-black dark:text-white">({p.shortGodown})</span>
                      </div>
                      <div className="text-right">
                        <p className="text-green-600">₹{p.rate_per_box.toFixed(2)}/box</p>
                        <p className="text-black dark:text-white">Cases: {p.current_cases}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Godown Selection */}
            <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
              <label className="block font-medium mb-1 text-black dark:text-white text-xs mobile:text-sm">
                Selected Godown: {selectedGodown ? selectedGodown.label : 'None'}
              </label>
              {loadingGodowns ? (
                <div className="flex items-center justify-center py-3">
                  <FaSpinner className="animate-spin h-4 w-4 mobile:h-5 mobile:w-5 text-blue-600 mr-2" />
                  <span className="text-xs mobile:text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                </div>
              ) : (
                <Select
                  options={godowns}
                  value={selectedGodown}
                  onChange={(opt) => setSelectedGodown(opt ? { ...opt, isAutoSelected: false } : null)}
                  placeholder="Choose Godown (auto-selected on add)"
                  isClearable
                  className="text-xs mobile:text-sm"
                  styles={{ control: (base) => ({ ...base, ...styles.input, border: '1px solid rgba(2,132,199,0.3)', boxShadow: 'none', '&:hover': { borderColor: 'rgba(2,132,199,0.5)' } }) }}
                />
              )}
            </div>

            {/* Stock Grid */}
            {selectedGodown && selectedGodown.isAutoSelected !== true && (
              <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
                <h3 className="text-sm mobile:text-md font-semibold mb-3 text-black dark:text-white">Available Stock</h3>
                {loadingStock ? (
                  <div className="flex items-center justify-center py-6">
                    <FaSpinner className="animate-spin h-5 w-5 mobile:h-6 mobile:w-6 text-blue-600 mr-2" />
                    <span className="text-xs mobile:text-sm text-gray-600 dark:text-gray-400">Loading...</span>
                  </div>
                ) : filteredStock.length > 0 ? (
                  <div className="grid grid-cols-2 mobile:grid-cols-3 lg:grid-cols-4 gap-2 mobile:gap-3 text-black dark:text-white">
                    {filteredStock.map(item => (
                      <div key={item.id} className="border rounded p-2 text-xs mobile:text-sm bg-gray-50 dark:bg-gray-700">
                        <p className="font-medium truncate">{item.productname}</p>
                        <p>Type: {capitalize(item.product_type)}</p>
                        <p>Brand: {capitalize(item.brand)}</p>
                        <p>Cases: {item.current_cases}</p>
                        <p>Per Case: {item.per_case}</p>
                        <p className="text-green-600 font-medium">₹{item.rate_per_box.toFixed(2)}/box</p>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={item.current_cases <= 0}
                          className="mt-2 w-full text-white text-xs mobile:text-sm py-1 rounded flex items-center justify-center gap-1 disabled:opacity-50"
                          style={styles.button}
                        >
                          <FaPlus className="h-3 w-3" /> Add
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-xs mobile:text-sm">
                    {godownSearchQuery ? 'No products match your search.' : 'No stock available.'}
                  </p>
                )}
              </div>
            )}

            {/* Generate Button */}
            <button
              onClick={submitBooking}
              disabled={loading || cart.length === 0}
              className="w-full py-3 rounded text-white font-medium text-sm mobile:text-base flex items-center justify-center gap-2 disabled:opacity-50"
              style={styles.button}
            >
              {loading ? (
                <>Generating... <FaSpinner className="animate-spin h-4 w-4 mobile:h-5 mobile:w-5" /></>
              ) : (
                <>Generate Estimate Bill <FaFilePdf className="h-4 w-4 mobile:h-5 mobile:w-5" /></>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      <Modal
        isOpen={showPDFModal}
        onRequestClose={() => setShowPDFModal(false)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 outline-none overflow-hidden"
        overlayClassName="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4"
        closeTimeoutMS={200}
      >
        <div className="flex flex-col h-full max-h-screen">
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-lg mobile:text-xl font-bold text-gray-900 dark:text-gray-100">Bill: {billNumber}</h2>
            <div className="flex gap-2">
              <a href={pdfBlobUrl} download={`${billNumber}.pdf`} className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1 transition">
                <FaDownload className="h-3 w-3" /> Download
              </a>
              <button onClick={() => setShowPDFModal(false)} className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1 transition">
                <FaTimes className="h-3 w-3" /> Close
              </button>
            </div>
          </div>
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 mobile:p-4 overflow-auto">
            {loadingPDF ? (
              <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : pdfBlobUrl ? (
              <embed src={pdfBlobUrl} type="application/pdf" className="w-full h-full min-h-96 border-0" />
            ) : (
              <p className="text-center text-red-600">Failed to load PDF</p>
            )}
          </div>
          {pdfBlobUrl && (
            <div className="p-2 text-center text-xs text-gray-500">
              <a href={pdfBlobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Open in new tab
              </a>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}