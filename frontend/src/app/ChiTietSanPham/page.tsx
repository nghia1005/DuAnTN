"use client";
import React from "react";
import ProductDetailTable from './ProductDetailTable';
import AdminLayout from "@/component/Admin-Layout";

export default function ChiTietSanPhamPage() {
  return (
    <AdminLayout activeMenu="products" activeSubMenu="product-details-list" onMenuChangeAction={() => {}} pageTitle="Chi tiết sản phẩm">
      <ProductDetailTable />
    </AdminLayout>
  );
}