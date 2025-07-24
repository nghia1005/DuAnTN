"use client";
import React from "react";
import AdminLayout from "@/component/Admin-Layout";

const mockStats = {
  revenue: 120000000,
  orders: 320,
  customers: 150,
  bestSeller: {
    name: "Nike Air Max 2024",
    sold: 87
  }
};

export default function ThongKePage() {
  const [activeMenu, setActiveMenu] = React.useState("statistics");
  return (
    <AdminLayout activeMenu={activeMenu} onMenuChangeAction={setActiveMenu} pageTitle="Thống kê">
      <div style={{ padding: 40, background: '#fffbe6', minHeight: '100vh' }}>
        <h1 style={{ fontSize: 32, fontWeight: 700, color: '#6b4f1d', marginBottom: 32 }}>Thống kê tổng quan</h1>
        <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', marginBottom: 40 }}>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #b59d3a22', padding: 32, minWidth: 220 }}>
            <div style={{ fontSize: 18, color: '#b59d3a', marginBottom: 8 }}>Tổng doanh thu</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#27ae60' }}>{mockStats.revenue.toLocaleString()} đ</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #b59d3a22', padding: 32, minWidth: 220 }}>
            <div style={{ fontSize: 18, color: '#b59d3a', marginBottom: 8 }}>Số đơn hàng</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#2980b9' }}>{mockStats.orders}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #b59d3a22', padding: 32, minWidth: 220 }}>
            <div style={{ fontSize: 18, color: '#b59d3a', marginBottom: 8 }}>Số khách hàng</div>
            <div style={{ fontSize: 28, fontWeight: 700, color: '#8e44ad' }}>{mockStats.customers}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #b59d3a22', padding: 32, minWidth: 220 }}>
            <div style={{ fontSize: 18, color: '#b59d3a', marginBottom: 8 }}>Sản phẩm bán chạy</div>
            <div style={{ fontSize: 20, fontWeight: 600, color: '#b59d3a' }}>{mockStats.bestSeller.name}</div>
            <div style={{ fontSize: 16, color: '#6b4f1d' }}>Đã bán: <b>{mockStats.bestSeller.sold}</b> đôi</div>
          </div>
        </div>
        {/* Có thể bổ sung thêm bảng hoặc biểu đồ ở đây nếu muốn */}
        <div style={{ background: '#fff', borderRadius: 16, boxShadow: '0 2px 8px #b59d3a22', padding: 32, marginTop: 32 }}>
          <h2 style={{ color: '#6b4f1d', fontSize: 22, fontWeight: 700, marginBottom: 16 }}>Biểu đồ doanh thu (giả lập)</h2>
          <div style={{ height: 220, display: 'flex', alignItems: 'flex-end', gap: 24 }}>
            {[80, 120, 60, 150, 100, 90, 130].map((v, i) => (
              <div key={i} style={{ width: 36, height: v * 1.2, background: '#b59d3a', borderRadius: 8, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', position: 'relative' }}>
                <span style={{ position: 'absolute', top: -28, left: '50%', transform: 'translateX(-50%)', color: '#6b4f1d', fontWeight: 600 }}>{v}tr</span>
                <span style={{ position: 'absolute', bottom: -24, left: '50%', transform: 'translateX(-50%)', color: '#b59d3a', fontWeight: 500 }}>T{i+1}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
} 