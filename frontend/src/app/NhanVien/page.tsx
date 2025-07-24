"use client";
import React, { useEffect, useState } from "react";
import { FaEye, FaEdit, FaPowerOff, FaSearch, FaSyncAlt, FaChevronLeft, FaChevronRight, FaTimes, FaEyeSlash } from "react-icons/fa";

const vaiTroMap: { [key: number]: string } = {
  1: "Admin",
  2: "Nhân viên",
  // 3: "Khách hàng"
};

export default function NhanVienPage() {
  const [activeMenu, setActiveMenu] = useState("employees");
  const [nhanViens, setNhanViens] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchValue, setSearchValue] = useState("");
  const [filterVaiTro, setFilterVaiTro] = useState("");
  const [filterTrangThai, setFilterTrangThai] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const itemsPerPage = 5;
  const [showAddModal, setShowAddModal] = useState(false);
  const [addForm, setAddForm] = useState({
    maNhanVien: "",
    tenNhanVien: "",
    tenTaiKhoan: "",
    matKhau: "",
    email: "",
    soDienThoai: "",
    gioiTinh: "Nam",
    ngaySinh: "",
    diaChi: "",
    idVaiTro: "2",
    trangThai: "Hoạt động"
  });
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [vaiTros, setVaiTros] = useState<{ idVaiTro: number, tenVaiTro: string }[]>([]);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailNhanVien, setDetailNhanVien] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editNhanVien, setEditNhanVien] = useState<any>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [toggleLoadingId, setToggleLoadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [confirmToggleId, setConfirmToggleId] = useState<number | null>(null);

  useEffect(() => {
    fetchNhanViens();
    // Lấy danh sách vai trò từ backend
    fetch("http://localhost:8080/nhan-vien/vai-tro")
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) setVaiTros(data);
          else if (Array.isArray(data.data)) setVaiTros(data.data);
        });
  }, []);

  useEffect(() => {
    setCurrentPage(0);
  }, [filterVaiTro, filterTrangThai]);

  const fetchNhanViens = () => {
    setLoading(true);
    fetch("http://localhost:8080/nhan-vien/hien-thi")
        .then(res => res.json())
        .then(data => {
          setNhanViens(data.data || []);
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
    return matchVaiTro && matchTrangThai;
  });
  const totalPages = Math.ceil(filteredNhanViens.length / itemsPerPage);
  const startIndex = currentPage * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentNhanViens = filteredNhanViens.slice(startIndex, endIndex);

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

  const handleAddNhanVien = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError("");
    // Validate số điện thoại phải bắt đầu bằng 0 và có ít nhất 10 số
    if (!/^0\d{9,}$/.test(addForm.soDienThoai)) {
      setAddError("Số điện thoại phải bắt đầu bằng số 0 và có ít nhất 10 chữ số");
      return;
    }
    // Validate mã NV, tên đăng nhập, mật khẩu không chứa dấu cách
    if (/\s/.test(addForm.maNhanVien)) {
      setAddError("Mã nhân viên không được chứa dấu cách");
      return;
    }
    if (/\s/.test(addForm.tenTaiKhoan)) {
      setAddError("Tên đăng nhập không được chứa dấu cách");
      return;
    }
    if (/\s/.test(addForm.matKhau)) {
      setAddError("Mật khẩu không được chứa dấu cách");
      return;
    }
    // Validate mã NV, tên đăng nhập không được chứa ký tự có dấu
    if (/[^\x00-\x7F]/.test(addForm.maNhanVien)) {
      setAddError("Mã nhân viên không được chứa ký tự có dấu");
      return;
    }
    if (/[^\x00-\x7F]/.test(addForm.tenTaiKhoan)) {
      setAddError("Tên đăng nhập không được chứa ký tự có dấu");
      return;
    }
    setAddLoading(true);
    try {
      const res = await fetch("http://localhost:8080/nhan-vien/them", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...addForm,
          gioiTinh: addForm.gioiTinh === "Nam"
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setAddForm({ maNhanVien: "", tenNhanVien: "", tenTaiKhoan: "", matKhau: "", email: "", soDienThoai: "", gioiTinh: "Nam", ngaySinh: "", diaChi: "", idVaiTro: "2", trangThai: "Hoạt động" });
        fetchNhanViens();
        showToast('success', 'Thêm nhân viên thành công!');
      } else {
        setAddError(data.message || "Có lỗi xảy ra");
        showToast('error', data.message || "Thêm nhân viên thất bại!");
      }
    } catch (err) {
      setAddError("Không thể kết nối server");
      showToast('error', 'Không thể kết nối server!');
    }
    setAddLoading(false);
  };

  // Hàm lấy tên vai trò từ id
  const getTenVaiTro = (id: number) => {
    const vt = vaiTros.find(v => v.idVaiTro === Number(id));
    return vt ? vt.tenVaiTro : id;
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

  const handleShowEdit = async (id: number) => {
    setEditLoading(true);
    setShowEditModal(true);
    setEditError("");
    try {
      const res = await fetch(`http://localhost:8080/nhan-vien/chi-tiet/${id}`);
      const data = await res.json();
      setEditNhanVien(data.data || null);
    } catch {
      setEditNhanVien(null);
      setEditError("Không thể tải dữ liệu nhân viên");
    }
    setEditLoading(false);
  };

  const handleEditNhanVien = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditError("");
    // Validate số điện thoại phải bắt đầu bằng 0 và có ít nhất 10 số
    if (!/^0\d{9,}$/.test(editNhanVien.soDienThoai)) {
      setEditError("Số điện thoại phải bắt đầu bằng số 0 và có ít nhất 10 chữ số");
      return;
    }
    // Validate mã NV, tên đăng nhập, mật khẩu không chứa dấu cách
    if (/\s/.test(editNhanVien.maNhanVien)) {
      setEditError("Mã nhân viên không được chứa dấu cách");
      return;
    }
    if (/\s/.test(editNhanVien.tenTaiKhoan)) {
      setEditError("Tên đăng nhập không được chứa dấu cách");
      return;
    }
    if (/\s/.test(editNhanVien.matKhau)) {
      setEditError("Mật khẩu không được chứa dấu cách");
      return;
    }
    // Validate mã NV, tên đăng nhập không được chứa ký tự có dấu
    if (/[^\x00-\x7F]/.test(editNhanVien.maNhanVien)) {
      setEditError("Mã nhân viên không được chứa ký tự có dấu");
      return;
    }
    if (/[^\x00-\x7F]/.test(editNhanVien.tenTaiKhoan)) {
      setEditError("Tên đăng nhập không được chứa ký tự có dấu");
      return;
    }
    setEditLoading(true);
    try {
      const res = await fetch(`http://localhost:8080/nhan-vien/sua/${editNhanVien.idNhanVien}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editNhanVien,
          gioiTinh: editNhanVien.gioiTinh === "Nam" || editNhanVien.gioiTinh === true
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        fetchNhanViens();
        showToast('success', 'Cập nhật nhân viên thành công!');
      } else {
        setEditError(data.message || "Có lỗi xảy ra");
        showToast('error', data.message || "Cập nhật nhân viên thất bại!");
      }
    } catch {
      setEditError("Không thể kết nối server");
      showToast('error', 'Không thể kết nối server!');
    }
    setEditLoading(false);
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
    <>
      {/* Modal thêm nhân viên */}
      {showAddModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <form onSubmit={handleAddNhanVien} style={{ background: "#fff", padding: 32, borderRadius: 12, minWidth: 400, boxShadow: "0 4px 24px #0002", position: "relative" }}>
              <button type="button" onClick={() => setShowAddModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}><FaTimes /></button>
              <h3 style={{ marginBottom: 18, color: "#b59d3a", fontWeight: 700, fontSize: 20 }}>Thêm nhân viên mới</h3>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input required placeholder="Mã nhân viên" value={addForm.maNhanVien} onChange={e => setAddForm(f => ({ ...f, maNhanVien: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                <input required placeholder="Họ và tên nhân viên" value={addForm.tenNhanVien} onChange={e => setAddForm(f => ({ ...f, tenNhanVien: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                <input required placeholder="Tên đăng nhập" value={addForm.tenTaiKhoan} onChange={e => setAddForm(f => ({ ...f, tenTaiKhoan: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                <div style={{ position: 'relative' }}>
                  <input
                      required
                      placeholder="Mật khẩu"
                      type={showPassword ? "text" : "password"}
                      value={addForm.matKhau}
                      onChange={e => setAddForm(f => ({ ...f, matKhau: e.target.value }))}
                      style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", width: '100%', paddingRight: 38 }}
                  />
                  <span
                      onClick={() => setShowPassword(v => !v)}
                      style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#b59d3a', fontSize: 18 }}
                  >
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </span>
                </div>
                <input required placeholder="Email" type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                <input required placeholder="Số điện thoại" value={addForm.soDienThoai} onChange={e => setAddForm(f => ({ ...f, soDienThoai: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                <input required placeholder="Ngày sinh" type="date" value={addForm.ngaySinh} onChange={e => setAddForm(f => ({ ...f, ngaySinh: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                <input required placeholder="Địa chỉ" value={addForm.diaChi} onChange={e => setAddForm(f => ({ ...f, diaChi: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                <select value={addForm.gioiTinh} onChange={e => setAddForm(f => ({ ...f, gioiTinh: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }}>
                  <option value="Nam">Nam</option>
                  <option value="Nữ">Nữ</option>
                </select>
                <select value={addForm.idVaiTro} onChange={e => setAddForm(f => ({ ...f, idVaiTro: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }}>
                  <option value="1">Admin</option>
                  <option value="2">Nhân viên</option>
                  {/*<option value="3">Khách hàng</option>*/}
                </select>
                {/*<select value={addForm.trangThai} onChange={e => setAddForm(f => ({ ...f, trangThai: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }}>*/}
                {/*    <option value="Hoạt động">Hoạt động</option>*/}
                {/*    <option value="Ngừng hoạt động">Ngừng hoạt động</option>*/}
                {/*</select>*/}
              </div>
              {addError && <div style={{ color: "red", marginTop: 10 }}>{addError}</div>}
              <button type="submit" disabled={addLoading} style={{ marginTop: 18, background: "#b59d3a", color: "#fff", border: "none", borderRadius: 7, padding: "10px 0", fontWeight: 600, fontSize: 16, width: "100%", cursor: addLoading ? "not-allowed" : "pointer" }}>
                {addLoading ? "Đang thêm..." : "Thêm nhân viên"}
              </button>
            </form>
          </div>
      )}
      <div>
        {/* Header with search and filters */}
        <div style={{ padding: "24px 32px 0 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ color: "#333", fontWeight: 700, marginBottom: 24, fontSize: "1.5rem" }}>
            Danh sách nhân viên
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <input
                type="text"
                placeholder="Tìm kiếm nhân viên..."
                value={searchValue}
                onChange={e => setSearchValue(e.target.value)}
                style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", minWidth: 220, fontSize: 15 }}
                onKeyDown={e => { if (e.key === 'Enter') handleSearch(); }}
            />
            <button
                style={{ background: "#b59d3a", color: "#fff", border: "none", borderRadius: 7, padding: "9px 18px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: 'flex', alignItems: 'center', gap: 7 }}
                onClick={handleSearch}
            >
              <FaSearch style={{ fontSize: 16 }} />
              Tìm kiếm
            </button>
            <button
                style={{ background: "#eee", color: "#b59d3a", border: "none", borderRadius: 7, padding: "9px 14px", fontWeight: 600, fontSize: 15, cursor: "pointer", display: 'flex', alignItems: 'center', gap: 7 }}
                onClick={() => { setSearchValue(""); fetchNhanViens(); }}
            >
              <FaSyncAlt style={{ fontSize: 16 }} />
              Làm mới
            </button>
            <button
                style={{ background: "#b59d3a", color: "#fff", border: "none", borderRadius: 8, padding: "10px 22px", fontWeight: 600, fontSize: 16, cursor: "pointer", boxShadow: "0 2px 8px #b59d3a22" }}
                onClick={() => setShowAddModal(true)}
            >
              + Thêm nhân viên
            </button>
          </div>
        </div>

        {/* Filter controls */}
        <div style={{ padding: "0 32px 16px 32px" }}>
          <div style={{ display: "flex", gap: 16, marginBottom: 12 }}>
            <select
                value={filterVaiTro}
                onChange={e => setFilterVaiTro(e.target.value)}
                style={{ padding: 8, borderRadius: 7, border: "1.5px solid #b59d3a55", minWidth: 150 }}
            >
              <option value="">-- Tất cả chức vụ --</option>
              <option value="1">Admin</option>
              <option value="2">Nhân viên</option>
              {/*<option value="3">Khách hàng</option>*/}
            </select>
            <select
                value={filterTrangThai}
                onChange={e => setFilterTrangThai(e.target.value)}
                style={{ padding: 8, borderRadius: 7, border: "1.5px solid #b59d3a55", minWidth: 150 }}
            >
              <option value="">-- Tất cả trạng thái --</option>
              <option value="Hoạt động">Hoạt động</option>
              <option value="Ngừng hoạt động">Ngừng hoạt động</option>
            </select>
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
                <tr style={{ background: "#f3f3f3" }}>
                  <th style={{ width: 50, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>STT</th>
                  <th style={{ width: 90, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Mã NV</th>
                  <th style={{ width: 180, textAlign: "left", color: "#222", padding: "9px 18px", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Tên NV</th>
                  <th style={{ width: 80, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Giới tính</th>
                  <th style={{ width: 110, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Ngày sinh</th>
                  <th style={{ width: 120, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>SĐT</th>
                  <th style={{ width: 120, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Email</th>
                  <th style={{ width: 150, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Vai trò</th>
                  <th style={{ width: 110, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Trạng thái tài khoản</th>
                  <th style={{ width: 100, textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 700, borderBottom: "2px solid #ddd" }}>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {currentNhanViens.map((nv, idx) => (
                    <tr key={nv.idNhanVien} style={{
                      background: idx % 2 === 0 ? "#fff" : "#f9f9f9"
                    }}>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.idNhanVien}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.maNhanVien}</td>
                      <td style={{ textAlign: "left", color: "#222", padding: "9px 18px", fontWeight: 500 }}>{nv.tenNhanVien}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.gioiTinh === true ? "Nam" : "Nữ"}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.ngaySinh}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.soDienThoai}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.email}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{getTenVaiTro(nv.idVaiTro)}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0", fontWeight: 500 }}>{nv.trangThai || ""}</td>
                      <td style={{ textAlign: "center", color: "#222", padding: "9px 0" }}>
                        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                          <button
                              style={{ background: "#3498db", color: "black", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              title="Xem chi tiết"
                              onClick={() => handleShowDetail(nv.idNhanVien)}
                          >
                            <FaEye style={{ fontSize: 15 }} />
                          </button>
                          <button
                              style={{ background: "#f1c40f", color: "#222", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                              title="Sửa thông tin"
                              onClick={() => handleShowEdit(nv.idNhanVien)}
                          >
                            <FaEdit style={{ fontSize: 15 }} />
                          </button>
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
                  <div style={{
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    padding: "20px 32px",
                    background: "#fff",
                    marginTop: "20px",
                    borderRadius: "10px",
                    boxShadow: "0 2px 8px #0001",
                    gap: "10px"
                  }}>
                              <span style={{ color: "#666", fontSize: "14px" }}>
                                  Trang {currentPage + 1} / {totalPages} (Hiển thị {currentNhanViens.length} trong tổng số {filteredNhanViens.length} nhân viên)
                              </span>

                    <button
                        onClick={() => handlePageChange(currentPage - 1)}
                        disabled={currentPage === 0}
                        style={{
                          padding: "8px 12px",
                          background: currentPage === 0 ? "#f0f0f0" : "#b59d3a",
                          color: currentPage === 0 ? "#999" : "#fff",
                          border: "none",
                          borderRadius: "5px",
                          cursor: currentPage === 0 ? "not-allowed" : "pointer",
                          fontSize: "14px"
                        }}
                    >
                      <FaChevronLeft />
                    </button>

                    {Array.from({ length: totalPages }, (_, i) => (
                        <button
                            key={i}
                            onClick={() => handlePageChange(i)}
                            style={{
                              padding: "8px 12px",
                              background: currentPage === i ? "#b59d3a" : "#fff",
                              color: currentPage === i ? "#fff" : "#333",
                              border: currentPage === i ? "none" : "1px solid #ddd",
                              borderRadius: "5px",
                              cursor: "pointer",
                              fontSize: "14px",
                              minWidth: "40px"
                            }}
                        >
                          {i + 1}
                        </button>
                    ))}

                    <button
                        onClick={() => handlePageChange(currentPage + 1)}
                        disabled={currentPage === totalPages - 1}
                        style={{
                          padding: "8px 12px",
                          background: currentPage === totalPages - 1 ? "#f0f0f0" : "#b59d3a",
                          color: currentPage === totalPages - 1 ? "#999" : "#fff",
                          border: "none",
                          borderRadius: "5px",
                          cursor: currentPage === totalPages - 1 ? "not-allowed" : "pointer",
                          fontSize: "14px"
                        }}
                    >
                      <FaChevronRight />
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
                    <div style={{ color: '#222' }}><b>Mã NV:</b> {detailNhanVien.maNhanVien}</div>
                    <div style={{ color: '#222' }}><b>Họ tên:</b> {detailNhanVien.tenNhanVien}</div>
                    <div style={{ color: '#222' }}><b>Tên đăng nhập:</b> {detailNhanVien.tenTaiKhoan}</div>
                    <div style={{ color: '#222' }}><b>Email:</b> {detailNhanVien.email}</div>
                    <div style={{ color: '#222' }}><b>Số điện thoại:</b> {detailNhanVien.soDienThoai}</div>
                    <div style={{ color: '#222' }}><b>Ngày sinh:</b> {detailNhanVien.ngaySinh}</div>
                    <div style={{ color: '#222' }}><b>Giới tính:</b> {detailNhanVien.gioiTinh === true ? "Nam" : detailNhanVien.gioiTinh === false ? "Nữ" : ""}</div>
                    <div style={{ color: '#222' }}><b>Địa chỉ:</b> {detailNhanVien.diaChi}</div>
                    <div style={{ color: '#222' }}><b>Vai trò:</b> {getTenVaiTro(detailNhanVien.idVaiTro)}</div>
                    <div style={{ color: '#222' }}><b>Trạng thái:</b> {detailNhanVien.trangThai}</div>
                  </div>
              ) : (
                  <div style={{ color: 'red', textAlign: 'center', padding: 24 }}>Không tìm thấy thông tin nhân viên</div>
              )}
            </div>
          </div>
      )}
      {/* Modal sửa nhân viên */}
      {showEditModal && (
          <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "#0008", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <form onSubmit={handleEditNhanVien} style={{ background: "#fff", padding: 32, borderRadius: 12, minWidth: 400, boxShadow: "0 4px 24px #0002", position: "relative", maxWidth: 480 }}>
              <button type="button" onClick={() => setShowEditModal(false)} style={{ position: "absolute", top: 16, right: 16, background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#888" }}><FaTimes /></button>
              <h3 style={{ marginBottom: 18, color: "#b59d3a", fontWeight: 700, fontSize: 20 }}>Sửa thông tin nhân viên</h3>
              {editLoading ? (
                  <div style={{ textAlign: 'center', color: '#888', padding: 24 }}>Đang tải...</div>
              ) : editNhanVien ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <input required placeholder="Mã nhân viên" value={editNhanVien.maNhanVien || ""} onChange={e => setEditNhanVien((f: any) => ({ ...f, maNhanVien: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                    <input required placeholder="Họ và tên nhân viên" value={editNhanVien.tenNhanVien || ""} onChange={e => setEditNhanVien((f: any) => ({ ...f, tenNhanVien: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                    <input required placeholder="Tên đăng nhập" value={editNhanVien.tenTaiKhoan || ""} onChange={e => setEditNhanVien((f: any) => ({ ...f, tenTaiKhoan: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                    <div style={{ position: 'relative' }}>
                      <input
                          required
                          placeholder="Mật khẩu"
                          type={showEditPassword ? "text" : "password"}
                          value={editNhanVien.matKhau || ""}
                          onChange={e => setEditNhanVien((f: any) => ({ ...f, matKhau: e.target.value }))}
                          style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55", width: '100%', paddingRight: 38 }}
                      />
                      <span
                          onClick={() => setShowEditPassword(v => !v)}
                          style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: '#b59d3a', fontSize: 18 }}
                      >
                                      {showEditPassword ? <FaEyeSlash /> : <FaEye />}
                                  </span>
                    </div>
                    <input required placeholder="Email" type="email" value={editNhanVien.email || ""} onChange={e => setEditNhanVien((f: any) => ({ ...f, email: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                    <input required placeholder="Số điện thoại" value={editNhanVien.soDienThoai || ""} onChange={e => setEditNhanVien((f: any) => ({ ...f, soDienThoai: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                    <input required placeholder="Ngày sinh" type="date" value={editNhanVien.ngaySinh || ""} onChange={e => setEditNhanVien((f: any) => ({ ...f, ngaySinh: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                    <input required placeholder="Địa chỉ" value={editNhanVien.diaChi || ""} onChange={e => setEditNhanVien((f: any) => ({ ...f, diaChi: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }} />
                    <select value={editNhanVien.gioiTinh === true || editNhanVien.gioiTinh === "Nam" ? "Nam" : "Nữ"} onChange={e => setEditNhanVien((f: any) => ({ ...f, gioiTinh: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }}>
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                    </select>
                    <select value={editNhanVien.idVaiTro} onChange={e => setEditNhanVien((f: any) => ({ ...f, idVaiTro: e.target.value }))} style={{ padding: 9, borderRadius: 7, border: "1.5px solid #b59d3a55" }}>
                      {vaiTros.map(vt => (
                          <option key={vt.idVaiTro} value={vt.idVaiTro}>{vt.tenVaiTro}</option>
                      ))}
                    </select>
                  </div>
              ) : (
                  <div style={{ color: 'red', textAlign: 'center', padding: 24 }}>{editError || "Không tìm thấy thông tin nhân viên"}</div>
              )}
              {editError && <div style={{ color: "red", marginTop: 10 }}>{editError}</div>}
              <button type="submit" disabled={editLoading} style={{ marginTop: 18, background: "#b59d3a", color: "#fff", border: "none", borderRadius: 7, padding: "10px 0", fontWeight: 600, fontSize: 16, width: "100%", cursor: editLoading ? "not-allowed" : "pointer" }}>
                {editLoading ? "Đang lưu..." : "Lưu thay đổi"}
              </button>
            </form>
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
    </>
  );
} 