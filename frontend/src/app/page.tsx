"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./page.module.css";

const menuItems = [
    { id: "dashboard", label: "Trang chủ", icon: "🏠" },
    { id: "pos", label: "Bán hàng tại quầy", icon: "💳" },
    { id: "products", label: "Quản lý sản phẩm", icon: "👟" },
    { id: "employees", label: "Quản lý nhân viên", icon: "👤" },
    { id: "customers", label: "Quản lý khách hàng", icon: "👥" },
    { id: "invoices", label: "Hóa đơn", icon: "🧾" },
    { id: "statistics", label: "Thống kê", icon: "📊" },
    { id: "promotions", label: "Khuyến mãi", icon: "🎉" }
];

export default function Home() {
    const [activeMenu, setActiveMenu] = useState("dashboard");
    const router = useRouter();

    const handleLogout = () => {
        localStorage.removeItem("user");
        router.push("/login");
    };

    const handleMenuClick = (menuId: string) => {
        switch (menuId) {
            case "dashboard":
                router.push("/dashboard");
                break;
            case "employees":
                router.push("/NhanVien/HienThi");
                break;
            case "customers":
                router.push("/dashboard");
                break;
            case "statistics":
                router.push("/ThongKe");
                break;
            case "pos":
                // router.push("/BanHangTaiQuay"); // Nếu có trang này
                break;
            case "products":
                // router.push("/QuanLySanPham"); // Nếu có trang này
                break;
            case "invoices":
                // router.push("/HoaDon"); // Nếu có trang này
                break;
            case "promotions":
                // router.push("/KhuyenMai"); // Nếu có trang này
                break;
            default:
                setActiveMenu(menuId);
        }
    };

    return (
        <div style={{ minHeight: "100vh", background: "#fffbe6", display: "flex" }}>
            {/* Sidebar */}
            <nav className={styles.sidebar}>
                <div className={styles.sidebarHeader}>
                    <Image
                        src="/logo.jpg"
                        alt="Logo"
                        width={38}
                        height={38}
                        className={styles.sidebarLogo}
                    />
                </div>
                
                <nav className={styles.sidebarMenu}>
                    {menuItems.map((item) => (
                        <button
                            key={item.id}
                            className={`${styles.sidebarMenuItem} ${activeMenu === item.id ? styles.active : ''}`}
                            onClick={() => handleMenuClick(item.id)}
                        >
                            <span style={{ fontSize: 22 }}>{item.icon}</span>
                            <span>{item.label}</span>
                        </button>
                    ))}
                </nav>
                
                <div className={styles.sidebarFooter}>
                    <button
                        className={styles.sidebarLogoutButton}
                        onClick={handleLogout}
                    >
                        <span>🚪</span>
                        <span>Đăng xuất</span>
                    </button>
                </div>
            </nav>
            
            {/* Main content */}
            <div style={{ flex: 1 }}>
                {/* Header */}
                <header style={{
                    background: "#fff",
                    padding: "20px 30px",
                    borderBottom: "1px solid #b59d3a44",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    boxShadow: "0 2px 4px rgba(0,0,0,0.07)"
                }}>
                    <h1 style={{ margin: 0, color: "#2c3e50", fontSize: "1.8rem" }}>
                        {menuItems.find(item => item.id === activeMenu)?.label || "Trang chủ"}
                    </h1>
                </header>
                
                {/* Content area */}
                <div style={{ 
                    padding: 32,
                    maxWidth: 1200,
                    margin: "0 auto",
                    background: "#fff",
                    marginTop: 20,
                    marginLeft: 20,
                    marginRight: 20,
                    borderRadius: 12,
                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
                }}>
                    <div style={{ textAlign: "center", padding: "40px 20px" }}>
                        <Image
                            src="/logo.jpg"
                            alt="SoleKing Store Logo"
                            width={120}
                            height={120}
                            style={{ borderRadius: 20, marginBottom: 20 }}
                        />
                        <h2 style={{ color: "#2c3e50", marginBottom: 16 }}>
                            Chào mừng đến với SoleKing Store
                        </h2>
                        <p style={{ color: "#666", fontSize: "1.1rem", lineHeight: 1.6 }}>
                            Hệ thống quản lý cửa hàng giày chuyên nghiệp
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
