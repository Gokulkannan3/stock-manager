// src/pages/AllBookings/AllBookings.jsx
import React, { useState, useEffect } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import Logout from '../Logout';
import Modal from 'react-modal';
import { API_BASE_URL } from '../../../Config';
import { FaEye, FaDownload, FaTimes, FaSpinner } from 'react-icons/fa';

Modal.setAppElement("#root");

export default function AllBookings() {
  const [bookings, setBookings] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pdfBlobUrl, setPdfBlobUrl] = useState('');
  const [loadingPDF, setLoadingPDF] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/booking`)
      .then(res => res.json())
      .then(data => setBookings(data))
      .catch(() => alert('Failed to load bookings'));
  }, []);

  const viewBill = async (booking) => {
    setSelectedBill(booking);
    setShowModal(true);
    setLoadingPDF(true);
    setPdfBlobUrl('');

    try {
      const res = await fetch(`${API_BASE_URL}${booking.pdf_path}`);
      if (!res.ok) throw new Error('Failed to load PDF');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPdfBlobUrl(url);
    } catch (err) {
      alert('Could not load PDF: ' + err.message);
    } finally {
      setLoadingPDF(false);
    }
  };

  const downloadPDF = () => {
    if (!selectedBill) return;
    const link = document.createElement('a');
    link.href = `${API_BASE_URL}${selectedBill.pdf_path}`;
    link.download = `${selectedBill.bill_number}.pdf`;
    link.click();
  };

  // Clean up blob URL
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
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl md:text-2xl font-bold text-center mb-6 text-gray-900 dark:text-gray-100">
            All Bookings
          </h2>

          {/* Mobile-First Responsive Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {bookings.map(b => (
              <div
                key={b.id}
                className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
              >
                <p className="font-semibold text-sm md:text-base text-gray-900 dark:text-gray-100 truncate">
                  {b.customer_name}
                </p>
                <p className="text-xs md:text-sm text-white">
                  Bill: <span className="font-mono">{b.bill_number}</span>
                </p>
                <p className="text-xs text-sky-500 truncate">
                  {b.from} to {b.to}
                </p>
                <button
                  onClick={() => viewBill(b)}
                  className="mt-3 w-full bg-blue-600 hover:bg-blue-700 text-white py-1.5 rounded text-xs md:text-sm flex items-center justify-center gap-1 transition"
                >
                  <FaEye className="h-3 w-3 md:h-4 md:w-4" /> View
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* PDF Modal – Works on iPhone, Android, Desktop */}
      <Modal
        isOpen={showModal}
        onRequestClose={() => setShowModal(false)}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full mx-4 my-8 outline-none overflow-hidden"
        overlayClassName="fixed inset-0 bg-black/50 bg-opacity-60 flex items-center justify-center z-50 p-4"
        closeTimeoutMS={200}
      >
        {selectedBill && (
          <div className="flex flex-col h-full max-h-screen">
            {/* Header */}
            <div className="flex justify-between items-center p-4 border-b dark:border-gray-700">
              <h2 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100">
                Bill: {selectedBill.bill_number}
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={downloadPDF}
                  className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded text-sm flex items-center gap-1 transition"
                >
                  <FaDownload className="h-3 w-3" /> Download
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 bg-gray-600 hover:bg-gray-700 text-white rounded text-sm flex items-center gap-1 transition"
                >
                  <FaTimes className="h-3 w-3" /> Close
                </button>
              </div>
            </div>

            {/* PDF Viewer – <embed> is universal */}
            <div className="flex-1 bg-gray-50 dark:bg-gray-900 p-2 md:p-4 overflow-auto">
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

            {/* Fallback for very old browsers */}
            {pdfBlobUrl && (
              <div className="p-2 text-center text-xs text-gray-500">
                <a href={pdfBlobUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
                  Open in new tab (if PDF doesn't show)
                </a>
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}