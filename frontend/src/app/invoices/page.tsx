"use client";
import React, { useState } from 'react';
import AdminLayout from '../../component/Admin-Layout';
import CounterInvoiceList from './CounterInvoiceList';
import OnlineInvoice from './OnlineInvoice';

export default function InvoicesPage() {
  // State xác định menu con đang active
  const [activeSubMenu, setActiveSubMenu] = useState("counter-invoice");

  // Hàm xử lý khi chọn menu con
  const handleMenuChange = (menuId: string) => {
    setActiveSubMenu(menuId);
  };

  return (
    <AdminLayout
      activeMenu="invoices"
      pageTitle="Hóa đơn"
      activeSubMenu={activeSubMenu}
      onMenuChangeAction={handleMenuChange}
    >
      {activeSubMenu === "counter-invoice" && <CounterInvoiceList />}
      {activeSubMenu === "online-invoice" && <OnlineInvoice />}
    </AdminLayout>
  );
} 