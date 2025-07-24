"use client";
import React, { useEffect, useState } from "react";
import { FaEye, FaEdit, FaPowerOff, FaSearch, FaSyncAlt, FaChevronLeft, FaChevronRight, FaTimes, FaEyeSlash } from "react-icons/fa";
import AdminLayout from "../../../component/Admin-Layout";
// import ThemNhanVien from "./ThemNhanVien";
import Link from "next/link";
import { useSearchParams } from "next/navigation";


export default function NhanVienPage() {
    const [activeMenu, setActiveMenu] = useState("employees");
    const [nhanViens, setNhanViens] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchValue, setSearchValue] = useState("");
    const [filterVaiTro, setFilterVaiTro] = useState("");
    const [filterTrangThai, setFilterTrangThai] = useState("");
    const [filterGioiTinh, setFilterGioiTinh] = useState("");
    const [currentPage, setCurrentPage] = useState(0);
    const itemsPerPage = 5;
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [detailNhanVien, setDetailNhanVien] = useState<any>(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
    const [confirmToggleId, setConfirmToggleId] = useState<number | null>(null);
    const [totalElements, setTotalElements] = useState(0);
    const [totalPages, setTotalPages] = useState(1);
    const searchParams = useSearchParams();

    useEffect(() => {
        const pageParam = searchParams.get("page");
        if (pageParam) {
            setCurrentPage(Number(pageParam) - 1);
        }
    }, [searchParams]);

    useEffect(() => {
        fetchNhanViens();
    }, [currentPage, filterTrangThai, filterGioiTinh]);

    const fetchNhanViens = () => {
        setLoading(true);
        let url = `http://localhost:8080/nhan-vien/phan-trang?page=${currentPage}&size=${itemsPerPage}`;
        if (filterTrangThai) {
            url += `&trangThai=${encodeURIComponent(filterTrangThai)}`;
        }
        if (filterGioiTinh) {
            url += `&gioiTinh=${filterGioiTinh}`;
        }
        fetch(url)
            .then(res => res.json())
            .then(data => {
                setNhanViens(data.data.content || []);
                setTotalElements(data.data.totalElements || 0);
                setTotalPages(data.data.totalPages || 1);
                setLoading(false);
            });
    };

    const handleSearch = () => {
        if (!searchValue.trim()) {
            fetchNhanViens();
            return;
        }
        setLoading(true);
        fetch(`http://localhost:8080/nhan-vien/tim-kiem?keyword=${encodeURIComponent(searchValue)}`)
            .then(res => res.json())
            .then(data => {
                setNhanViens(data.data || []);
                setNhanViens(data.data.sort((a: any, b: any) => new Date(b.ngayTao).getTime() - new Date(a.ngayTao).getTime()));
                setLoading(false);
            });
    };

    const handlePageChange = (newPage: number) => {
        setCurrentPage(newPage);
    };

    // Filter and paginate data
    const filteredNhanViens = nhanViens.filter(nv => {
        const matchVaiTro = filterVaiTro ? String(nv.idVaiTro) === filterVaiTro : true;
        const matchTrangThai = filterTrangThai ? nv.trangThai === filterTrangThai : true;
        const matchGioiTinh = filterGioiTinh ? nv.gioiTinh === filterGioiTinh : true;
        return matchVaiTro && matchTrangThai && matchGioiTinh;
    });

    const showToast = (type: 'success' | 'error', message: string) => {
        setToast({ type, message });
        setTimeout(() => setToast(null), 3000);
    };

    const handleRequestToggle = (id: number) => setConfirmToggleId(id);
    const handleConfirmToggle = async () => {
        if (confirmToggleId == null) return;
        setToggleLoadingId(confirmToggleId);
        setConfirmToggleId(null);
        try {
            const res = await fetch(`http://localhost:8080/nhan-vien/doi-trang-thai/${confirmToggleId}`, { method: "PUT" });
            const data = await res.json();
            if (data.success) showToast('success', 'Đổi trạng thái thành công!');
            else showToast('error', data.message || 'Đổi trạng thái thất bại!');
            fetchNhanViens();
        } catch {
            showToast('error', 'Không thể kết nối server!');
        }
        setToggleLoadingId(null);
    };

    const handleShowDetail = async (id: number) => {
        setDetailLoading(true);
        setShowDetailModal(true);
        try {
            const res = await fetch(`http://localhost:8080/nhan-vien/chi-tiet/${id}`);
            const data = await res.json();
            setDetailNhanVien(data.data || null);
        } catch {
            setDetailNhanVien(null);
        }
        setDetailLoading(false);
    };

    const handleToggleTrangThai = async (id: number) => {
        setToggleLoadingId(id);
        try {
            await fetch(`http://localhost:8080/nhan-vien/doi-trang-thai/${id}`, { method: "PUT" });
            fetchNhanViens();
        } catch {}
        setToggleLoadingId(null);
    };

    return (
        <AdminLayout 
            activeMenu={activeMenu} 
            onMenuChangeAction={setActiveMenu}
            pageTitle="Quản lý nhân viên"
        >
            <div>
                {/* Header with search and filters */}
                <div style={{ padding: "24px 32px 0 32px" }}>
                    <h2 style={{ color: "#333", fontWeight: 700, marginBottom: 24, fontSize: "1.5rem" }}>
                        Danh sách nhân viên
                    </h2>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20, paddingBottom: 32 }}>
                        {/* Tìm kiếm + Làm mới bên trái */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <input
                                type="text"
                                placeholder="Tìm kiếm nhân viên..."
                                value={searchValue}
                                onChange={e => setSearchValue(e.target.value)}
                                style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", minWidth: 220, fontSize: 15, background: '#fff', color: '#222' }}
                                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
                            />
                            <button
                                style={{ background: "#fff", color: "#b59d3a", border: "1.5px solid #b59d3a55", borderRadius: 7, padding: "9px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: 'flex', alignItems: 'center', gap: 7 }}
                                onClick={handleSearch}
                            >
                                <FaSearch style={{ fontSize: 16 }} />
                                Tìm kiếm
                            </button>
                            <button
                                style={{ background: "#fff", color: "#b59d3a", border: "1.5px solid #b59d3a55", borderRadius: 7, padding: "9px 14px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: 'flex', alignItems: 'center', gap: 7 }}
                                onClick={() => { setSearchValue(""); fetchNhanViens(); }}
                            >
                                <FaSyncAlt style={{ fontSize: 16 }} />
                                Làm mới
                            </button>
                        </div>
                        {/* Bộ lọc ở giữa */}
                        <div style={{ display: "flex", gap: 16 }}>
                            <select 
                                value={filterTrangThai} 
                                onChange={e => setFilterTrangThai(e.target.value)} 
                                style={{ padding: 8, borderRadius: 7, border: "1.5px solid #b59d3a55", minWidth: 150, background: '#fff', color: '#222' }}
                            >
                                <option value="">-- Tất cả trạng thái --</option>
                                <option value="Hoạt động">Hoạt động</option>
                                <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                            </select>
                            <select
                                value={filterGioiTinh}
                                onChange={e => setFilterGioiTinh(e.target.value)}
                                style={{ padding: 8, borderRadius: 7, border: "1.5px solid #b59d3a55", minWidth: 150, background: '#fff', color: '#222' }}
                            >
                                <option value="">-- Tất cả giới tính --</option>
                                <option value="true">Nam</option>
                                <option value="false">Nữ</option>
                            </select>
                        </div>
                        {/* Thêm nhân viên bên phải */}
                        <Link href="/NhanVien/ThemNhanVien">
                            <button
                                style={{ background: "#b59d3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 600, fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px #b59d3a22" }}
                            >
                                + Thêm nhân viên
                            </button>
                        </Link>
                    </div>
                </div>

                {/* Table */}
                {loading ? (
                    <div style={{ textAlign: "center", padding: "40px", color: "#666" }}>Đang tải...</div>
                ) : (
                    <>
                        <table style={{
                            width: "100%",
                            borderCollapse: "collapse",
                            background: "#fff",
                            minWidth: 900,
                            margin: "0 auto",
                            boxShadow: "0 2px 12px #0001",
                            borderRadius: 10,
                            overflow: "hidden"
                        }}>
                            <thead>
                            <tr>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>STT</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>Mã nhân viên</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "left", fontSize: "0.95rem", borderBottom: "2px solid"}}>Tên nhân viên</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>Giới tính</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>Ngày sinh</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>Số điện thoại</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>Email</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>Trạng thái tài khoản</th>
                                <th style={{padding: "12px 10px", fontWeight: 700, textAlign: "center", fontSize: "0.95rem", borderBottom: "2px solid"}}>Thao tác</th>
                            </tr>
                            </thead>
                            <tbody>
                            {nhanViens.map((nv, idx) => (
                                <tr key={nv.idNhanVien} style={{
                                    background: idx % 2 === 0 ? "#fff" : "#f9f9f9"
                                }}>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{currentPage * itemsPerPage + idx + 1}</td>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.maNhanVien}</td>
                                    <td style={{ textAlign: "left", color: "#222", padding: "9px 18px", fontWeight: 500 }}>{nv.tenNhanVien}</td>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.gioiTinh === true ? "Nam" : "Nữ"}</td>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.ngaySinh}</td>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.soDienThoai}</td>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.email}</td>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>
                                        {nv.trangThai === "Hoạt động" ? (
                                            <span style={{
                                                background: '#d4f5dd',
                                                color: '#217a39',
                                                borderRadius: 16,
                                                padding: '2px 14px',
                                                fontWeight: 600,
                                                fontSize: 15,
                                                display: 'inline-block'
                                            }}>
                                                Hoạt động
                                            </span>
                                        ) : nv.trangThai === "Ngừng hoạt động" ? (
                                            <span style={{
                                                background: '#ffe0e0',
                                                color: '#c0392b',
                                                borderRadius: 16,
                                                padding: '2px 14px',
                                                fontWeight: 600,
                                                fontSize: 15,
                                                display: 'inline-block'
                                            }}>
                                                Ngừng hoạt động
                                            </span>
                                        ) : (
                                            nv.trangThai || ""
                                        )}
                                    </td>
                                    <td style={{ textAlign: "center", color: "#222", padding: "9px 0" }}>
                                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                                            <button
                                                style={{ background: "#3498db", color: "black", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                                title="Xem chi tiết"
                                                onClick={() => handleShowDetail(nv.idNhanVien)}
                                            >
                                                <FaEye style={{ fontSize: 15 }} />
                                            </button>
                                            <Link href={`http://localhost:3000/NhanVien/SuaNhanVien?id=${nv.idNhanVien}`}>
                                                <button
                                                    style={{ background: "#f1c40f", color: "#222", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                                    title="Sửa thông tin"
                                                >
                                                    <FaEdit style={{ fontSize: 15 }} />
                                                </button>
                                            </Link>
                                            <button
                                                style={{ background: nv.trangThai === "Hoạt động" ? "#2ecc40" : "#e74c3c", color: "#fff", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                                                title={nv.trangThai === "Hoạt động" ? "Ngừng hoạt động" : "Kích hoạt lại"}
                                                onClick={() => handleRequestToggle(nv.idNhanVien)}
                                                disabled={toggleLoadingId === nv.idNhanVien}
                                            >
                                                {toggleLoadingId === nv.idNhanVien ? (
                                                    <span style={{ fontSize: 13 }}>...</span>
                                                ) : (
                                                    <FaPowerOff style={{ fontSize: 15 }} />
                                                )}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        
                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "20px 32px", background: "#fffbe6cc", marginTop: "20px", borderRadius: "10px", gap: "10px", boxShadow: "0 2px 8px #bcdffb33" }}>
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 0}
                                    style={{
                                        minWidth: 70,
                                        height: 38,
                                        borderRadius: 20,
                                        border: "1.5px solid #e3f1fb",
                                        background: "#fff",
                                        color: "#222",
                                        fontWeight: 400,
                                        fontSize: 12,
                                        margin: "0 6px",
                                        outline: "none",
                                        cursor: currentPage === 0 ? "not-allowed" : "pointer",
                                        opacity: currentPage === 0 ? 0.6 : 0.85,
                                        boxShadow: "0 1px 4px #bcdffb22"
                                    }}
                                >
                                    TRƯỚC
                                </button>
                                {Array.from({ length: totalPages }, (_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => handlePageChange(i)}
                                        style={{
                                            minWidth: 38,
                                            height: 38,
                                            borderRadius: 20,
                                            border: i === currentPage ? "none" : "1.5px solid #e3f1fb",
                                            background: i === currentPage ? "#e5e2daaa" : "#fff",
                                            color: "#222",
                                            fontWeight: i === currentPage ? 700 : 600,
                                            fontSize: 12,
                                            margin: "0 6px",
                                            outline: "none",
                                            cursor: "pointer",
                                            opacity: i === currentPage ? 0.92 : 0.85,
                                            boxShadow: i === currentPage ? "0 1px 4px #bcdffb22" : undefined
                                        }}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages - 1}
                                    style={{
                                        minWidth: 70,
                                        height: 38,
                                        borderRadius: 20,
                                        border: "1.5px solid #e3f1fb",
                                        background: "#fff",
                                        color: "#222",
                                        fontWeight: 400,
                                        fontSize: 12,
                                        margin: "0 6px",
                                        outline: "none",
                                        cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                                        opacity: currentPage === totalPages - 1 ? 0.6 : 0.85,
                                        boxShadow: "0 1px 4px #bcdffb22"
                                    }}
                                >
                                    SAU
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
            {/* Modal xem chi tiết nhân viên */}
            {showDetailModal && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", padding: 32, borderRadius: 12, minWidth: 400, boxShadow: "0 4px 24px #0002", position: "relative", maxWidth: 480 }}>
                        <button type="button" onClick={() => setShowDetailModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}><FaTimes /></button>
                        <h3 style={{ marginBottom: 18, color: "#b59d3a", fontWeight: 700, fontSize: 20 }}>Chi tiết nhân viên</h3>
                        {detailLoading ? (
                            <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>Đang tải...</div>
                        ) : detailNhanVien ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                <div style={{ color: '#222' }}><b>Mã nhân viên:</b> {detailNhanVien.maNhanVien}</div>
                                <div style={{ color: '#222' }}><b>Họ tên:</b> {detailNhanVien.tenNhanVien}</div>
                                <div style={{ color: '#222' }}><b>Tên đăng nhập:</b> {detailNhanVien.tenTaiKhoan}</div>
                                <div style={{ color: '#222' }}><b>Email:</b> {detailNhanVien.email}</div>
                                <div style={{ color: '#222' }}><b>Số điện thoại:</b> {detailNhanVien.soDienThoai}</div>
                                <div style={{ color: '#222' }}><b>Ngày sinh:</b> {detailNhanVien.ngaySinh}</div>
                                <div style={{ color: '#222' }}><b>Giới tính:</b> {detailNhanVien.gioiTinh === true ? "Nam" : detailNhanVien.gioiTinh === false ? "Nữ" : ""}</div>
                                <div style={{ color: '#222' }}><b>Địa chỉ:</b> {detailNhanVien.diaChi}</div>
                                <div style={{ color: '#222' }}><b>Trạng thái:</b> {detailNhanVien.trangThai}</div>
                            </div>
                        ) : (
                            <div style={{ color: 'red', textAlign: 'center', padding: 24 }}>Không tìm thấy thông tin nhân viên</div>
                        )}
                    </div>
                </div>
            )}
            {/* Toast/thông báo */}
            {toast && (
                <div style={{ position: 'fixed', top: 30, right: 30, zIndex: 2000, background: toast.type === 'success' ? '#2ecc40' : '#e74c3c', color: '#fff', padding: '14px 28px', borderRadius: 8, fontWeight: 600, fontSize: 16, boxShadow: '0 2px 12px #0002', minWidth: 220, textAlign: 'center' }}>
                    {toast.message}
                </div>
            )}
            {/* Modal xác nhận đổi trạng thái */}
            {confirmToggleId !== null && (
                <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 3000, display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ background: "#fff", padding: 32, borderRadius: 12, minWidth: 340, boxShadow: "0 4px 24px #0002", position: "relative" }}>
                        <h3 style={{ color: "#b59d3a", fontWeight: 700, fontSize: 20, marginBottom: 18 }}>Xác nhận</h3>
                        <div style={{ color: '#333', fontSize: 16, marginBottom: 24 }}>Bạn có muốn thay đổi trạng thái tài khoản này không?</div>
                        <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                            <button onClick={() => setConfirmToggleId(null)} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#eee', color: '#333', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Hủy</button>
                            <button onClick={handleConfirmToggle} style={{ padding: '8px 18px', borderRadius: 7, border: 'none', background: '#b59d3a', color: '#fff', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Đồng ý</button>
                        </div>
                    </div>
                </div>
            )}
        </AdminLayout>
    );
} 