"use client";
import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import KhachHang from "../KhachHang/khachHang";
import AdminLayout from '../../component/Admin-Layout';
import NhanVienPage from "@/app/NhanVien/HienThi/page";
import dayjs from 'dayjs';
import styles from './dashboard.module.css';

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
    const [activeInvoiceSubMenu, setActiveInvoiceSubMenu] = useState("pos-invoices");
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterBrand, setFilterBrand] = useState("");
    const [filterCategory, setFilterCategory] = useState("");
    const [filterStatus, setFilterStatus] = useState("");
    const [globalMessage, setGlobalMessage] = useState<{type: 'success'|'error', text: string}|null>(null);
    const [searchTenSanPham, setSearchTenSanPham] = useState("");
    const [user, setUser] = useState<any>(null);
    const [totalRevenueAll, setTotalRevenueAll] = useState(0);
    const [totalOrdersAll, setTotalOrdersAll] = useState(0);
    const [bestSeller, setBestSeller] = useState<{ name: string, sold: number }>({ name: '', sold: 0 });
    const [totalProductsSold, setTotalProductsSold] = useState(0);
    const [todayRevenue, setTodayRevenue] = useState(0);
    const [monthRevenue, setMonthRevenue] = useState(0);
    const [yearRevenue, setYearRevenue] = useState(0);
    const [todayOrders, setTodayOrders] = useState(0);
    const [successOrders, setSuccessOrders] = useState(0);
    const [cancelledOrders, setCancelledOrders] = useState(0);
    const [deliveredSuccessOrders, setDeliveredSuccessOrders] = useState(0);
    const [deliveredFailedOrders, setDeliveredFailedOrders] = useState(0);

    const menuItems = [
        {
            id: "dashboard",
            label: "Tổng quan",
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
    const renderInvoiceSubContent = () => null;

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
                    <div className={styles.dashboardHome}>
                        <div className={styles.statsRow}>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Tổng số sản phẩm đã bán</div>
                                <div className={styles.statValue}>{totalProductsSold}</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Tổng doanh thu</div>
                                <div className={styles.statValue}>{totalRevenueAll.toLocaleString()} đ</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Sản phẩm bán nhiều nhất</div>
                                <div className={styles.statBest}>{bestSeller.name}</div>
                                <div className={styles.statSub}>Đã bán: <b>{bestSeller.sold}</b> đôi</div>
                            </div>
                        </div>
                        <div className={styles.statsRow}>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Doanh thu hôm nay</div>
                                <div className={styles.statValue}>{todayRevenue.toLocaleString()} đ</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Doanh thu tháng này</div>
                                <div className={styles.statValue}>{monthRevenue.toLocaleString()} đ</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Doanh thu năm nay</div>
                                <div className={styles.statValue}>{yearRevenue.toLocaleString()} đ</div>
                            </div>
                        </div>
                        <div className={styles.statsRow}>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Số đơn bán hôm nay</div>
                                <div className={styles.statValue}>{todayOrders}</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Số đơn giao thành công</div>
                                <div className={styles.statValue}>{deliveredSuccessOrders}</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Số đơn giao thất bại</div>
                                <div className={styles.statValue}>{deliveredFailedOrders}</div>
                            </div>
                            <div className={styles.statBox}>
                                <div className={styles.statTitle}>Số đơn bị hủy</div>
                                <div className={styles.statValue}>{cancelledOrders}</div>
                            </div>
                        </div>
                        <img src="/logo-login.png" alt="Logo SoleKing" className={styles.logo} />
                        <h2 className={styles.welcomeTitle}>
                            Chào mừng đến với <span className={styles.brand}>SoleKing Store</span>!
                        </h2>
                        <p className={styles.welcomeDesc}>
                            SoleKing Store – Nâng tầm phong cách, khẳng định chất riêng trên từng bước chân
                        </p>
                        <div className={styles.introSection}>
                            <p>Hệ thống quản lý bán hàng toàn diện</p>
                            <p>Quản lý sản phẩm, khách hàng, nhân viên và báo cáo</p>
                            <p>Giao diện thân thiện, dễ sử dụng</p>
                        </div>
                        <div className={styles.supportBox}>
                            <div className={styles.supportTitle}>Hỗ trợ khách hàng</div>
                            <div>📞 <b>Hotline:</b> <a href="tel:0365175821">0365 175 821</a></div>
                            <div>🌐 <b>Fanpage:</b> <a href="https://facebook.com/solekingstore" target="_blank" rel="noopener noreferrer">facebook.com/solekingstore</a></div>
                            <div>✉️ <b>Email:</b> <a href="mailto:support@solekingstore.vn">support@solekingstore.vn</a></div>
                            <div>🏠 <b>Địa chỉ:</b> 13 P. Trịnh Văn Bô, Xuân Phương, Nam Từ Liêm, Hà Nội</div>
                        </div>
                        <footer className={styles.footer}>
                            <div>SoleKing Store Management System</div>
                            <div>Phiên bản 1.0 - Hệ thống quản lý bán hàng</div>
                            <div>© 2025 SoleKing Store. All rights reserved.</div>
                        </footer>
                    </div>
                );
            case "employees":
                return (
                    <div className="dashboard-content">
                        <NhanVienPage/>
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

    useEffect(() => {
        // --- Thống kê doanh thu ---
        const today = dayjs();
        const todayStr = today.format('YYYY-MM-DD');
        const firstDayOfMonth = today.startOf('month').format('YYYY-MM-DD');
        const firstDayOfYear = today.startOf('year').format('YYYY-MM-DD');
        // Doanh thu hôm nay
        fetch(`http://localhost:8080/api/thongke/doanh-thu?from=${todayStr}&to=${todayStr}`)
            .then(res => res.json())
            .then(data => {
                setTodayRevenue(data.tongDoanhThu || 0);
                setTodayOrders(data.soHoaDon || 0);
            })
            .catch(() => {
                setTodayRevenue(0);
                setTodayOrders(0);
            });
        // Doanh thu tháng này
        fetch(`http://localhost:8080/api/thongke/doanh-thu?from=${firstDayOfMonth}&to=${todayStr}`)
            .then(res => res.json())
            .then(data => setMonthRevenue(data.tongDoanhThu || 0))
            .catch(() => setMonthRevenue(0));
        // Doanh thu năm nay
        fetch(`http://localhost:8080/api/thongke/doanh-thu?from=${firstDayOfYear}&to=${todayStr}`)
            .then(res => res.json())
            .then(data => setYearRevenue(data.tongDoanhThu || 0))
            .catch(() => setYearRevenue(0));
        // Số đơn thành công, bị hủy
        fetch('http://localhost:8080/api/hoadon')
            .then(res => res.json())
            .then(data => {
                if (Array.isArray(data)) {
                    let success = 0, cancelled = 0, deliveredSuccess = 0, deliveredFailed = 0;
                    data.forEach(hd => {
                        if (hd.trangThai && (hd.trangThai === 'Đã thanh toán' || hd.trangThai === 'Hoàn tất')) success++;
                        if (hd.trangThai && hd.trangThai === 'Đã hủy') cancelled++;
                        if (hd.trangThai && hd.trangThai === 'Giao hàng thành công') deliveredSuccess++;
                        if (hd.trangThai && hd.trangThai === 'Giao hàng thất bại') deliveredFailed++;
                    });
                    setSuccessOrders(success);
                    setCancelledOrders(cancelled);
                    setDeliveredSuccessOrders(deliveredSuccess);
                    setDeliveredFailedOrders(deliveredFailed);
                } else {
                    setSuccessOrders(0);
                    setCancelledOrders(0);
                    setDeliveredSuccessOrders(0);
                    setDeliveredFailedOrders(0);
                }
            })
            .catch(() => {
                setSuccessOrders(0);
                setCancelledOrders(0);
                setDeliveredSuccessOrders(0);
                setDeliveredFailedOrders(0);
            });
        // --- Thống kê tổng quan cũ ---
        fetch(`http://localhost:8080/api/thongke/doanh-thu?from=2000-01-01&to=${todayStr}`)
            .then(res => res.json())
            .then(data => {
                setTotalRevenueAll(data.tongDoanhThu || 0);
                setTotalOrdersAll(data.soHoaDon || 0);
            })
            .catch(() => {
                setTotalRevenueAll(0);
                setTotalOrdersAll(0);
            });
        // Gọi API lấy sản phẩm bán nhiều nhất toàn hệ thống
        fetch('http://localhost:8080/api/thongke/san-pham-ban-nhieu-nhat')
            .then(res => res.json())
            .then(data => {
                if (data && data.tenSanPham) {
                    setBestSeller({ name: data.tenSanPham, sold: data.soLuongBan });
                } else {
                    setBestSeller({ name: 'Không có dữ liệu', sold: 0 });
                }
            })
            .catch(() => setBestSeller({ name: 'Không có dữ liệu', sold: 0 }));
        fetch('http://localhost:8080/api/thongke/tong-so-san-pham-da-ban')
            .then(res => res.json())
            .then(data => setTotalProductsSold(data.tongSoSanPhamDaBan || 0))
            .catch(() => setTotalProductsSold(0));
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