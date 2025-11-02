import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  FaBox, FaList, FaChartBar, FaSearch, FaChartLine, FaBars, FaTimes,
  FaPlus, FaWarehouse, FaAngleDown, FaAngleUp, FaUser, FaMoneyBill, FaMoneyBillAlt
} from 'react-icons/fa';

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isInventoryOpen, setIsInventoryOpen] = useState(false);
  const [isGodownOpen, setIsGodownOpen] = useState(false);

  const userType = localStorage.getItem('userType') || 'worker';

  // -------------------------------------------------
  // Permission matrix
  const can = {
    inventory: userType === 'admin',
    godown: ['admin', 'agent', 'worker'].includes(userType),
    analysis: userType === 'admin',
    search: ['admin', 'agent', 'worker'].includes(userType),
    analytics: userType === 'admin',
    profile: userType === 'admin',
  };
  // -------------------------------------------------

  const navItems = [
    {
      name: 'Inventory',
      allowed: can.inventory,
      icon: <FaBox className="mr-2" />,
      subItems: [
        { name: 'Add Product', path: '/inventory', icon: <FaPlus className="mr-2" /> },
        { name: 'Listing', path: '/listing', icon: <FaList className="mr-2" /> },
      ],
    },
    {
      name: 'Godown',
      allowed: can.godown,
      icon: <FaWarehouse className="mr-2" />,
      subItems: [
        { name: 'Add Godown', path: '/godown', icon: <FaPlus className="mr-2" /> },
        { name: 'View Stocks', path: '/viewstock', icon: <FaList className="mr-2" /> },
      ],
    },
    {
      name: 'Booking',
      allowed: can.inventory,
      icon: <FaMoneyBillAlt className="mr-2" />,
      subItems: [
        { name: 'Book', path: '/book', icon: <FaMoneyBill className="mr-2" /> },
        { name: 'Overall Bookings', path: '/allbookings', icon: <FaList className="mr-2" /> },
      ],
    },
    { name: 'Overall Stocks', path: '/analysis', icon: <FaChartBar className="mr-2" />, allowed: can.analysis },
    { name: 'Search product', path: '/search', icon: <FaSearch className="mr-2" />, allowed: can.search },
    { name: 'Analytics', path: '/analytics', icon: <FaChartLine className="mr-2" />, allowed: can.analytics },
    { name: 'Profile', path: '/profile', icon: <FaUser className="mr-2" />, allowed: can.profile },
  ];

  const toggleSidebar = () => setIsOpen(!isOpen);
  const toggleInventory = () => setIsInventoryOpen(!isInventoryOpen);
  const toggleGodown = () => setIsGodownOpen(!isGodownOpen);

  return (
    <>
      {/* Hamburger for mobile */}
      {!isOpen && (
        <button
          className="hundred:hidden fixed top-4 left-4 z-50 text-white bg-gray-800 p-2 rounded-md"
          onClick={toggleSidebar}
        >
          <FaBars size={24} />
        </button>
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-black/80 text-white flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } hundred:translate-x-0 mobile:w-64 w-64 z-40`}
      >
        <div className="p-4 text-xl font-bold border-b border-gray-700 flex items-center justify-between">
          Admin Panel
          <button className="hundred:hidden text-white" onClick={toggleSidebar}>
            <FaTimes size={20} />
          </button>
        </div>

        <nav className="flex-1 mt-4 overflow-y-auto">
          <ul>
            {navItems.map((item) => {
              if (!item.allowed) return null;               // hide completely

              return (
                <li key={item.name}>
                  {item.subItems ? (
                    <div>
                      <div
                        className="py-3 px-6 text-sm font-bold text-gray-300 flex items-center justify-between cursor-pointer hover:bg-black/50 transition-colors"
                        onClick={item.name === 'Inventory' ? toggleInventory : toggleGodown}
                      >
                        <span className="flex items-center">
                          {item.icon}
                          {item.name}
                        </span>
                        {(item.name === 'Inventory' ? isInventoryOpen : isGodownOpen)
                          ? <FaAngleUp />
                          : <FaAngleDown />}
                      </div>

                      <ul
                        className={`pl-4 overflow-hidden transition-all duration-300 ease-in-out ${
                          (item.name === 'Inventory' ? isInventoryOpen : isGodownOpen)
                            ? 'max-h-96'
                            : 'max-h-0'
                        }`}
                      >
                        {item.subItems.map((sub) => (
                          <li key={sub.name}>
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) =>
                              `flex items-center py-2 px-6 text-sm font-medium hover:bg-black/50 transition-colors ${
                                isActive ? 'bg-gray-900 text-white' : ''
                              }`
                            }
                            onClick={() => setIsOpen(false)}
                          >
                            {sub.icon}
                            {sub.name}
                          </NavLink>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <NavLink
                      to={item.path}
                      className={({ isActive }) =>
                        `flex items-center py-3 px-6 text-sm font-medium hover:bg-black/50 transition-colors ${
                          isActive ? 'bg-gray-900 text-white' : ''
                        }`
                      }
                      onClick={() => setIsOpen(false)}
                    >
                      {item.icon}
                      {item.name}
                    </NavLink>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="hundred:hidden fixed inset-0 bg-black/50 z-30"
          onClick={toggleSidebar}
        />
      )}
    </>
  );
}