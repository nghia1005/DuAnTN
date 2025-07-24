"use client";
import React, { useEffect, useState } from 'react';
import AdminLayout from '../../../component/Admin-Layout';
import { FaEye, FaEdit, FaPowerOff } from 'react-icons/fa';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useRouter } from 'next/navigation';
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(customParseFormat);

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

const kieuGiamGiaHienThi = (ma: string) => {
  switch (ma) {
    case 'PERCENT':
      return 'Giảm theo phần trăm';
    case 'FIXED':
      return 'Giảm trực tiếp';
    case 'FREE_SHIP':
      return 'Free ship';
    default:
      return ma;
  }
};

function formatDate(dateStr: string | undefined) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN');
}

function formatDateTime(dateStr: string | undefined) {
  if (!dateStr) return '';
  // Parse dạng yyyy-MM-ddTHH:mm:ss và cộng thêm 7 giờ
  const d = dayjs(dateStr, 'YYYY-MM-DDTHH:mm:ss').add(7, 'hour');
  return d.format('HH:mm DD/MM/YYYY');
}

// Hàm xác định trạng thái hiển thị
function getVoucherStatus(v: Voucher) {
  if (v.trangThai === 'Tạm ngưng' || v.trangThai === 'Kết thúc sớm') return 'Kết thúc sớm';
  const now = new Date();
  const start = new Date(v.ngayBatDau);
  const end = new Date(v.ngayKetThuc);
  if (now < start) return 'Sắp diễn ra';
  if (now > end) return 'Đã kết thúc';
  return 'Đang diễn ra';
}

