import React, { useState, useEffect } from 'react';
import { FaPlus, FaTrash, FaFilePdf, FaSpinner, FaCheckCircle, FaSearch, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import { Document, Page, Text, View, StyleSheet, PDFViewer, pdf } from '@react-pdf/renderer';
import { API_BASE_URL } from '../../../Config';
import Select from 'react-select';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';

const pdfStyles = StyleSheet.create({
  page: { padding: 40 },
  title: { fontSize: 36, textAlign: "center", marginBottom: 6, fontWeight: "bold", color: "#b91c1c" },
  tagline: { fontSize: 11, textAlign: "center", marginBottom: 30, color: "#666", fontStyle: "italic" },
  header: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  customerInfo: { flex: 1 },
  challanInfo: { width: 200, textAlign: "right" },
  label: { fontSize: 12, fontWeight: "bold", marginBottom: 4 },
  valueBold: { fontSize: 16, fontWeight: "bold" },
  value: { fontSize: 11, color: "#444", marginBottom: 3 },
  table: { marginTop: 20, border: "1px solid #000" },
  row: { flexDirection: "row" },
  headerCell: { padding: 10, fontSize: 10, fontWeight: "bold", textAlign: "center", backgroundColor: "#1e3a8a", color: "white" },
  cell: { padding: 8, fontSize: 10, textAlign: "center", borderBottom: "0.5px solid #ccc" },
  totalBox: { marginTop: 30, padding: 16, backgroundColor: "#fef3c7", borderRadius: 10, alignItems: "center" },
  totalText: { fontSize: 16, fontWeight: "bold", color: "#92400e" },
  transportBox: { marginTop: 35, padding: 18, backgroundColor: "#f0f9ff", borderRadius: 10, fontSize: 12, border: "1px dashed #3b82f6" },
  footer: { position: "absolute", bottom: 40, left: 0, right: 0, textAlign: "center", fontSize: 9, color: "#666" },
});

const ChallanPDF = ({ data }) => {
  const totalCases = data.items.reduce((s, i) => s + i.cases, 0);
  const totalQty = data.items.reduce((s, i) => s + i.cases * i.per_case, 0);

  return (
    <Document>
      <Page size="A4" style={pdfStyles.page}>
        <Text style={pdfStyles.title}>DELIVERY CHALLAN</Text>
        <Text style={pdfStyles.tagline}>Goods Once Sold Will Not Be Taken Back or Exchanged</Text>

        <View style={pdfStyles.header}>
          <View style={pdfStyles.customerInfo}>
            <Text style={pdfStyles.label}>To:</Text>
            <Text style={pdfStyles.valueBold}>{data.customer_name}</Text>
            {data.address && <Text style={pdfStyles.value}>{data.address}</Text>}
            {data.gstin && <Text style={pdfStyles.value}>GSTIN: {data.gstin}</Text>}
            <Text style={pdfStyles.value}>By: {data.created_by}</Text>
          </View>
          <View style={pdfStyles.challanInfo}>
            <Text style={{ fontSize: 13 }}>Date: {new Date().toLocaleDateString("en-IN")}</Text>
            <Text style={{ fontSize: 11, marginTop: 8 }}>Challan No: <Text style={{ fontWeight: "bold" }}>{data.challan_number}</Text></Text>
          </View>
        </View>

        <View style={pdfStyles.table}>
          <View style={pdfStyles.row}>
            <Text style={[pdfStyles.headerCell, { width: "7%" }]}>S.No</Text>
            <Text style={[pdfStyles.headerCell, { width: "20%" }]}>Brand</Text>
            <Text style={[pdfStyles.headerCell, { width: "38%" }]}>Product</Text>
            <Text style={[pdfStyles.headerCell, { width: "11%" }]}>Cases</Text>
            <Text style={[pdfStyles.headerCell, { width: "11%" }]}>Per</Text>
            <Text style={[pdfStyles.headerCell, { width: "11%" }]}>Qty</Text>
            <Text style={[pdfStyles.headerCell, { width: "22%" }]}>Godown</Text>
          </View>
          {data.items.map((item, i) => (
            <View style={pdfStyles.row} key={i}>
              <Text style={[pdfStyles.cell, { width: "7%" }]}>{i + 1}</Text>
              <Text style={[pdfStyles.cell, { width: "20%" }]}>{item.brand || ''}</Text>
              <Text style={[pdfStyles.cell, { width: "38%" }]}>{item.productname}</Text>
              <Text style={[pdfStyles.cell, { width: "11%" }]}>{item.cases}</Text>
              <Text style={[pdfStyles.cell, { width: "11%" }]}>{item.per_case}</Text>
              <Text style={[pdfStyles.cell, { width: "11%" }]}>{item.cases * item.per_case}</Text>
              <Text style={[pdfStyles.cell, { width: "22%", color: "#dc2626", fontWeight: "bold" }]}>{item.godown}</Text>
            </View>
          ))}
        </View>

        <View style={pdfStyles.totalBox}>
          <Text style={pdfStyles.totalText}>Total Cases: {totalCases}  |  Total Quantity: {totalQty}</Text>
        </View>

        <View style={pdfStyles.transportBox}>
          <Text style={{ fontSize: 15, fontWeight: "bold", marginBottom: 10, color: "#1e40af" }}>Transport Details</Text>
          <Text>From      : {data.from || 'SIVAKASI'}</Text>
          <Text>To        : {data.to}</Text>
          <Text>Through   : <Text style={{ fontWeight: "bold", color: "#dc2626" }}>{data.through}</Text></Text>
          {data.lr_number && <Text>LR Number : <Text style={{ fontWeight: "bold", color: "#dc2626" }}>{data.lr_number}</Text></Text>}
        </View>

        <Text style={pdfStyles.footer}>
          This is a computer-generated Delivery Challan • Subject to Sivakasi Jurisdiction
        </Text>
      </Page>
    </Document>
  );
};

export default function Delivery() {
  const [godowns, setGodowns] = useState([]);
  const [selectedGodown, setSelectedGodown] = useState(null);
  const [stock, setStock] = useState([]);
  const [cart, setCart] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [globalProducts, setGlobalProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [showPDF, setShowPDF] = useState(false);
  const [pdfData, setPdfData] = useState(null);
  const [isCustomerOpen, setIsCustomerOpen] = useState(true);

  const [customer, setCustomer] = useState({
    name: '', address: '', gstin: '', lr_number: '', from: 'SIVAKASI', to: '', through: ''
  });

  // SAFE USER PARSING - NO CRASH EVEN IF "admin" IS STORED AS STRING
  const usernameFromStorage = localStorage.getItem('username');
  const created_by = (() => {
    if (!usernameFromStorage) return 'Admin';
    try {
      const parsed = JSON.parse(usernameFromStorage);
      return (typeof parsed === 'object' && parsed.name) ? parsed.name : parsed;
    } catch {
      return usernameFromStorage.trim() || 'Admin';
    }
  })();

  const shortenGodownName = (name) => 
    name?.replace(/_/g, ' ').trim().split(/\s+/).map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase()).join('') || '';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/godown`)
      .then(r => r.json())
      .then(d => setGodowns(d.map(g => ({ value: g.id, label: g.name, shortName: shortenGodownName(g.name) }))));
  }, []);

  useEffect(() => {
    if (selectedGodown) {
      fetch(`${API_BASE_URL}/api/godown/stock/${selectedGodown.value}`)
        .then(r => r.json())
        .then(data => setStock(data.map(i => ({ ...i, id: Number(i.id) }))));
    }
  }, [selectedGodown]);

  useEffect(() => {
    const t = setTimeout(() => {
      if (searchQuery.length >= 2) {
        fetch(`${API_BASE_URL}/api/search/global?name=${searchQuery}`)
          .then(r => r.json())
          .then(data => data.map(p => ({ ...p, shortGodown: shortenGodownName(p.godown_name) })))
          .then(setGlobalProducts);
      } else setGlobalProducts([]);
    }, 400);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const addToCart = (item) => {
    if (cart.some(i => i.id === item.id)) return setError('Already in cart');
    setCart(prev => [...prev, {
      ...item,
      cases: 1,
      godown: selectedGodown?.shortName || shortenGodownName(item.godown_name) || item.godown_name
    }]);
  };

  const updateCases = (idx, val) => {
    const cases = Math.max(1, Math.min(val, cart[idx].current_cases || 999));
    setCart(prev => prev.map((i, i2) => i2 === idx ? { ...i, cases } : i));
  };

  const removeFromCart = (idx) => setCart(prev => prev.filter((_, i) => i !== idx));

  const generateChallan = async () => {
    if (!customer.name || !customer.to || !customer.through || cart.length === 0) {
      return setError('Fill all required fields');
    }

    setLoading(true);
    const payload = {
      ...customer,
      items: cart.map(i => ({
        id: i.id,
        productname: i.productname,
        brand: i.brand,
        cases: i.cases,
        per_case: i.per_case || 1,
        godown: i.godown
      })),
      created_by
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/challan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed');

      setPdfData({ ...payload, challan_number: data.challan_number, created_by });
      setShowPDF(true);
      setSuccess(`Challan ${data.challan_number} Created by ${created_by}!`);
      setCart([]);
      setCustomer(prev => ({ ...prev, name: '', to: '', through: '', address: '', gstin: '', lr_number: '' }));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      <Sidebar />
      <Logout />

      <div className="flex-1 p-4 mobile:p-3 pt-20">
        <div className="hundred:max-w-5xl onefifty:max-w-2xl mobile:max-w-lg mx-auto">

          <h2 className="text-4xl mobile:text-2xl font-bold text-center mb-8 mobile:mb-6 text-black dark:text-white">Create Delivery Challan</h2>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 p-4 mobile:p-3 rounded mb-6 mobile:mb-4 text-sm mobile:text-xs">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 p-4 mobile:p-3 rounded mb-6 mobile:mb-4 flex items-center gap-2 text-sm mobile:text-xs"><FaCheckCircle /> {success}</div>}

          {/* Customer Details */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <button onClick={() => setIsCustomerOpen(!isCustomerOpen)} className="w-full p-5 mobile:p-4 flex justify-between items-center text-xl mobile:text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-t-xl">
              Customer Details {isCustomerOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isCustomerOpen && (
              <div className="p-6 mobile:p-4 grid grid-cols-1 mobile:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-4 mobile:gap-3">
                <input placeholder="Party Name *" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 border text-sm mobile:text-xs focus:ring-2 focus:ring-blue-500" />
                <input placeholder="Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 border text-sm mobile:text-xs" />
                <input placeholder="GSTIN" value={customer.gstin} onChange={e => setCustomer({ ...customer, gstin: e.target.value })} className="rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 border text-sm mobile:text-xs" />
                <input placeholder="L.R. Number" value={customer.lr_number} onChange={e => setCustomer({ ...customer, lr_number: e.target.value })} className="rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 border text-sm mobile:text-xs" />
                <input placeholder="From" value={customer.from} onChange={e => setCustomer({ ...customer, from: e.target.value })} className="rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 border text-sm mobile:text-xs" />
                <input placeholder="To *" value={customer.to} onChange={e => setCustomer({ ...customer, to: e.target.value })} className="rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 border text-sm mobile:text-xs" />
                <input placeholder="Through *" value={customer.through} onChange={e => setCustomer({ ...customer, through: e.target.value })} className="rounded-lg px-4 mobile:px-3 py-3 mobile:py-2.5 border text-sm mobile:text-xs" />
              </div>
            )}
          </div>

          {/* Cart Table */}
          {cart.length > 0 && (
            <div className="bg-white rounded-xl shadow-lg p-6 mobile:p-4 mb-8 overflow-x-auto hundred:w-full onefifty:w-full mobile:w-[405px]">
              <h3 className="text-2xl mobile:text-xl font-bold mb-4 mobile:mb-3 text-gray-800">Cart Items</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm mobile:text-xs border-collapse">
                  <thead>
                    <tr className="bg-gradient-to-r from-gray-800 to-gray-900 text-white text-lg mobile:text-sm">
                      <th className="p-3 mobile:p-2 border">S.No</th>
                      <th className="p-3 mobile:p-2 border">Brand</th>
                      <th className="p-3 mobile:p-2 border">Product</th>
                      <th className="p-3 mobile:p-2 border">Cases</th>
                      <th className="p-3 mobile:p-2 border">Per</th>
                      <th className="p-3 mobile:p-2 border">Qty</th>
                      <th className="p-3 mobile:p-2 border">Godown</th>
                      <th className="p-3 mobile:p-2 border">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cart.map((item, i) => (
                      <tr key={i} className="hover:bg-gray-50 transition text-lg mobile:text-sm font-semibold">
                        <td className="p-3 mobile:p-2 border text-center font-medium">{i + 1}</td>
                        <td className="p-3 mobile:p-2 border text-center  text-black">{item.brand || '-'}</td>
                        <td className="p-3 mobile:p-2 text-center border">{item.productname}</td>
                        <td className="p-3 mobile:p-2 border text-center">
                          <input
                            type="number"
                            min="1"
                            max={item.current_cases || 999}
                            value={item.cases}
                            onChange={e => updateCases(i, parseInt(e.target.value) || 1)}
                            className="w-20 mobile:w-16 p-2 mobile:p-1.5 border-2 rounded-lg text-center font-bold focus:ring-4 focus:ring-blue-300 focus:border-blue-600 outline-none"
                            autoFocus={i === cart.length - 1}
                          />
                        </td>
                        <td className="p-3 mobile:p-2 border text-center">{item.per_case || 1}</td>
                        <td className="p-3 mobile:p-2 border border-black text-center font-bold text-green-600">{item.cases * (item.per_case || 1)}</td>
                        <td className="p-3 mobile:p-2 border border-black text-center text-red-600 font-bold">{item.godown}</td>
                        <td className="p-3 mobile:p-2 border text-center">
                          <button onClick={() => removeFromCart(i)} className="text-red-600 hover:text-red-800 text-lg mobile:text-base"><FaTrash /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Global Search */}
          <div className="bg-white p-6 mobile:p-4 rounded-xl shadow mb-6">
            <div className="relative mb-4">
              <FaSearch className="absolute left-4 mobile:left-3 top-4 mobile:top-3.5 text-gray-500 text-xl mobile:text-lg" />
              <input
                placeholder="Search products..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-12 mobile:pl-10 pr-4 py-4 mobile:py-3.5 border-2 rounded-xl text-lg mobile:text-base focus:ring-4 focus:ring-blue-300 outline-none"
              />
            </div>
            {globalProducts.length > 0 && (
              <div className="max-h-64 mobile:max-h-56 overflow-y-auto border-2 rounded-xl bg-gray-50">
                {globalProducts.map(p => (
                  <div key={p.id} className="p-4 mobile:p-3 border-b hover:bg-blue-50 cursor-pointer transition text-sm mobile:text-xs" onClick={() => { addToCart(p); setSearchQuery(''); setGlobalProducts([]); }}>
                    <div className="flex justify-between items-center">
                      <div>
                        <strong className="text-lg mobile:text-base">{p.productname}</strong>
                        <span className="text-blue-700 font-medium ml-2 mobile:ml-1 text-sm mobile:text-xs">({p.brand})</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-red-600 text-base mobile:text-sm">{p.shortGodown}</div>
                        <div className="text-xs mobile:text-[10px]">Cases: {p.current_cases} • ₹{p.rate_per_box}/box</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <Select options={godowns} value={selectedGodown} onChange={setSelectedGodown} placeholder="Select Godown" className="mb-8 mobile:mb-6 text-base mobile:text-sm" />

          {selectedGodown && stock.length > 0 && (
            <div className="grid grid-cols-2 mobile:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5 mobile:gap-4 mb-10">
              {stock.map(item => (
                <div key={item.id} className="border-2 rounded-xl p-5 mobile:p-4 bg-white shadow hover:shadow-xl transition text-sm mobile:text-xs">
                  <h4 className="font-bold text-base mobile:text-sm text-gray-800 truncate">{item.productname}</h4>
                  <p className="text-gray-600 mt-1">Brand: <span className="font-semibold text-blue-700">{item.brand || 'N/A'}</span></p>
                  <p className="text-gray-600">Cases Left: <span className="font-bold text-green-600">{item.current_cases}</span></p>
                  <button onClick={() => addToCart(item)} className="mt-4 w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white font-bold py-3 mobile:py-2.5 rounded-lg hover:from-blue-700 hover:to-indigo-800 transition text-sm mobile:text-xs">
                    Add to Cart
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-center mt-12 mobile:mt-8">
            <button
              onClick={generateChallan}
              disabled={loading || cart.length === 0}
              className="w-full mobile:w-11/12 max-w-2xl bg-gradient-to-r from-cyan-500 to-blue-700 text-white font-bold py-6 mobile:py-5 text-2xl mobile:text-xl rounded-3xl shadow-2xl hover:shadow-cyan-500/50 disabled:opacity-50"
            >
              {loading ? <>Generating... <FaSpinner className="inline ml-3 animate-spin" /></> : 'Generate Delivery Challan'}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPDF && pdfData && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 mobile:p-2">
          <div className="bg-white rounded-3xl w-full max-w-5xl mobile:max-w-full mobile:mx-2 h-5/6 mobile:h-full flex flex-col shadow-2xl">
            <div className="bg-gradient-to-r from-cyan-600 to-blue-700 text-white p-6 mobile:p-4 rounded-t-3xl mobile:rounded-t-xl flex justify-between items-center">
              <h3 className="text-3xl mobile:text-xl font-bold">Delivery Challan: {pdfData.challan_number}</h3>
              <button onClick={() => setShowPDF(false)} className="text-5xl mobile:text-4xl hover:text-red-300">×</button>
            </div>
            <PDFViewer width="100%" height="100%" className="flex-1">
              <ChallanPDF data={pdfData} />
            </PDFViewer>
            <div className="p-6 mobile:p-4 bg-gray-100 text-center">
              <button
                onClick={async () => {
                  const blob = await pdf(<ChallanPDF data={pdfData} />).toBlob();
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url; a.download = `Challan_${pdfData.challan_number}.pdf`; a.click();
                }}
                className="bg-green-600 hover:bg-green-700 text-white px-10 mobile:px-8 py-4 mobile:py-3 rounded-xl font-bold text-xl mobile:text-lg shadow-lg"
              >
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}