"use client";
import React, { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { FaChevronLeft, FaChevronRight, FaBars } from "react-icons/fa";
import { FiLogOut } from "react-icons/fi";
import { useEffect } from "react";

const menuItems = [
    { id: "dashboard", label: "Tổng quan", icon: "🏠" },
    { id: "pos", label: "Bán hàng tại quầy", icon: "💳" },
    {
        id: "products",
        label: "Quản lý sản phẩm",
        icon: "👟",
        children: [
            { id: "product-details-list", label: "Chi tiết sản phẩm", route: "/ChiTietSanPham" },
            { id: "images", label: "Hình ảnh", route: "/ChiTietSanPham/HinhAnh" },
            { id: "sizes", label: "Kích thước", route: "/ChiTietSanPham/KichThuoc" },
            { id: "colors", label: "Màu sắc", route: "/ChiTietSanPham/MauSac" },
            { id: "brands", label: "Thương hiệu", route: "/ChiTietSanPham/ThuongHieu" },
            { id: "categories", label: "Danh mục", route: "/ChiTietSanPham/DanhMuc" }
        ]
    },
    { id: "employees", label: "Quản lý nhân viên", icon: "👤" },
    { id: "customers", label: "Quản lý khách hàng", icon: "👥" },
    { id: "invoices", label: "Hóa đơn", icon: "🧾" },
    {
        id: "statistics",
        label: "Thống kê",
        icon: "📊",
        children: [
            { id: "revenue-statistics", label: "Doanh thu", route: "/ThongKe/DoanhThu" },
            { id: "product-statistics", label: "Sản phẩm", route: "/ThongKe/SanPham" }
        ]
    },
    { id: "promotions", label: "Khuyến mãi", icon: "🎉" }
];

interface AdminLayoutProps {
    children: React.ReactNode;
    activeMenu: string;
    onMenuChangeAction?: (menuId: string) => void;
    pageTitle?: string;
    activeSubMenu?: string;
}

export default function AdminLayout({ children, pageTitle, activeSubMenu }: AdminLayoutProps) {
    const [collapsed, setCollapsed] = useState(false);
    const [productMenuOpen, setProductMenuOpen] = useState(false);
    const [statisticsMenuOpen, setStatisticsMenuOpen] = useState(false);
    const [user, setUser] = useState<{
        tenTaiKhoan?: string;
        tenNhanVien?: string;
        tenKhachHang?: string;
        vaiTro?: string;
    } | null>(null);
    const router = useRouter();
    const pathname = usePathname();

    // Kiểm tra quyền truy cập: chỉ cho phép NHAN_VIEN hoặc QUAN_TRI_VIEN
    useEffect(() => {
        if (typeof window !== "undefined") {
            const userData = localStorage.getItem("user");
            if (userData) {
                const u = JSON.parse(userData);
                setUser(u);
                if (!u.vaiTro || (u.vaiTro !== "NHAN_VIEN" && u.vaiTro !== "QUAN_TRI_VIEN")) {
                    alert("Bạn không có quyền truy cập trang này!");
                    router.push("/login");
                }
            } else {
                router.push("/login");
            }
        }
    }, [router]);

    // Xác định menu đang active dựa vào pathname
    const getActiveMenu = () => {
        if (pathname.startsWith("/invoices")) return "invoices";
        if (pathname.startsWith("/dashboard")) return "dashboard";
        if (pathname.startsWith("/pos")) return "pos";
        if (pathname.startsWith("/NhanVien")) return "employees";
        if (pathname.startsWith("/KhachHang")) return "customers";
        if (pathname.startsWith("/ThongKe")) return "statistics";
        if (pathname.startsWith("/ChiTietSanPham")) return "products";
        if (pathname.startsWith("/Voucher")) return "promotions";
        // ... các case khác nếu cần
        return "dashboard";
    };
    const activeMenu = getActiveMenu();

    // Tự động mở menu con khi vào trang con
    useEffect(() => {
        if (pathname.startsWith("/ThongKe/DoanhThu") || pathname.startsWith("/ThongKe/SanPham")) {
            setStatisticsMenuOpen(true);
        } else if (pathname === "/ThongKe/DoanhThu") {
            // Nếu vào trang chính Thống kê thì đóng menu con
            setStatisticsMenuOpen(false);
        }
        if (pathname.startsWith("/ChiTietSanPham")) {
            setProductMenuOpen(true);
        }
    }, [pathname]);

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/login");
    };

    const handleMenuClick = (menuId: string) => {
        if (menuId === "dashboard") {
            router.push("/dashboard");
        } else if (menuId === "pos") {
            router.push("/pos");
        } else if (menuId === "employees") {
            router.push("/NhanVien/HienThi");
        } else if (menuId === "customers") {
            router.push("/KhachHang");
        } else if (menuId === "statistics") {
            setStatisticsMenuOpen(open => !open);
            // Nếu đang ở menu khác thì chuyển route sang /ThongKe/DoanhThu
            if (activeMenu !== "statistics") {
                router.push("/ThongKe/DoanhThu");
            }
            return;
        } else if (menuId === "products") {
            setProductMenuOpen(open => !open);
            // Nếu đang ở menu khác thì chuyển route sang /ChiTietSanPham
            if (activeMenu !== "products") {
                router.push("/ChiTietSanPham");
            }
            return;
        } else if (menuId === "invoices") {
            router.push("/invoices");
            return;
        } else if (menuId === "promotions") {
            router.push("/Voucher/HienThi");
            return;
        }
    };

    // Menu con chỉ mở nếu productMenuOpen true
    const shouldOpenProductMenu = productMenuOpen;
    const shouldOpenStatisticsMenu = statisticsMenuOpen;

    return (
        <div style={{ minHeight: "100vh", background: "#fffbe6", display: "flex" }}>
            {/* Sidebar */}
            <nav
                style={{
                    width: collapsed ? 70 : 260,
                    background: "linear-gradient(180deg, #fffbe6 0%, #f9e7b4 100%)",
                    color: "#6b4f1d",
                    display: "flex",
                    flexDirection: "column",
                    transition: "width 0.3s cubic-bezier(.4,2,.6,1)",
                    boxShadow: "2px 0 10px #b59d3a22"
                }}
            >
                <div
                    style={{
                        padding: collapsed ? "12px 8px 12px 8px" : "18px 18px 12px 18px",
                        borderBottom: "1px solid #e6d8b4",
                        display: "flex",
                        alignItems: "center",
                        minHeight: 60,
                        background: "#fffbe6"
                    }}
                >
                    <img
                        src="/logo-login.png"
                        alt="Logo"
                        style={{
                            width: collapsed ? 35 : 45,
                            height: collapsed ? 35 : 45,
                            objectFit: "contain",
                            borderRadius: 12,
                            background: "#fffbe6",
                            boxShadow: "0 2px 8px #b59d3a33",
                            marginRight: collapsed ? 0 : 8,
                            border: "2px solid #b59d3a",
                            transition: "all 0.3s"
                        }}
                    />
                    {!collapsed && (
                        <span style={{ fontWeight: 800, fontSize: 20, color: "#b59d3a", marginLeft: 8, letterSpacing: 1 }}>SoleKing Store</span>
                    )}
                    <button
                        aria-label={collapsed ? "Mở rộng menu" : "Thu gọn menu"}
                        onClick={() => setCollapsed((c) => !c)}
                        style={{
                            marginLeft: "auto",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                            color: "#b59d3a",
                            fontSize: 22,
                            padding: 4,
                            transition: "all 0.2s"
                        }}
                    >
                        <FaBars />
                    </button>
                </div>
                <nav style={{ flex: 1, padding: collapsed ? "10px 0" : "18px 0", overflowY: "auto" }}>
                    {menuItems.map((item) => (
                        <React.Fragment key={item.id}>
                            <button
                                style={{
                                    width: "100%",
                                    padding: collapsed ? "10px 0 10px 0" : "12px 18px",
                                    background: activeMenu === item.id ? "#fff" : "none",
                                    border: "none",
                                    color: activeMenu === item.id ? "#b59d3a" : "#6b4f1d",
                                    textAlign: collapsed ? "center" : "left",
                                    cursor: "pointer",
                                    transition: "all 0.2s",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: collapsed ? 0 : 12,
                                    fontSize: "1.08rem",
                                    borderLeft: activeMenu === item.id ? "4px solid #b59d3a" : "4px solid transparent",
                                    borderRadius: collapsed ? 12 : "0 8px 8px 0",
                                    position: "relative",
                                    fontWeight: activeMenu === item.id ? 700 : 600,
                                    justifyContent: collapsed ? "center" : "flex-start"
                                }}
                                onClick={() => handleMenuClick(item.id)}
                            >
                                <span style={{ fontSize: 22 }}>{item.icon}</span>
                                {!collapsed && <span>{item.label}</span>}
                                {item.children && !collapsed && (
                                    <span style={{ marginLeft: "auto", fontSize: 16 }}>
                                        {(item.id === "products" && shouldOpenProductMenu) || (item.id === "statistics" && shouldOpenStatisticsMenu) ? "▼" : "▶"}
                                    </span>
                                )}
                            </button>
                            {item.children && ((item.id === "products" && shouldOpenProductMenu) || (item.id === "statistics" && shouldOpenStatisticsMenu)) && !collapsed && (
                                <div style={{
                                    marginLeft: 24,
                                    borderLeft: "2px solid #f3e9c7",
                                    background: "#fffbe6",
                                    borderRadius: "14px",   
                                    boxShadow: "0 2px 8px #b59d3a22",
                                    overflow: "hidden"
                                }}>
                                    {item.children.map((child) => (
                                        <button
                                            key={child.id}
                                            style={{
                                                padding: "10px 32px",
                                                cursor: "pointer",
                                                background: (activeSubMenu ? activeSubMenu === child.id : activeMenu === child.id) ? "#b59d3a55" : "transparent",
                                                color: (activeSubMenu ? activeSubMenu === child.id : activeMenu === child.id) ? "#b59d3a" : "#6b4f1d",
                                                fontWeight: (activeSubMenu ? activeSubMenu === child.id : activeMenu === child.id) ? 800 : 500,
                                                borderLeft: (activeSubMenu ? activeSubMenu === child.id : activeMenu === child.id) ? "4px solid #b59d3a" : "4px solid transparent",
                                                transition: "all 0.2s",
                                                width: "100%",
                                                textAlign: "left"
                                            }}
                                            onClick={() => {
                                                if (child.route && child.route !== "#") {
                                                    router.push(child.route);
                                                }
                                                // Không cần gọi onMenuChangeAction nữa
                                            }}
                                        >
                                            {child.label}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </React.Fragment>
                    ))}
                </nav>
                <div style={{ padding: collapsed ? 8 : 18, borderTop: "1px solid #e6d8b4", background: "#fffbe6" }}>
                    <button
                        style={{
                            width: "100%",
                            padding: collapsed ? 8 : 10,
                            background: "#b59d3a",
                            border: "none",
                            color: "white",
                            borderRadius: 8,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: collapsed ? 0 : 10,
                            justifyContent: "center",
                            transition: "background 0.2s",
                            fontWeight: 600,
                            fontSize: collapsed ? 18 : undefined
                        }}
                        onClick={handleLogout}
                    >
                        <FiLogOut style={{ fontSize: 22 }} />
                        {!collapsed && <span>Đăng xuất</span>}
                    </button>
                </div>
            </nav>
            
            {/* Main content */}
            <div style={{ flex: 1 }}>
                {/* Header */}
                <header style={{
                    background: "#fff",
                    padding: collapsed ? "20px 16px" : "20px 30px",
                    borderBottom: "1px solid #b59d3a44",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.07)"
                }}>
                    <h1 style={{ margin: 0, color: "#2c3e50", fontSize: "1.8rem" }}>
                        {pageTitle || menuItems.find(item => item.id === activeMenu)?.label || "Quản lý"}
                    </h1>
                    {/* Hiển thị tài khoản đăng nhập */}
                    {user && (
                        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div style={{
                                width: 36,
                                height: 36,
                                borderRadius: "50%",
                                background: "#f9e7b4",
                                color: "#b59d3a",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontWeight: 700,
                                fontSize: 18,
                                marginRight: 8,
                                border: "2px solid #b59d3a"
                            }}>
                                {(user.tenTaiKhoan ? user.tenTaiKhoan.charAt(0).toUpperCase() : (user.tenNhanVien ? user.tenNhanVien.charAt(0).toUpperCase() : (user.tenKhachHang ? user.tenKhachHang.charAt(0).toUpperCase() : "U")))}
                            </div>
                            <div style={{ display: "flex", flexDirection: "column" }}>
                                <span style={{ fontWeight: 600, color: "#b59d3a" }}>
                                    {user.tenNhanVien || user.tenTaiKhoan || user.tenKhachHang || "Tài khoản"}
                                </span>
                                {user.vaiTro && (
                                    <span style={{ fontWeight: 500, color: "#8a7a2a", fontSize: 13 }}>
                                        {user.vaiTro === "NHAN_VIEN" ? "Nhân viên" : user.vaiTro === "QUAN_TRI_VIEN" ? "Quản trị viên" : user.vaiTro}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </header>
                
                {/* Content area */}
                <div style={{ padding: 32 }}>
                    {children}
                </div>
            </div>
        </div>
    );
}