const HienThiVoucherPage = () => {
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedVoucher, setSelectedVoucher] = useState<Voucher | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [search, setSearch] = useState('');
  // Phân trang
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionMsg, setActionMsg] = useState<string>('');
  const router = useRouter();

  const fetchVouchers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(apiUrl);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      if (Array.isArray(data)) {
        setVouchers(data);
      } else {
        setVouchers([]);
        setError(`Dữ liệu không hợp lệ từ server: ${JSON.stringify(data)}`);
      }
    } catch (e) {
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

  // Lọc, tìm kiếm
  const filteredVouchers = Array.isArray(vouchers) ? vouchers.filter(v => {
    const matchStatus = !filterStatus || v.trangThai === filterStatus;
    const matchType = !filterType || v.kieuGiamGia === filterType;
    const matchSearch =
      !search ||
      v.maPhieuGiamGia.toLowerCase().includes(search.toLowerCase()) ||
      v.tenPhieuGiamGia.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchType && matchSearch;
  }) : [];

  // Sắp xếp voucher mới nhất lên đầu (idPhieuGiamGia giảm dần)
  const sortedVouchers = filteredVouchers.slice().sort((a, b) => b.idPhieuGiamGia - a.idPhieuGiamGia);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, filterType, search, Array.isArray(vouchers) ? vouchers.length : 0]);

  // Phân trang
  const totalPages = Math.ceil(sortedVouchers.length / itemsPerPage);
  const paginatedVouchers = sortedVouchers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Đổi trạng thái voucher
  const handleToggleStatus = async (voucher: Voucher) => {
    if (actionLoadingId) return;
    setActionLoadingId(voucher.idPhieuGiamGia);
    setActionMsg('');
    try {
      const res = await fetch(`${apiUrl}/doi-trang-thai/${voucher.idPhieuGiamGia}`, { method: 'PUT' });
      if (!res.ok) {
        const err = await res.text();
        throw new Error(err || 'Lỗi đổi trạng thái');
      }
      setActionMsg('Đổi trạng thái thành công!');
      // Nếu backend trả về trạng thái mới, dùng nó. Nếu không, tự chuyển đổi trạng thái
      let newStatus = '';
      try {
        const data = await res.json();
        if (data && data.trangThai) {
          newStatus = data.trangThai;
        }
      } catch {
        // Nếu không parse được JSON, fallback
      }
      setVouchers(prev =>
        prev.map(v =>
          v.idPhieuGiamGia === voucher.idPhieuGiamGia
            ? { ...v, trangThai: newStatus || (v.trangThai === 'Đang diễn ra' ? 'Kết thúc sớm' : 'Đang diễn ra') }
            : v
        )
      );
    } catch (e: any) {
      setActionMsg(e.message || 'Lỗi đổi trạng thái');
    } finally {
      setActionLoadingId(null);
      setTimeout(() => setActionMsg(''), 2500);
    }
  };

  return (
    <AdminLayout activeMenu="promotions" onMenuChangeAction={() => {}} pageTitle="Khuyến mãi">
      <div style={{ padding: 24, fontFamily: 'Segoe UI, Arial, sans-serif', background: '#fcf8e8', minHeight: '100vh' }}>
        <h1 style={{ color: '#6b4f1d', fontWeight: 800, marginBottom: 24 }}>Quản lý phiếu giảm giá</h1>
        {error && <div style={{ color: 'red', marginBottom: 16 }}>{error}</div>}
        {loading && <div style={{ color: '#2980b9', marginBottom: 16 }}>Đang tải dữ liệu...</div>}
        {actionMsg && <div style={{ position: 'fixed', top: 24, right: 24, background: '#2ecc40', color: '#fff', padding: '12px 24px', borderRadius: 8, zIndex: 2000, fontWeight: 600 }}>{actionMsg}</div>}
        {/* Bộ lọc và tìm kiếm */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 18, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            <div>
              <input
                type="text"
                placeholder="Tìm kiếm mã hoặc tên..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc', minWidth: 220 }}
              />
            </div>
            <div>
              <label style={{ fontWeight: 600, marginRight: 6 }}>Trạng thái:</label>
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="">Tất cả</option>
                <option value="Sắp diễn ra">Sắp diễn ra</option>
                <option value="Đang diễn ra">Đang diễn ra</option>
                <option value="Đã kết thúc">Đã kết thúc</option>
              </select>
            </div>
            <div>
              <label style={{ fontWeight: 600, marginRight: 6 }}>Kiểu:</label>
              <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ padding: 6, borderRadius: 6, border: '1px solid #ccc' }}>
                <option value="">Tất cả</option>
                <option value="PERCENT">Phần trăm</option>
                <option value="FIXED">Giảm trực tiếp</option>
                <option value="FREE_SHIP">Free ship</option>
              </select>
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
            onClick={() => window.location.href = "/Voucher/ThemVoucher"}
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
            + Thêm phiếu giảm giá
          </button>
        </div>
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
                <tr>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid" }}>STT</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Mã</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Tên</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Kiểu</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Giá trị tối thiểu</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Giá trị tối đa</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Phần trăm giảm</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Số lượng</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Ngày bắt đầu</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Ngày kết thúc</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Trạng thái</th>
                  <th style={{ textAlign: 'center', fontWeight: 700, padding: 12, borderBottom: "2px solid"}}>Hành động</th>

                </tr>
              </thead>
              <tbody>
                {paginatedVouchers.map((v, idx) => (
                  <tr key={v.idPhieuGiamGia} style={{ height: 60, borderBottom: '10px solid #fcf8e8' }}>
                    <td style={{ textAlign: 'center', fontWeight: 500 }}>{(currentPage - 1) * itemsPerPage + idx + 1}</td>
                    <td style={{ textAlign: 'center', fontWeight: 500 }}>{v.maPhieuGiamGia}</td>
                    <td style={{ textAlign: 'center', wordBreak: 'break-word', whiteSpace: 'normal', maxWidth: 180 }}>{v.tenPhieuGiamGia}</td>
                    <td style={{ textAlign: 'center' }}>{kieuGiamGiaHienThi(v.kieuGiamGia)}</td>
                    <td style={{ textAlign: 'center' }}>{v.giaTriToiThieu?.toLocaleString('vi-VN')} đ</td>
                    <td style={{ textAlign: 'center' }}>{v.giaTriToiDa?.toLocaleString('vi-VN')} đ</td>
                    <td style={{ textAlign: 'center' }}>{v.phanTramGiamGia}</td>
                    <td style={{ textAlign: 'center' }}>{v.soLuong}</td>
                    <td style={{ textAlign: 'center' }}>{formatDateTime(v.ngayBatDau)}</td>
                    <td style={{ textAlign: 'center' }}>{formatDateTime(v.ngayKetThuc)}</td>
                    <td style={{ textAlign: 'center' }}>{getVoucherStatus(v)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <button
                          style={{ background: "#3498db", color: "#222", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          title="Xem chi tiết"
                          onClick={e => { e.stopPropagation(); setSelectedVoucher(v); setShowDetailModal(true); }}
                        >
                          <FaEye style={{ fontSize: 15 }} />
                        </button>
                        <button
                          style={{ background: "#ffd600", color: "#222", border: "none", borderRadius: 6, padding: 6, cursor: "pointer", fontWeight: 600, fontSize: 15, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                          title="Sửa"
                          onClick={e => {
                            e.stopPropagation();
                            router.push(`/Voucher/SuaVoucher?id=${v.idPhieuGiamGia}`);
                          }}
                        >
                          <FaEdit style={{ fontSize: 15 }} />
                        </button>
                        <button
                          style={{
                            background: v.trangThai === 'Đang diễn ra' ? '#2ecc40' : '#e74c3c',
                            color: '#fff',
                            border: 'none',
                            borderRadius: 6,
                            padding: 6,
                            cursor: actionLoadingId === v.idPhieuGiamGia ? 'not-allowed' : 'pointer',
                            fontWeight: 600,
                            fontSize: 15,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            opacity: actionLoadingId === v.idPhieuGiamGia ? 0.6 : 1
                          }}
                          title={v.trangThai === 'Đang diễn ra' ? 'Kết thúc sớm' : 'Bật lại nếu còn hạn'}
                          disabled={actionLoadingId === v.idPhieuGiamGia || v.trangThai === 'Đã kết thúc'}
                          onClick={e => { e.stopPropagation(); handleToggleStatus(v); }}
                        >
                          {actionLoadingId === v.idPhieuGiamGia ? <span style={{ fontSize: 13 }}>...</span> : <FaPowerOff style={{ fontSize: 15 }} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Phân trang */}
        {totalPages > 1 && (
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,margin:'18px 0'}}>
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              style={{
                borderRadius: 20,
                minWidth: 60,
                color: '#222',
                border: '1.5px solid #bcdffb',
                background: currentPage === 1 ? '#f7f4e6' : '#fff',
                fontWeight: 600,
                fontSize: 16,
                margin: '0 4px',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                opacity: currentPage === 1 ? 0.6 : 1,
                padding: '8px 20px'
              }}
            >Trước</button>
            {Array.from({length: totalPages}, (_,i)=>(
              <button
                key={i}
                onClick={()=>setCurrentPage(i+1)}
                disabled={i+1===currentPage}
                style={{
                  borderRadius: 20,
                  minWidth: 40,
                  color: '#222',
                  border: '1.5px solid #bcdffb',
                  background: i+1===currentPage ? '#e5e2da' : '#fff',
                  fontWeight: i+1===currentPage ? 700 : 600,
                  fontSize: 16,
                  margin: '0 4px',
                  cursor: i+1===currentPage ? 'default' : 'pointer',
                  opacity: 1,
                  padding: '8px 16px'
                }}
              >{i+1}</button>
            ))}
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{
                borderRadius: 20,
                minWidth: 60,
                color: '#222',
                border: '1.5px solid #bcdffb',
                background: currentPage === totalPages ? '#f7f4e6' : '#fff',
                fontWeight: 600,
                fontSize: 16,
                margin: '0 4px',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                opacity: currentPage === totalPages ? 0.6 : 1,
                padding: '8px 20px'
              }}
            >Sau</button>
          </div>
        )}
        {/* Modal xem chi tiết voucher */}
        {showDetailModal && selectedVoucher && (
          <div style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: '#0008', zIndex: 2000,
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{ background: '#fff', borderRadius: 12, padding: 40, minWidth: 640, maxWidth: 640, boxShadow: '0 4px 24px #0002', position: 'relative' }}>
              <h2 style={{ color: '#b59d3a', fontWeight: 700, marginBottom: 18 }}>Chi tiết phiếu giảm giá</h2>
              <div style={{ marginBottom: 12 }}><b>Mã:</b> {selectedVoucher.maPhieuGiamGia}</div>
              <div style={{ marginBottom: 12 }}><b>Tên:</b> {selectedVoucher.tenPhieuGiamGia}</div>
              <div style={{ marginBottom: 12 }}><b>Kiểu:</b> {kieuGiamGiaHienThi(selectedVoucher.kieuGiamGia)}</div>
              <div style={{ marginBottom: 12 }}><b>Giá trị tối thiểu:</b> {selectedVoucher.giaTriToiThieu?.toLocaleString('vi-VN')} đ</div>
              <div style={{ marginBottom: 12 }}><b>Giá trị tối đa:</b> {selectedVoucher.giaTriToiDa?.toLocaleString('vi-VN')} đ</div>
              <div style={{ marginBottom: 12 }}><b>Phần trăm giảm:</b> {selectedVoucher.phanTramGiamGia}</div>
              <div style={{ marginBottom: 12 }}><b>Số lượng:</b> {selectedVoucher.soLuong}</div>
              <div style={{ marginBottom: 12 }}><b>Ngày bắt đầu:</b> {formatDateTime(selectedVoucher.ngayBatDau)}</div>
              <div style={{ marginBottom: 12 }}><b>Ngày kết thúc:</b> {formatDateTime(selectedVoucher.ngayKetThuc)}</div>
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

export default HienThiVoucherPage;