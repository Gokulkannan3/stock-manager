// src/pages/Booking/Booking.jsx
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import Select from 'react-select';
import Modal from 'react-modal';
import { API_BASE_URL } from '../../../Config';
import { FaPlus, FaTrash, FaFilePdf, FaSpinner, FaDownload, FaTimes } from 'react-icons/fa';

Modal.setAppElement("#root");

export default function Booking() {
  const [godowns, setGodowns] = useState([]);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [stock, setStock] = useState([]);
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

  const styles = {
    input: {
      background: "linear-gradient(135deg, rgba(255,255,255,0.8), rgba(240,249,255,0.6))",
      backgroundDark: "linear-gradient(135deg, rgba(55,65,81,0.8), rgba(75,85,99,0.6))",
      backdropFilter: "blur(10px)",
      border: "1px solid rgba(2,132,199,0.3)",
      borderDark: "1px solid rgba(59,130,246,0.4)",
    },
    button: {
      background: "linear-gradient(135deg, rgba(2,132,199,0.9), rgba(14,165,233,0.95))",
      backgroundDark: "linear-gradient(135deg, rgba(59,130,246,0.9), rgba(37,99,235,0.95))",
      backdropFilter: "blur(15px)",
      border: "1px solid rgba(125,211,252,0.4)",
      borderDark: "1px solid rgba(147,197,253,0.4)",
      boxShadow: "0 15px 35px rgba(2,132,199,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
      boxShadowDark: "0 15px 35px rgba(59,130,246,0.4), inset 0 1px 0 rgba(255,255,255,0.1)",
    },
  };

  const capitalize = (str) => {
    if (!str) return '';
    return str.toLowerCase().split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  };

  // Fetch Godowns
  const fetchGodowns = useCallback(async () => {
    setLoadingGodowns(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/godown`);
      if (!res.ok) throw new Error('Failed to fetch godowns');
      const data = await res.json();
      setGodowns(data.map(g => ({ value: g.id, label: capitalize(g.name) })));
    } catch (err) {
      setError('Failed to load godowns');
    } finally {
      setLoadingGodowns(false);
    }
  }, []);

  useEffect(() => {
    fetchGodowns();
  }, [fetchGodowns]);

  // Fetch Stock
  useEffect(() => {
    if (selectedGodown) {
      setLoadingStock(true);
      fetch(`${API_BASE_URL}/api/godown/stock/${selectedGodown.value}`)
        .then(res => res.ok ? res.json() : Promise.reject())
        .then(data => {
          setStock(data.map(item => ({
            ...item,
            rate_per_box: parseFloat(item.rate_per_box) || 0
          })));
        })
        .catch(() => setError('Failed to load stock'))
        .finally(() => setLoadingStock(false));
    } else {
      setStock([]);
    }
  }, [selectedGodown]);

  const addToCart = (item) => {
    if (item.current_cases <= 0) return setError('Out of stock');
    setCart(prev => {
      const exists = prev.find(i => i.id === item.id);
      if (exists) {
        if (exists.cases + 1 > item.current_cases) return prev;
        return prev.map(i => i.id === item.id ? { ...i, cases: i.cases + 1 } : i);
      }
      return [...prev, {
        id: item.id,
        product_type: item.product_type,
        productname: item.productname,
        brand: item.brand,
        per_case: item.per_case,
        current_cases: item.current_cases,
        cases: 1,
        discount: 0,
        godown: selectedGodown.label,
        rate_per_box: parseFloat(item.rate_per_box) || 0
      }];
    });
  };

  const updateCases = (idx, cases) => {
    cases = Math.max(1, Math.min(cases, cart[idx].current_cases));
    setCart(prev => prev.map((i, index) => index === idx ? { ...i, cases } : i));
  };

  const updateDiscount = (idx, discount) => {
    discount = Math.max(0, Math.min(100, discount));
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

    const packingCharges = subtotal * (packingPercent / 100);
    const subtotalWithPacking = subtotal + packingCharges;

    // NEW LOGIC: Add manual taxable value ON TOP of subtotalWithPacking
    let taxableUsed = subtotalWithPacking;
    if (taxableValue && !isNaN(taxableValue)) {
      const manualTaxable = parseFloat(taxableValue);
      taxableUsed = subtotalWithPacking + manualTaxable; // ADD, not replace!
    }

    const addlDiscountAmt = taxableUsed * (additionalDiscount / 100);
    const netBeforeRound = taxableUsed - addlDiscountAmt;
    const grandTotal = Math.round(netBeforeRound);
    const roundOff = grandTotal - netBeforeRound;

    return {
      subtotal: subtotal.toFixed(2),
      packingCharges: packingCharges.toFixed(2),
      subtotalWithPacking: subtotalWithPacking.toFixed(2),
      taxableUsed: taxableUsed.toFixed(2),
      addlDiscountAmt: addlDiscountAmt.toFixed(2),
      roundOff: roundOff.toFixed(2),
      grandTotal: grandTotal.toFixed(2),
      totalCases
    };
  };

  const submitBooking = async () => {
    if (!customer.name || cart.length === 0 || !selectedGodown || !customer.from || !customer.to || !customer.through) {
      return setError('Please fill all required fields');
    }
    setLoading(true); setError(''); setSuccess('');
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
      stock_from: selectedGodown.label,
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
      if (!res.ok) throw new Error(data.message || 'Failed');

      // Generate blob for mobile-safe PDF
      setLoadingPDF(true);
      const pdfRes = await fetch(`${API_BASE_URL}${data.pdfPath}`);
      const blob = await pdfRes.blob();
      const blobUrl = URL.createObjectURL(blob);
      setPdfBlobUrl(blobUrl);

      setBillNumber(data.bill_number);
      setShowPDFModal(true);
      setSuccess('Bill Generated!');
      setCart([]);
      setCustomer({ name: '', address: '', gstin: '', lr_number: '', agent_name: '', from: '', to: '', through: '' });
      setAdditionalDiscount(0); setTaxableValue('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLoadingPDF(false);
    }
  };

  const calc = calculate();

  // Cleanup blob
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
          <h2 className="text-lg mobile:text-xl font-bold text-center text-gray-900 dark:text-gray-100 mb-4">
            Create Estimate Bill
          </h2>

          {error && (
            <div className="mb-3 p-2 bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-200 rounded text-xs mobile:text-sm text-center">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-3 p-2 bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-200 rounded text-xs mobile:text-sm text-center">
              {success}
            </div>
          )}

          <div className="space-y-6">

            {/* Customer Details */}
            <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
              <h3 className="text-sm mobile:text-md font-semibold mb-3 text-black dark:text-white">Customer Details</h3>
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

            {/* Godown Selector */}
            <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
              <label className="block font-medium mb-1 text-black dark:text-white text-xs mobile:text-sm">Select Godown *</label>
              {loadingGodowns ? (
                <div className="flex items-center justify-center py-3">
                  <FaSpinner className="animate-spin h-4 w-4 mobile:h-5 mobile:w-5 text-blue-600 mr-2" />
                  <span className="text-xs mobile:text-sm text-gray-600 dark:text-gray-400">Loading godowns...</span>
                </div>
              ) : (
                <Select
                  options={godowns}
                  value={selectedGodown}
                  onChange={setSelectedGodown}
                  placeholder="Choose Godown"
                  className="text-xs mobile:text-sm"
                  styles={{
                    control: (base) => ({
                      ...base,
                      ...styles.input,
                      border: '1px solid rgba(2,132,199,0.3)',
                      boxShadow: 'none',
                      '&:hover': { borderColor: 'rgba(2,132,199,0.5)' }
                    })
                  }}
                />
              )}
            </div>

            {/* Available Stock */}
            {selectedGodown && (
              <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
                <h3 className="text-sm mobile:text-md font-semibold mb-3 text-black dark:text-white">Available Stock</h3>
                {loadingStock ? (
                  <div className="flex items-center justify-center py-6">
                    <FaSpinner className="animate-spin h-5 w-5 mobile:h-6 mobile:w-6 text-blue-600 mr-2" />
                    <span className="text-xs mobile:text-sm text-gray-600 dark:text-gray-400">Loading stock...</span>
                  </div>
                ) : stock.length > 0 ? (
                  <div className="grid grid-cols-2 mobile:grid-cols-3 lg:grid-cols-4 gap-2 mobile:gap-3 text-black dark:text-white">
                    {stock.map(item => (
                      <div key={item.id} className="border rounded p-2 text-xs mobile:text-sm bg-gray-50 dark:bg-gray-700">
                        <p className="font-medium truncate">{item.productname}</p>
                        <p>Type: {capitalize(item.product_type)}</p>
                        <p>Brand: {capitalize(item.brand)}</p>
                        <p>Cases: {item.current_cases}</p>
                        <p>Per Case: {item.per_case}</p>
                        <p className="text-green-600 font-medium">₹{(item.rate_per_box || 0).toFixed(2)}/box</p>
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
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-xs mobile:text-sm">No stock available.</p>
                )}
              </div>
            )}

            {/* Cart */}
            {cart.length > 0 && (
              <div className="bg-white dark:bg-gray-800 p-3 mobile:p-4 rounded-lg shadow">
                <h3 className="text-sm mobile:text-md font-semibold mb-3 text-black dark:text-white">Cart</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs mobile:text-sm border-collapse">
                    <thead>
                      <tr className="border-b bg-gray-50 dark:bg-gray-700 text-black dark:text-white">
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">S.No</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">Product</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">Cases</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">Per</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">Qty</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">Rate</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">Disc %</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">Amount</th>
                        <th className="p-1 mobile:p-2 border text-xs mobile:text-sm">From</th>
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
                            <td className="p-1 mobile:p-2 border text-center text-xs mobile:text-sm">{idx + 1}</td>
                            <td className="p-1 mobile:p-2 border text-xs mobile:text-sm truncate max-w-24 mobile:max-w-32">{item.productname}</td>
                            <td className="p-1 mobile:p-2 border text-center">
                              <input
                                type="number"
                                min="1"
                                max={item.current_cases}
                                value={item.cases}
                                onChange={e => updateCases(idx, parseInt(e.target.value))}
                                className="w-12 mobile:w-16 p-1 border rounded text-xs text-black"
                                style={styles.input}
                              />
                            </td>
                            <td className="p-1 mobile:p-2 border text-center text-xs mobile:text-sm">{item.per_case}</td>
                            <td className="p-1 mobile:p-2 border text-center text-xs mobile:text-sm">{qty}</td>
                            <td className="p-1 mobile:p-2 border text-right text-xs mobile:text-sm">₹{(item.rate_per_box || 0).toFixed(2)}</td>
                            <td className="p-1 mobile:p-2 border text-center">
                              <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.discount}
                                onChange={e => updateDiscount(idx, parseFloat(e.target.value))}
                                className="w-12 mobile:w-16 p-1 border rounded text-xs text-black"
                                style={styles.input}
                              />
                            </td>
                            <td className="p-1 mobile:p-2 border text-right text-xs mobile:text-sm">₹{finalAmt.toFixed(2)}</td>
                            <td className="p-1 mobile:p-2 border text-center text-xs mobile:text-sm">{item.godown}</td>
                            <td className="p-1 mobile:p-2 border text-center">
                              <button onClick={() => removeFromCart(idx)} className="text-red-600">
                                <FaTrash className="h-3 w-3 mobile:h-4 mobile:w-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="mt-4 grid grid-cols-1 mobile:grid-cols-2 gap-3 mobile:gap-4 text-xs mobile:text-sm text-black dark:text-white">
                  <div>
                    <p className="font-bold">No. of Cases: {calc.totalCases}</p>
                    <p>From: {customer.from}</p>
                    <p>To: {customer.to}</p>
                    <p>Through: {customer.through}</p>
                  </div>
                  <div className="text-right space-y-1">
                    <p>GOODS VALUE <span className="float-right">₹{calc.subtotal}</span></p>
                    <p>SPECIAL DISCOUNT <span className="float-right">-₹{calc.addlDiscountAmt}</span></p>
                    <p>PACKING @ {packingPercent}% <span className="float-right">₹{calc.packingCharges}</span></p>
                    <p>TAXABLE VALUE <span className="float-right">₹{calc.taxableUsed}</span></p>
                    <p>ROUND OFF <span className="float-right">₹{calc.roundOff}</span></p>
                    <p className="font-bold text-green-600">NET AMOUNT <span className="float-right">₹{calc.grandTotal}</span></p>
                  </div>
                </div>

                {/* Discount & Packing Inputs */}
                <div className="mt-4 grid grid-cols-1 mobile:grid-cols-3 gap-3 text-xs mobile:text-sm">
                  <div>
                    <label className="block font-medium mb-1 text-black dark:text-white">Additional Discount (%)</label>
                    <input type="number" value={additionalDiscount} onChange={e => setAdditionalDiscount(parseFloat(e.target.value) || 0)} className="w-full rounded px-2 py-1.5 border" style={styles.input} />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-black dark:text-white">Packing Charges (%)</label>
                    <input type="number" step="0.1" value={packingPercent} onChange={e => setPackingPercent(parseFloat(e.target.value) || 0)} className="w-full rounded px-2 py-1.5 border" style={styles.input} />
                  </div>
                  <div>
                    <label className="block font-medium mb-1 text-black dark:text-white">Taxable Value</label>
                    <input type="number" placeholder="Auto if blank" value={taxableValue} onChange={e => setTaxableValue(e.target.value)} className="w-full rounded px-2 py-1.5 border" style={styles.input} />
                  </div>
                </div>
              </div>
            )}

            {/* Generate Bill Button */}
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

      {/* PDF Modal – Works on iPhone */}
      <Modal
        isOpen={showPDFModal}
        onRequestClose={() => setShowPDFModal(false)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 outline-none overflow-hidden"
        overlayClassName="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4"
        closeTimeoutMS={200}
      >
        <div className="flex flex-col h-full max-h-screen">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
            <h2 className="text-lg mobile:text-xl font-bold text-gray-900 dark:text-gray-100">
              Bill: {billNumber}
            </h2>
            <div className="flex gap-2">
              <a
                href={pdfBlobUrl}
                download={`${billNumber}.pdf`}
                className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1 transition"
              >
                <FaDownload className="h-3 w-3" /> Download
              </a>
              <button
                onClick={() => setShowPDFModal(false)}
                className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1 transition"
              >
                <FaTimes className="h-3 w-3" /> Close
              </button>
            </div>
          </div>

          {/* PDF Viewer */}
          <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 mobile:p-4 overflow-auto">
            {loadingPDF ? (
              <div className="flex items-center justify-center h-64">
                <FaSpinner className="animate-spin h-8 w-8 text-blue-600" />
              </div>
            ) : pdfBlobUrl ? (
              <embed
                src={pdfBlobUrl}
                type="application/pdf"
                className="w-full h-full min-h-96 border-0"
                style={{ minHeight: '500px' }}
              />
            ) : (
              <p className="text-center text-red-600">Failed to load PDF</p>
            )}
          </div>

          {/* Fallback Link */}
          {pdfBlobUrl && (
            <div className="p-2 text-center text-xs text-gray-500">
              <a href={pdfBlobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                Open in new tab (if PDF doesn't show)
              </a>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
}