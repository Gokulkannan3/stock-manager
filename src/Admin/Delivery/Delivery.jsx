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
          <Text>From      : {data.from}</Text>
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
    name: '', address: '', gstin: '', lr_number: '', from: '', to: '', through: ''
  });

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const created_by = user.name || user.email || 'Admin';

  const shortenGodownName = (name) => name?.replace(/_/g, ' ').trim().split(/\s+/).map(w => /^\d+$/.test(w) ? w : w.charAt(0).toUpperCase()).join('') || '';

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/godown`).then(r => r.json()).then(d => {
      setGodowns(d.map(g => ({ value: g.id, label: g.name, shortName: shortenGodownName(g.name) })));
    });
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
    setCart(prev => [...prev, { ...item, cases: 1, godown: selectedGodown?.shortName || item.godown_name }]);
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
      setCustomer({ ...customer, name: '', to: '', through: '', from: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* Your existing Sidebar & Logout */}
      <Sidebar/>
      <Logout/>

      <div className="flex-1 p-4 mobile:p-2 pt-20 mt-10">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl mobile:text-2xl font-bold text-center mb-6 text-black dark:text-white">Create Delivery Challan</h2>

          {error && <div className="bg-red-100 border border-red-400 text-red-700 p-4 rounded mb-4 mobile:text-sm">{error}</div>}
          {success && <div className="bg-green-100 border border-green-400 text-green-700 p-4 rounded mb-4 flex items-center gap-2 mobile:text-sm"><FaCheckCircle /> {success}</div>}

          {/* Customer Details - Mobile Friendly */}
          <div className="bg-white rounded-xl shadow-lg mb-6">
            <button onClick={() => setIsCustomerOpen(!isCustomerOpen)} className="w-full p-4 mobile:p-3 flex justify-between items-center text-xl mobile:text-lg font-bold bg-gray-600 text-white">
              Customer Details {isCustomerOpen ? <FaChevronUp /> : <FaChevronDown />}
            </button>
            {isCustomerOpen && (
              <div className="p-4 mobile:p-3 grid grid-cols-2 mobile:gap-3 gap-4">
                <input placeholder="Party Name *" value={customer.name} onChange={e => setCustomer({ ...customer, name: e.target.value })} className="rounded px-3 py-2 border text-sm" />
                <input placeholder="Address" value={customer.address} onChange={e => setCustomer({ ...customer, address: e.target.value })} className="rounded px-3 py-2 border text-sm" />
                <input placeholder="GSTIN" value={customer.gstin} onChange={e => setCustomer({ ...customer, gstin: e.target.value })} className="rounded px-3 py-2 border text-sm" />
                <input placeholder="L.R. Number" value={customer.lr_number} onChange={e => setCustomer({ ...customer, lr_number: e.target.value })} className="rounded px-3 py-2 border text-sm" />
                <input placeholder="From" value={customer.from} onChange={e => setCustomer({ ...customer, from: e.target.value })} className="rounded px-3 py-2 border text-sm" />
                <input placeholder="To *" value={customer.to} onChange={e => setCustomer({ ...customer, to: e.target.value })} className="rounded px-3 py-2 border text-sm" />
                <input placeholder="Through *" value={customer.through} onChange={e => setCustomer({ ...customer, through: e.target.value })} className="rounded px-3 py-2 border text-sm" />
              </div>
            )}
          </div>

          {/* Cart */}
          {cart.length > 0 && (
            <div className="bg-white rounded-lg shadow p-4 mb-6">
              <table className="w-full text-sm border-collapse">
                <thead><tr className="bg-gray-100"><th className="p-2 border">S.No</th><th>Product</th><th>Cases</th><th>Per</th><th>Qty</th><th>Godown</th><th></th></tr></thead>
                <tbody>
                  {cart.map((item, i) => (
                    <tr key={i}>
                      <td className="p-2 border text-center">{i + 1}</td>
                      <td className="p-2 border">{item.productname}</td>
                      <td className="p-2 border text-center">
                        <input type="number" value={item.cases} onChange={e => updateCases(i, parseInt(e.target.value) || 1)} className="w-16 p-1 border rounded" />
                      </td>
                      <td className="p-2 border text-center">{item.per_case}</td>
                      <td className="p-2 border text-center">{item.cases * item.per_case}</td>
                      <td className="p-2 border text-center">{item.godown}</td>
                      <td className="p-2 border text-center"><button onClick={() => removeFromCart(i)} className="text-red-600"><FaTrash /></button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Global Search & Godown */}
          <div className="bg-white p-4 rounded-lg shadow mb-4">
            <div className="relative mb-4">
              <FaSearch className="absolute left-3 top-3 text-gray-500" />
              <input placeholder="Search products..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-3 py-2 border rounded" />
            </div>
            {globalProducts.length > 0 && (
              <div className="max-h-48 overflow-y-auto border rounded bg-gray-50 p-2">
                {globalProducts.map(p => (
                  <div key={p.id} className="p-2 border-b cursor-pointer hover:bg-blue-50" onClick={() => { addToCart(p); setSearchQuery(''); setGlobalProducts([]); }}>
                    <strong>{p.productname}</strong> ({p.shortGodown}) - ₹{p.rate_per_box} - Cases: {p.current_cases}
                  </div>
                ))}
              </div>
            )}
          </div>

          <Select options={godowns} value={selectedGodown} onChange={setSelectedGodown} placeholder="Select Godown" className="mb-6" />

          {selectedGodown && stock.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              {stock.map(item => (
                <div key={item.id} className="border p-3 rounded bg-gray-50">
                  <p className="font-bold text-sm">{item.productname}</p>
                  <p className="text-xs">Cases: {item.current_cases}</p>
                  <button onClick={() => addToCart(item)} className="mt-2 w-full bg-sky-600 text-white py-1 rounded text-sm">Add</button>
                </div>
              ))}
            </div>
          )}
          
          <div className="flex justify-center mt-8">
            <button onClick={generateChallan} disabled={loading || cart.length === 0}
              className="w-full mobile:w-11/12 bg-gradient-to-r from-sky-500 to-blue-600 text-white font-bold py-5 mobile:py-4 text-xl mobile:text-lg rounded-2xl shadow-lg">
              {loading ? <>Generating... <FaSpinner className="inline ml-3 animate-spin" /></> : <>Generate Challan</>}
            </button>
          </div>
        </div>
      </div>

      {/* PDF Modal */}
      {showPDF && pdfData && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-4xl h-5/6 flex flex-col">
            <div className="bg-sky-600 text-white p-6 flex justify-between">
              <h3 className="text-2xl font-bold">Delivery Challan: {pdfData.challan_number}</h3>
              <button onClick={() => setShowPDF(false)} className="text-3xl">×</button>
            </div>
            <PDFViewer width="100%" height="100%" className="flex-1">
              <ChallanPDF data={pdfData} />
            </PDFViewer>
            <div className="p-4 bg-gray-100 text-center">
              <button onClick={async () => {
                const blob = await pdf(<ChallanPDF data={pdfData} />).toBlob();
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `${pdfData.challan_number}.pdf`; a.click();
              }} className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-bold">
                Download PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}