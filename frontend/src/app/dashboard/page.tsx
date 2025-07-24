"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import KhachHang from "../KhachHang/khachHang";
import NhanVienPage from "../NhanVien/page";
import CounterInvoiceList from "../invoices/CounterInvoiceList";
import OnlineInvoice from "../invoices/OnlineInvoice";
// import CounterInvoiceList from './invoices/CounterInvoiceList';
import dynamic from 'next/dynamic';
import AdminLayout from '../../component/Admin-Layout';

interface SanPhamDTO {
    idSanPham: number;
    maSanPham: string;
    tenSanPham: string;
    tenThuongHieu: string;
    tenDanhMuc: string;
    trangThai: string;
    moTa: string;
}

interface ThuongHieuDTO {
    idThuongHieu: number;
    tenThuongHieu: string;
}

interface DanhMucDTO {
    idDanhMuc: number;
    tenDanhMuc: string;
}

export default function Dashboard() {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [productMenuOpen, setProductMenuOpen] = useState(false);
    const [activeProductSubMenu, setActiveProductSubMenu] = useState("product-details-list");
    const [invoiceMenuOpen, setInvoiceMenuOpen] = useState(false);
    // Đảm bảo state cho menu hóa đơn
    const [activeInvoiceSubMenu, setActiveInvoiceSubMenu] = useState("pos-invoices");
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [globalMessage, setGlobalMessage] = useState<{type: 'success'|'error', text: string}|null>(null);
    const [searchTenSanPham, setSearchTenSanPham] = useState("");
    const [user, setUser] = useState<any>(null);

    const menuItems = [
        {
            id: "dashboard",
            label: "Trang chủ",
            icon: "🏠",
            description: ""
        },
        {
            id: "pos",
            label: "Bán hàng tại quầy",
            icon: "💳",
            description: ""
        },
        {
            id: "products",
            label: "Quản lý sản phẩm",
            icon: "👟",
            description: "",
            children: [
                { id: "product-details-list", label: "Chi tiết sản phẩm" },
                { id: "images", label: "Hình ảnh" },
                { id: "sizes", label: "Kích thước" },
                { id: "colors", label: "Màu sắc" },
                { id: "brands", label: "Thương hiệu" },
                { id: "categories", label: "Danh mục" }
            ]
        },
        {
            id: "employees",
            label: "Quản lý nhân viên",
            icon: "👥",
            description: ""
        },
        {
            id: "customers",
            label: "Quản lý khách hàng",
            icon: "👤",
            description: ""
        },
        {
            id: "invoices",
            label: "Hóa đơn",
            icon: "🧾",
            description: "",
            children: [
                { id: "pos-invoices", label: "Hóa đơn tại quầy" },
                { id: "online-invoices", label: "Hóa đơn online" }
            ]
        },
        {
            id: "statistics",
            label: "Thống kê",
            icon: "📊",
            description: ""
        },
        {
            id: "promotions",
            label: "Khuyến mãi",
            icon: "🎉",
            description: ""
        }
    ];

    const renderProductSubContent = () => {
        switch (activeProductSubMenu) {
            case "images":
                return <div className="dashboard-content"><h2>Quản lý Hình ảnh</h2></div>;
            case "sizes":
                return <div className="dashboard-content"><h2>Quản lý Kích thước</h2></div>;
            case "colors":
                return <div className="dashboard-content"><h2>Quản lý Màu sắc</h2></div>;
            case "brands":
                return <div className="dashboard-content"><h2>Quản lý Thương hiệu</h2></div>;
            case "categories":
                return <div className="dashboard-content"><h2>Quản lý Danh mục</h2></div>;
            default:
                return null;
        }
    };

    // Đã tách hóa đơn ra route riêng, không render ở dashboard nữa
    const renderInvoiceSubContent = () => {
        if (activeInvoiceSubMenu === "pos-invoices") {
            return <CounterInvoiceList />;
        }
        if (activeInvoiceSubMenu === "online-invoices") {
            return <OnlineInvoice />;
        }
        return null;
    };

    function handleLogout() {
        localStorage.removeItem('token');
        router.push('/login');
    }

    const renderSidebar = () => (
        <div style={{ width: 260, background: '#fffbe6', minHeight: '100vh', borderRight: '1px solid #eee', padding: '32px 0', borderRadius: 0 }}>
            {menuItems.map(item => (
                <React.Fragment key={item.id}>
                    <div
                        onClick={() => {
                            if (item.id === "products") {
                                setProductMenuOpen(v => !v);
                                setActiveMenu("products");
                            } else if (item.id === "invoices") {
                                setInvoiceMenuOpen(v => !v);
                                setActiveMenu("invoices");
                            } else {
                                setActiveMenu(item.id);
                            }
                        }}
                        style={{
                            padding: '14px 36px',
                            cursor: 'pointer',
                            background: activeMenu === item.id ? '#b59d3a22' : 'transparent',
                            color: activeMenu === item.id ? '#b59d3a' : '#6b4f1d',
                            fontWeight: activeMenu === item.id ? 700 : 500,
                            borderLeft: activeMenu === item.id ? '4px solid #b59d3a' : '4px solid transparent',
                            transition: 'all 0.2s',
                            display: 'flex',
                            alignItems: 'center',
                            userSelect: 'none'
                        }}
                    >
                        <span style={{fontSize: 20, marginRight: 16}}>{item.icon}</span>
                        {item.label}
                        {item.children && (
                            <span style={{marginLeft: 'auto', fontSize: 16}}>
                                {item.id === "products" ? (productMenuOpen ? '▼' : '▶') :
                                    item.id === "invoices" ? (invoiceMenuOpen ? '▼' : '▶') : ''}
                            </span>
                        )}
                    </div>
                    {item.children && (
                        item.id === "products" ? (productMenuOpen && activeMenu === "products") :
                            item.id === "invoices" ? (invoiceMenuOpen && activeMenu === "invoices") :
                                false
                    ) && (
                        <div style={{marginLeft: 24, borderLeft: '2px solid #f3e9c7', background: '#fffbe6', borderRadius: 8}}>
                            {item.children.map(child => (
                                <div
                                    key={child.id}
                                    onClick={e => {
                                        e.stopPropagation();
                                        if (item.id === "products") {
                                            setActiveProductSubMenu(child.id);
                                            setActiveMenu("products");
                                        } else if (item.id === "invoices") {
                                            setActiveInvoiceSubMenu(child.id);
                                            setActiveMenu("invoices");
                                        }
                                    }}
                                    style={{
                                        padding: '10px 32px',
                                        cursor: 'pointer',
                                        background: (item.id === "products" ? activeProductSubMenu === child.id :
                                            item.id === "invoices" ? activeInvoiceSubMenu === child.id : false)
                                            ? '#b59d3a33' : 'transparent',
                                        color: (item.id === "products" ? activeProductSubMenu === child.id :
                                            item.id === "invoices" ? activeInvoiceSubMenu === child.id : false)
                                            ? '#b59d3a' : '#6b4f1d',
                                        fontWeight: (item.id === "products" ? activeProductSubMenu === child.id :
                                            item.id === "invoices" ? activeInvoiceSubMenu === child.id : false)
                                            ? 700 : 500,
                                        borderLeft: (item.id === "products" ? activeProductSubMenu === child.id :
                                            item.id === "invoices" ? activeInvoiceSubMenu === child.id : false)
                                            ? '4px solid #b59d3a' : '4px solid transparent',
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {child.label}
                                </div>
                            ))}
                        </div>
                    )}
                </React.Fragment>
            ))}
        </div>
    );

    const renderContent = () => {
        if (activeMenu === "products") {
            return renderProductSubContent();
        }
        if (activeMenu === "invoices") {
            return renderInvoiceSubContent();
        }
        switch (activeMenu) {
            case "dashboard":
                return (
                    <div className="dashboard-home" style={{
                        padding: '60px 40px 40px 40px',
                        textAlign: 'center'
                    }}>
                        <img src="/logo.jpg" alt="Logo SoleKing" style={{
                            width: 110,
                            height: 110,
                            objectFit: 'contain',
                            borderRadius: 24,
                            boxShadow: '0 4px 24px #b59d3a33',
                            background: '#fffbe6',
                            marginBottom: 24,
                            border: '2.5px solid #b59d3a',
                            display: 'inline-block'
                        }} />
                        <h2 style={{
                            color: '#6b4f1d',
                            fontSize: '2.3rem',
                            fontWeight: 700,
                            margin: 0,
                            marginBottom: 8
                        }}>
                            Chào mừng đến với <span style={{color: '#b59d3a'}}>SoleKing Store</span>!
                        </h2>
                        <p style={{
                            color: '#b59d3a',
                            fontSize: '1.2rem',
                            marginTop: 0,
                            marginBottom: 32,
                            fontWeight: 500,
                            letterSpacing: 0.6,
                            maxWidth: 520,
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }}>
                            SoleKing Store – Nâng tầm phong cách, khẳng định chất riêng trên từng bước chân
                        </p>
                        <div style={{
                            color: '#6b4f1d',
                            fontSize: '1.1rem',
                            fontWeight: 400,
                            lineHeight: 1.8,
                            maxWidth: 520,
                            marginLeft: 'auto',
                            marginRight: 'auto'
                        }}>
                            <p>Hệ thống quản lý bán hàng toàn diện</p>
                            <p>Quản lý sản phẩm, khách hàng, nhân viên và báo cáo</p>
                            <p>Giao diện thân thiện, dễ sử dụng</p>
                        </div>
                        <footer style={{
                            marginTop: 60,
                            padding: '24px 0',
                            borderTop: '1px solid #e6d8b4',
                            color: '#6b4f1d',
                            fontSize: '0.9rem'
                        }}>
                            <div style={{marginBottom: 16, color:'#b59d3a', fontSize:'1.1rem', fontWeight: 600}}>
                                SoleKing Store Management System
                            </div>
                            <div style={{marginBottom: 8, color:'#6b4f1d', fontSize:'0.95rem', fontWeight: 400}}>
                                Phiên bản 1.0 - Hệ thống quản lý bán hàng
                            </div>
                            <div style={{marginTop: 16, color:'#6b4f1d', fontSize:'0.95rem', fontWeight: 400}}>
                                © 2025 SoleKing Store. All rights reserved.
                            </div>
                        </footer>
                    </div>
                );
            case "employees":
                return (
                    <div className="dashboard-content">
                        <NhanVienPage />
                    </div>
                );
            case "customers":
                return (
                    <div className="dashboard-content">
                        <KhachHang />
                    </div>
                );
            case "statistics":
                return (
                    <div className="dashboard-content">
                        <h2>Thống kê báo cáo</h2>
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <h3>Thống kê báo cáo</h3>
                            <p>Chức năng thống kê báo cáo sẽ được phát triển ở đây...</p>
                        </div>
                    </div>
                );
            case "promotions":
                return null;
            default:
                return (
                    <div className="dashboard-content">
                        <h2>Chào mừng đến với SoleKingStore</h2>
                        <p>Vui lòng chọn menu từ sidebar để bắt đầu.</p>
                    </div>
                );
        }
    };

    useEffect(() => {
        const userData = localStorage.getItem('user');
        if (userData) {
            setUser(JSON.parse(userData));
        }
    }, []);

    return (
        <AdminLayout
            activeMenu={activeMenu}
            onMenuChangeAction={setActiveMenu}
            pageTitle={menuItems.find(item => item.id === activeMenu)?.label || 'Dashboard'}
        >
            {renderContent()}
        </AdminLayout>
    );
}