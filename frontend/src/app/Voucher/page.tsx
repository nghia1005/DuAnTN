"use client";

import React, { useEffect, useState } from 'react';
import AdminLayout from '../../component/Admin-Layout';

interface Voucher {
  idPhieuGiamGia: number;
  maPhieuGiamGia: string;
  tenPhieuGiamGia: string;
  kieuGiamGia: string;
  giaTriToiThieu: number;
  giaTriToiDa: number;
  soLuong: number;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
  trangThai: string;
  phanTramGiamGia: number;
}

const apiUrl = 'http://localhost:8080/api/voucher';

// Helper chuyển mã kiểu giảm giá sang tiếng Việt
const kieuGiamGiaHienThi = (ma: string) => {
  switch (ma) {
    case 'PHAN_TRAM': return 'Phần trăm';
    case 'GIAM_TRUC_TIEP': return 'Giảm trực tiếp';
    case 'FREE_SHIP': return 'Free ship';
    default: return ma;
  }
};

// Helper format ngày
function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN');
}

const VoucherPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editVoucher, setEditVoucher] = useState<Voucher | null>(null);
  const [form, setForm] = useState<Partial<Voucher>>({});
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);
  // Thêm state cho phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const fetchVouchers = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('Đang fetch từ:', apiUrl);
      const res = await fetch(apiUrl);
      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('Response data:', data);
      
      // Đảm bảo data là array
      if (Array.isArray(data)) {
        setVouchers(data);
        console.log('Đã set vouchers:', data.length, 'items');
      } else {
        console.error('API trả về không phải array:', data);
        setVouchers([]);
        setError(`Dữ liệu không hợp lệ từ server: ${JSON.stringify(data)}`);
      }
    } catch (e) {
      console.error('Lỗi fetch vouchers:', e);
      setVouchers([]);
      const errorMessage = e instanceof Error ? e.message : 'Lỗi không xác định';
      setError(`Lỗi khi tải danh sách phiếu giảm giá: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVouchers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // Thêm hàm riêng cho select
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdd = () => {
    setForm({});
    setEditVoucher(null);
    setShowForm(true);
  };

  const handleEdit = (voucher: Voucher) => {
    setForm(voucher);
    setEditVoucher(voucher);
    setShowForm(true);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Bạn có chắc muốn xóa phiếu giảm giá này?')) return;
    try {
      await fetch(`${apiUrl}/${id}`, { method: 'DELETE' });
      fetchVouchers();
    } catch (e) {
      setError('Lỗi khi xóa phiếu giảm giá');
    }
  };

  const handleToggleStatus = async (voucher: Voucher) => {
    try {
      const res = await fetch(`${apiUrl}/${voucher.idPhieuGiamGia}/toggle-status`, { method: 'PUT' });
      if (res.ok) {
        const updatedVoucher = await res.json();
        setVouchers(prev =>
            prev.map(v =>
                v.idPhieuGiamGia === updatedVoucher.idPhieuGiamGia ? updatedVoucher : v
            )
        );
        setSuccess('Đổi trạng thái thành công');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError('Lỗi khi đổi trạng thái phiếu giảm giá');
      }
    } catch (e) {
      setError('Lỗi khi đổi trạng thái phiếu giảm giá');
    }
  };

  const validateForm = () => {
    const errors: { [key: string]: string } = {};
    if (!form.maPhieuGiamGia || !form.maPhieuGiamGia.trim()) errors.maPhieuGiamGia = 'Mã không được để trống';
    if (!form.tenPhieuGiamGia || !form.tenPhieuGiamGia.trim()) errors.tenPhieuGiamGia = 'Tên không được để trống';
    if (!form.kieuGiamGia) errors.kieuGiamGia = 'Vui lòng chọn kiểu';
    if (!form.trangThai) errors.trangThai = 'Vui lòng chọn trạng thái';
    if (!form.soLuong || isNaN(Number(form.soLuong)) || Number(form.soLuong) < 1) errors.soLuong = 'Số lượng phải lớn hơn 0';
    if (!form.giaTriToiThieu || isNaN(Number(form.giaTriToiThieu)) || Number(form.giaTriToiThieu) < 0) errors.giaTriToiThieu = 'Giá trị tối thiểu phải >= 0';
    if (!form.giaTriToiDa || isNaN(Number(form.giaTriToiDa)) || Number(form.giaTriToiDa) < 0) errors.giaTriToiDa = 'Giá trị tối đa phải >= 0';
    if (!form.phanTramGiamGia || isNaN(Number(form.phanTramGiamGia)) || Number(form.phanTramGiamGia) < 0) errors.phanTramGiamGia = 'Phần trăm giảm phải >= 0';
    if (!form.ngayBatDau) errors.ngayBatDau = 'Vui lòng chọn ngày bắt đầu';
    if (!form.ngayKetThuc) errors.ngayKetThuc = 'Vui lòng chọn ngày kết thúc';
    // Kiểm tra ngày kết thúc >= ngày bắt đầu
    if (form.ngayBatDau && form.ngayKetThuc && form.ngayBatDau > form.ngayKetThuc) errors.ngayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSaving(false);
      return;
    }
    try {
      const method = editVoucher ? 'PUT' : 'POST';
      const url = editVoucher ? `${apiUrl}/${editVoucher.idPhieuGiamGia}` : apiUrl;
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Lỗi khi lưu phiếu giảm giá');
      setShowForm(false);
      const newVoucher = await res.json();
      if (!editVoucher) {
        setVouchers(prev => [newVoucher, ...prev]);
        setSuccess('Thêm phiếu giảm giá thành công');
      } else {
        setVouchers(prev => prev.map(v => v.idPhieuGiamGia === newVoucher.idPhieuGiamGia ? newVoucher : v));
        setSuccess('Cập nhật phiếu giảm giá thành công');
      }
      setTimeout(() => setSuccess(''), 2500);
    } catch (e) {
      setError('Lỗi khi lưu phiếu giảm giá');
    } finally {
      setSaving(false);
    }
  };

  // Tạo danh sách voucher đã lọc
  const filteredVouchers = Array.isArray(vouchers) ? vouchers.filter(v => {
    const matchStatus = !filterStatus || v.trangThai === filterStatus;
    const matchType = !filterType || v.kieuGiamGia === filterType;
    const matchSearch =
        !search ||
        v.maPhieuGiamGia.toLowerCase().includes(search.toLowerCase()) ||
        v.tenPhieuGiamGia.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  }) : [];

  // Reset về trang 1 khi filter/search thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, search, Array.isArray(vouchers) ? vouchers.length : 0]);

  // Tính toán phân trang
  const totalPages = Math.ceil(filteredVouchers.length / itemsPerPage);
  const paginatedVouchers = filteredVouchers.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage
  );

  return (
    <AdminLayout activeMenu="promotions" onMenuChangeAction={() => {}} pageTitle="Khuyến mãi">
      <div style={{ padding: 24, fontFamily: 'Segoe UI, Arial, sans-serif', background: '#fcf8e8', minHeight: '100vh' }}>
        <h1 style={{ color: '#6b4f1d', fontWeight: 800, marginBottom: 24 }}>Quản lý Phiếu Giảm Giá</h1>
        {success && <div style={{ color: 'green', marginBottom: 16 }}>{success}</div>}
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {saving && <div style={{ color: '#2980b9', marginBottom: 16 }}>Đang lưu...</div>}
        {loading && <div style={{ color: '#2980b9', marginBottom: 16 }}>Đang tải dữ liệu...</div>}
        {/* Bộ lọc và tìm kiếm + nút thêm */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <label style={{ fontWeight: 600, marginRight: 6 }}>Trạng thái:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="">Tất cả</option>
                <option value="Hoạt động">Hoạt động</option>
                <option value="Ngừng hoạt động">Ngừng hoạt động</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, marginRight: 6 }}>Kiểu:</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="">Tất cả</option>
                <option value="PHAN_TRAM">Phần trăm</option>
                <option value="GIAM_TRUC_TIEP">Giảm trực tiếp</option>
                <option value="FREE_SHIP">Free ship</option>
              </select>
            </div>
            <div>
              <input
                  type="text"
                  placeholder="Tìm kiếm mã hoặc tên..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', minWidth: 220 }}
              />
            </div>
            {(filterStatus || filterType || search) && (
                <button
                    onClick={() => { setFilterStatus(''); setFilterType(''); setSearch(''); }}
                    style={{
                      background: '#e67e22',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      padding: '8px 18px',
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px #e67e2222',
                      transition: 'background 0.2s',
                      whiteSpace: 'nowrap',
                    }}
                    title="Xóa lọc và tìm kiếm"
                    type="button"
                >
                  Xóa lọc
                </button>
            )}
          </div>
          <div style={{ flex: 1 }} />
          <button
              onClick={handleAdd}
              style={{
                background: '#b59d3a',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                padding: '10px 22px',
                fontWeight: 600,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '0 2px 8px #b59d3a22',
                transition: 'background 0.2s',
                whiteSpace: 'nowrap',
              }}
          >
            Thêm phiếu giảm giá
          </button>
        </div>
        {showForm && (
            <form
                onSubmit={handleSubmit}
                style={{
                  border: '1.5px solid #b59d3a44',
                  borderRadius: 12,
                  boxShadow: '0 4px 16px #b59d3a22',
                  padding: 24,
                  marginBottom: 32,
                  background: '#fff',
                  maxWidth: 1100,
                  marginLeft: 'auto',
                  marginRight: 'auto',
                }}
            >
              <h2 style={{ color: '#b59d3a', fontWeight: 700, marginBottom: 18 }}>{editVoucher ? 'Sửa' : 'Thêm'} phiếu giảm giá</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Mã:<br />
                    <input name="maPhieuGiamGia" value={form.maPhieuGiamGia || ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.maPhieuGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.maPhieuGiamGia}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Tên:<br />
                    <input name="tenPhieuGiamGia" value={form.tenPhieuGiamGia || ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.tenPhieuGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.tenPhieuGiamGia}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Kiểu:<br />
                    <select
                        name="kieuGiamGia"
                        value={form.kieuGiamGia || ''}
                        onChange={handleSelectChange}
                        required
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }}
                    >
                      <option value="">-- Chọn kiểu --</option>
                      <option value="PHAN_TRAM">Phần trăm</option>
                      <option value="GIAM_TRUC_TIEP">Giảm trực tiếp</option>
                      <option value="FREE_SHIP">Free ship</option>
                    </select>
                  </label>
                  {formErrors.kieuGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.kieuGiamGia}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Giá trị tối thiểu:<br />
                    <input name="giaTriToiThieu" type="number" value={form.giaTriToiThieu || ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.giaTriToiThieu && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.giaTriToiThieu}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Giá trị tối đa:<br />
                    <input name="giaTriToiDa" type="number" value={form.giaTriToiDa || ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.giaTriToiDa && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.giaTriToiDa}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Phần trăm giảm:<br />
                    <input name="phanTramGiamGia" type="number" value={form.phanTramGiamGia || ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.phanTramGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.phanTramGiamGia}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Số lượng:<br />
                    <input name="soLuong" type="number" value={form.soLuong || ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.soLuong && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.soLuong}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Ngày bắt đầu:<br />
                    <input name="ngayBatDau" type="date" value={form.ngayBatDau ? form.ngayBatDau.slice(0,10) : ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.ngayBatDau && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.ngayBatDau}</div>}
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Ngày kết thúc:<br />
                    <input name="ngayKetThuc" type="date" value={form.ngayKetThuc ? form.ngayKetThuc.slice(0,10) : ''} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.ngayKetThuc && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.ngayKetThuc}</div>}
                </div>
                <div style={{ flex: 2, minWidth: 220 }}>
                  <label style={{ fontWeight: 600 }}>Mô tả:<br />
                    <textarea name="moTa" value={form.moTa || ''} onChange={handleInputChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4, minHeight: 38 }} />
                  </label>
                </div>
                <div style={{ flex: '1 1 180px', minWidth: 180 }}>
                  <label style={{ fontWeight: 600 }}>Trạng thái:<br />
                    <select
                        name="trangThai"
                        value={form.trangThai || ''}
                        onChange={handleSelectChange}
                        required
                        style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }}
                    >
                      <option value="">-- Chọn trạng thái --</option>
                      <option value="Hoạt động">Hoạt động</option>
                      <option value="Ngừng hoạt động">Ngừng hoạt động</option>
                    </select>
                  </label>
                  {formErrors.trangThai && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.trangThai}</div>}
                </div>
              </div>
              <div style={{ marginTop: 24, display: 'flex', gap: 12 }}>
                <button type="submit" style={{ background: '#27ae60', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 28px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #27ae6022' }}>Lưu</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '10px 22px', fontWeight: 600, fontSize: 16, cursor: 'pointer', boxShadow: '0 2px 8px #e74c3c22' }}>Hủy</button>
              </div>
            </form>
        )}
        {loading ? (
            <div>Đang tải...</div>
        ) : (
            <div style={{ overflowX: 'auto', maxWidth: '100%', margin: '0 auto' }}>
              <table
                  border={0}
                  cellPadding={8}
                  cellSpacing={0}
                  style={{
                    width: '100%',
                    background: '#fff',
                    borderRadius: 12,
                    boxShadow: '0 4px 16px #b59d3a22',
                    borderCollapse: 'separate',
                    borderSpacing: 0,
                    marginBottom: 24,
                    fontSize: 15,
                  }}
              >
                <thead>
                <tr style={{ background: '#b59d3a', color: '#fff' }}>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Mã</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Tên</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Kiểu</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Giá trị tối thiểu</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Giá trị tối đa</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Phần trăm giảm</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Số lượng</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Ngày bắt đầu</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Ngày kết thúc</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Mô tả</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Trạng thái</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12 }}>Hành động</th>
                </tr>
                </thead>
                <tbody>
                {paginatedVouchers.map((v, idx) => (
                    <tr key={v.idPhieuGiamGia} style={{ background: idx % 2 === 0 ? '#fffbe6' : '#fff', transition: 'background 0.2s' }}>
                      <td style={{ textAlign: 'center', fontWeight: 500 }}>{v.maPhieuGiamGia}</td>
                      <td style={{ textAlign: 'center' }}>{v.tenPhieuGiamGia}</td>
                      <td style={{ textAlign: 'center' }}>{kieuGiamGiaHienThi(v.kieuGiamGia)}</td>
                      <td style={{ textAlign: 'center' }}>{v.giaTriToiThieu}</td>
                      <td style={{ textAlign: 'center' }}>{v.giaTriToiDa}</td>
                      <td style={{ textAlign: 'center' }}>{v.phanTramGiamGia}</td>
                      <td style={{ textAlign: 'center' }}>{v.soLuong}</td>
                      <td style={{ textAlign: 'center' }}>{formatDate(v.ngayBatDau)}</td>
                      <td style={{ textAlign: 'center' }}>{formatDate(v.ngayKetThuc)}</td>
                      <td style={{ textAlign: 'center' }}>{v.moTa}</td>
                      <td style={{ textAlign: 'center' }}>{v.trangThai}</td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); setSelectedVoucher(v); setShowDetailModal(true); }}
                            title="Xem chi tiết"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 6, fontSize: 20 }}
                        >👁️</button>
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleEdit(v); }}
                            title="Sửa"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', marginRight: 6, fontSize: 20 }}
                        >✏️</button>
                        <button
                            type="button"
                            onClick={e => { e.stopPropagation(); handleToggleStatus(v); }}
                            title="Đổi trạng thái"
                            style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20 }}
                        >{v.trangThai === 'Hoạt động' ? '⏸️' : '▶️'}</button>
                      </td>
                    </tr>
                ))}
                </tbody>
              </table>
            </div>
        )}
        {/* Phân trang */}
        {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, margin: '16px 0' }}>
              <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #b59d3a', background: currentPage === 1 ? '#eee' : '#fff', cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
              >Trước</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        border: page === currentPage ? '2px solid #b59d3a' : '1px solid #ccc',
                        background: page === currentPage ? '#b59d3a' : '#fff',
                        color: page === currentPage ? '#fff' : '#333',
                        fontWeight: page === currentPage ? 700 : 500,
                        cursor: 'pointer',
                        margin: '0 2px',
                      }}
                  >{page}</button>
              ))}
              <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #b59d3a', background: currentPage === totalPages ? '#eee' : '#fff', cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
              >Sau</button>
            </div>
        )}
        {/* Modal xem chi tiết voucher */}
        {showDetailModal && selectedVoucher && (
            <div style={{
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 2000,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <div style={{ background: '#fff', borderRadius: 12, padding: 32, minWidth: 340, maxWidth: 480, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
                <h2 style={{ color: '#b59d3a', fontWeight: 700, marginBottom: 18 }}>Chi tiết phiếu giảm giá</h2>
                <div style={{ marginBottom: 12 }}><b>Mã:</b> {selectedVoucher.maPhieuGiamGia}</div>
                <div style={{ marginBottom: 12 }}><b>Tên:</b> {selectedVoucher.tenPhieuGiamGia}</div>
                <div style={{ marginBottom: 12 }}><b>Kiểu:</b> {kieuGiamGiaHienThi(selectedVoucher.kieuGiamGia)}</div>
                <div style={{ marginBottom: 12 }}><b>Giá trị tối thiểu:</b> {selectedVoucher.giaTriToiThieu?.toLocaleString()}</div>
                <div style={{ marginBottom: 12 }}><b>Giá trị tối đa:</b> {selectedVoucher.giaTriToiDa?.toLocaleString()}</div>
                <div style={{ marginBottom: 12 }}><b>Phần trăm giảm:</b> {selectedVoucher.phanTramGiamGia}</div>
                <div style={{ marginBottom: 12 }}><b>Số lượng:</b> {selectedVoucher.soLuong}</div>
                <div style={{ marginBottom: 12 }}><b>Ngày bắt đầu:</b> {formatDate(selectedVoucher.ngayBatDau)}</div>
                <div style={{ marginBottom: 12 }}><b>Ngày kết thúc:</b> {formatDate(selectedVoucher.ngayKetThuc)}</div>
                <div style={{ marginBottom: 12 }}><b>Mô tả:</b> {selectedVoucher.moTa}</div>
                <div style={{ marginBottom: 12 }}><b>Trạng thái:</b> {selectedVoucher.trangThai}</div>
                <button onClick={() => setShowDetailModal(false)} style={{ marginTop: 18, background: '#b59d3a', color: '#fff', border: 'none', borderRadius: 7, padding: '10px 0', fontWeight: 600, fontSize: 16, width: '100%', cursor: 'pointer' }}>Đóng</button>
              </div>
            </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default VoucherPage; 