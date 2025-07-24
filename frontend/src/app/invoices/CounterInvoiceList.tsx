"use client";
import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CounterInvoiceList.module.css";
import CartList from "../pos/CartList";
import ProductSelector from "../pos/ProductSelector";
import { v4 as uuidv4 } from "uuid";

const STATUS_OPTIONS = [
  { label: "Tất cả", value: "ALL" },
  { label: "Chờ xác nhận", value: "Chờ xác nhận" },
  { label: "Chờ đóng gói", value: "Chờ đóng gói" },
  { label: "Chờ vận chuyển", value: "Chờ vận chuyển" },
  { label: "Đang vận chuyển", value: "Đang vận chuyển" },
  { label: "Đã nhận hàng", value: "Đã nhận hàng" },
  { label: "Hoàn tất", value: "Hoàn tất" },
];

// Hàm lấy màu theo trạng thái
const getStatusColor = (status: string) => {
  switch (status) {
    case "Chờ xác nhận": return "#ffb3b3"; // đỏ nhạt
    case "Chờ đóng gói": return "#ffe066"; // vàng
    case "Hoàn tất": return "#7be495"; // xanh lá
    default: return "#eee";
  }
};

// Hàm lấy màu cho nút filter
const getFilterButtonColor = (status: string) => {
  switch (status) {
    case "Tất cả": return "#1976d2"; // xanh dương
    case "Chờ vận chuyển": return "#ff9800"; // cam
    case "Đang vận chuyển": return "#fbc02d"; // vàng đậm
    case "Đã nhận hàng": return "#388e3c"; // xanh lá
    default: return "#222";
  }
};

const CounterInvoiceList = () => {
  const [activeStatus, setActiveStatus] = useState("ALL");
  const [selectedOrderCode, setSelectedOrderCode] = useState<string | null>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [sortNewest, setSortNewest] = useState(true);
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [quickDate, setQuickDate] = useState('today');

  useEffect(() => {
    axios.get("http://localhost:8080/api/hoadon")
      .then(res => {
        const ordersWithId = res.data.map((order: any) => ({
          ...order,
          id: order.idHoaDon
        }));
        setOrders(ordersWithId);
      })
      .catch(() => {
        // Nếu không lấy được dữ liệu từ backend, mock dữ liệu demo
        setOrders([
          {
            idHoaDon: 1,
            maHoaDon: "HD001",
            tenKhachHang: "Nguyễn Văn A",
            loaiDon: "Tại cửa hàng",
            trangThai: "Chờ xác nhận",
            tongTien: 1000000,
            ngayTao: "2024-06-01T10:00:00",
          },
          {
            idHoaDon: 2,
            maHoaDon: "HD002",
            tenKhachHang: "Trần Thị B",
            loaiDon: "Tại cửa hàng",
            trangThai: "Hoàn tất",
            tongTien: 2500000,
            ngayTao: "2024-06-02T14:30:00",
          }
        ]);
      });
  }, []);

  // Lọc hóa đơn tại cửa hàng
  const storeOrders = orders.filter(order => order.loaiDon === "Tại cửa hàng");
  // Lọc theo trạng thái
  let filteredOrders = activeStatus === "ALL"
    ? storeOrders
    : storeOrders.filter(order => order.trangThai === activeStatus);

  // Lọc theo tìm kiếm
  if (searchText.trim()) {
    filteredOrders = filteredOrders.filter(order =>
      (order.maHoaDon || '').toLowerCase().includes(searchText.toLowerCase()) ||
      (order.tenKhachHang || '').toLowerCase().includes(searchText.toLowerCase())
    );
  }

  // Lọc theo khoảng tiền
  if (minAmount) filteredOrders = filteredOrders.filter(order => Number(order.tongTien) >= Number(minAmount));
  if (maxAmount) filteredOrders = filteredOrders.filter(order => Number(order.tongTien) <= Number(maxAmount));

  // Lọc theo ngày tạo
  if (dateFrom) filteredOrders = filteredOrders.filter(order => new Date(order.ngayTao) >= new Date(dateFrom));
  if (dateTo) filteredOrders = filteredOrders.filter(order => new Date(order.ngayTao) <= new Date(dateTo));

  // Lọc nhanh theo hôm nay/hôm qua
  if (quickDate === 'today') {
    const today = new Date();
    today.setHours(0,0,0,0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);
    filteredOrders = filteredOrders.filter(order => {
      const d = new Date(order.ngayTao);
      return d >= today && d < tomorrow;
    });
  } else if (quickDate === 'yesterday') {
    const today = new Date();
    today.setHours(0,0,0,0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    filteredOrders = filteredOrders.filter(order => {
      const d = new Date(order.ngayTao);
      return d >= yesterday && d < today;
    });
  }

  // Sắp xếp mới nhất
  if (sortNewest) {
    filteredOrders = filteredOrders.sort((a, b) => {
      const dateA = a.ngayTao ? new Date(a.ngayTao).getTime() : 0;
      const dateB = b.ngayTao ? new Date(b.ngayTao).getTime() : 0;
      return dateB - dateA;
    });
  }

  // Khi chọn hóa đơn, lấy chi tiết
  const handleSelectOrder = async (code: string, orderFromList: any) => {
    setSelectedOrderCode(code);
    setLoadingDetail(true);
    // Thêm log để debug
    console.log('===> Object hóa đơn khi click:', orderFromList);
    console.log('===> idHoaDon truyền vào fetch:', orderFromList.idHoaDon);
    let id = orderFromList.idHoaDon;
    if (!id || isNaN(Number(id))) {
      alert('Không tìm thấy ID số của hóa đơn!');
      setSelectedOrder(null);
      setLoadingDetail(false);
      return;
    }
    try {
      const resOrder = await fetch(`http://localhost:8080/api/hoadon/${id}`);
      if (!resOrder.ok) throw new Error('Không tìm thấy hóa đơn!');
      const orderData = await resOrder.json();
      const resDetails = await fetch(`http://localhost:8080/api/hoadonchitiet?idHoaDon=${id}`);
      const chiTietList = await resDetails.json();
      setSelectedOrder({ ...orderData, chiTiet: chiTietList });
    } catch (e) {
      setSelectedOrder(null);
      alert('Không tìm thấy hóa đơn!');
    }
    setLoadingDetail(false);
  };

  // Hàm lấy hóa đơn chờ lên POS
  const handleBringToPOS = async (order: any) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/hoadon/ma/${order.maHoaDon}`);
      const orderData = res.data;
      // Lưu vào localStorage để POS lấy lại
      localStorage.setItem('pendingOrderToPOS', JSON.stringify(orderData));
      // Chuyển hướng sang POS
      window.location.href = '/dashboard/pos';
    } catch (e) {
      alert('Không lấy được chi tiết hóa đơn!');
    }
  };

  // Hàm xác nhận đơn hàng (chuyển sang Chờ đóng gói)
  const handleConfirmOrder = async () => {
    if (!selectedOrder) return;
    try {
      await fetch(`http://localhost:8080/api/hoadon/${selectedOrder.idHoaDon || selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idHoaDon: selectedOrder.idHoaDon || selectedOrder.id,
          trangThai: 'Chờ đóng gói'
        })
      });
      alert('Đã xác nhận đơn hàng!');
      // Chuyển filter sang Chờ đóng gói
      setActiveStatus('Chờ đóng gói');
      // Ẩn chi tiết hóa đơn
      setSelectedOrder(null);
      // Reload danh sách hóa đơn
      axios.get('http://localhost:8080/api/hoadon')
        .then(res => {
          const ordersWithId = res.data.map((order: any) => ({ ...order, id: order.idHoaDon }));
          setOrders(ordersWithId);
        })
        .catch(() => setOrders([]));
    } catch (e) {
      alert('Xác nhận đơn hàng thất bại!');
    }
  };

  // Hàm đổi trạng thái tổng quát
  const handleChangeStatus = async (newStatus: string) => {
    if (!selectedOrder) return;
    try {
      // Loại bỏ trường chiTiet nếu có
      const { chiTiet, ...orderToSend } = selectedOrder;
      await fetch(`http://localhost:8080/api/hoadon/${selectedOrder.idHoaDon || selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...orderToSend,
          trangThai: newStatus
        })
      });
      alert('Đã cập nhật trạng thái!');
      setActiveStatus(newStatus);
      setSelectedOrder(null);
      // Reload danh sách hóa đơn
      axios.get('http://localhost:8080/api/hoadon')
        .then(res => {
          const ordersWithId = res.data.map((order: any) => ({ ...order, id: order.idHoaDon }));
          setOrders(ordersWithId);
        })
        .catch(() => setOrders([]));
    } catch (e) {
      alert('Cập nhật trạng thái thất bại!');
    }
  };

  // Mapping trạng thái hiện tại sang trạng thái tiếp theo và label nút
  const statusTransitions: Record<string, { next: string, label: string, color: string }> = {
    "Chờ xác nhận": { next: "Chờ đóng gói", label: "Chuyển sang Chờ đóng gói", color: "#ffb3b3" }, // đỏ nhạt
    "Chờ đóng gói": { next: "Chờ vận chuyển", label: "Chuyển sang Chờ vận chuyển", color: "#ffe066" }, // vàng nhạt
    "Chờ vận chuyển": { next: "Đang vận chuyển", label: "Chuyển sang Đang vận chuyển", color: "#ff9800" }, // cam
    "Đang vận chuyển": { next: "Đã nhận hàng", label: "Chuyển sang Đã nhận hàng", color: "#fbc02d" }, // vàng đậm
    "Đã nhận hàng": { next: "Hoàn tất", label: "Hoàn tất đơn hàng", color: "#388e3c" } // xanh lá
    // Hoàn tất: không có next
  };

  return (
    <div style={{ background: "#fffbe6", minHeight: "100vh", padding: 32 }}>
      {/* 1. Khối filter trạng thái */}
      <div className={styles.formBlock}>
        <div style={{ display: "flex", gap: 24, justifyContent: "center", flexWrap: "wrap" }}>
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.value}
              style={{
                padding: "16px 36px",
                border: "2px solid #bbb",
                borderRadius: 16,
                fontSize: 18,
                fontWeight: 600,
                background: activeStatus === opt.value && ["Tất cả", "Chờ vận chuyển", "Đang vận chuyển", "Đã nhận hàng"].includes(opt.label)
                  ? getFilterButtonColor(opt.label)
                  : "#fff",
                color: activeStatus === opt.value && ["Tất cả", "Chờ vận chuyển", "Đang vận chuyển", "Đã nhận hàng"].includes(opt.label)
                  ? "#fff"
                  : "#222",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
              onClick={() => setActiveStatus(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Khối filter tìm kiếm nâng cao */}
      <div className={styles.formBlock}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", alignItems: "center" }}>
          <input
            style={{ border: "2px solid #bbb", borderRadius: 8, padding: "10px 16px", minWidth: 180, flex: 1 }}
            placeholder="Tìm kiếm hóa đơn..."
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <input
            type="number"
            style={{ border: "2px solid #bbb", borderRadius: 8, padding: "10px", width: 70 }}
            placeholder="Từ"
            value={minAmount}
            onChange={e => setMinAmount(e.target.value)}
          />
          <input
            type="number"
            style={{ border: "2px solid #bbb", borderRadius: 8, padding: "10px", width: 100 }}
            placeholder="Đến"
            value={maxAmount}
            onChange={e => setMaxAmount(e.target.value)}
          />
          <input
            type="datetime-local"
            style={{ border: "2px solid #bbb", borderRadius: 8, padding: "10px" }}
            value={dateFrom}
            onChange={e => setDateFrom(e.target.value)}
          />
          <input
            type="datetime-local"
            style={{ border: "2px solid #bbb", borderRadius: 8, padding: "10px" }}
            value={dateTo}
            onChange={e => setDateTo(e.target.value)}
          />
          <select
            style={{ border: "2px solid #bbb", borderRadius: 8, padding: "10px 16px" }}
            value={quickDate}
            onChange={e => setQuickDate(e.target.value)}
          >
            <option value="today">Hôm nay</option>
            <option value="yesterday">Hôm qua</option>
          </select>
          <button
            style={{ padding: "10px 24px", border: "2px solid #bbb", borderRadius: 8, background: "#eee", fontWeight: 600, marginLeft: 'auto' }}
            onClick={() => {
              setSearchText("");
              setMinAmount("");
              setMaxAmount("");
              setDateFrom("");
              setDateTo("");
              setQuickDate("today");
            }}
          >
            Xóa lọc
          </button>
        </div>
      </div>

      {/* 3. Khối nội dung 2 cột */}
      <div className={styles.formBlock + " " + styles.contentRow}>
        {/* Cột trái: Bảng hóa đơn */}
        <div className={styles.leftCol}>
          <div style={{ fontWeight: 700, marginBottom: 18 }}>Bảng hóa đơn</div>
          {filteredOrders.map(order => (
            <div
              key={order.code || order.maHoaDon || order.id}
              className={styles.invoiceCard}
              style={{
                cursor: "pointer",
                background: selectedOrderCode === (order.code || order.maHoaDon || order.id) ? "#ffe9b3" : "#fafafa",
                border: `2px solid #bbb`,
                borderRadius: 24,
                marginBottom: 16,
                boxShadow: "0 4px 16px #eee",
                padding: 12,
                minWidth: 220,
                maxWidth: 320,
                transition: "box-shadow 0.2s, background 0.2s"
              }}
              onClick={() => handleSelectOrder(order.code || order.maHoaDon || order.id, order)}
            >
              <div style={{ display: "flex", alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{
                  border: "none",
                  borderRadius: 16,
                  background: getStatusColor(order.trangThai),
                  color: ["Hoàn tất", "Chờ xác nhận"].includes(order.trangThai) ? "#fff" : "#222",
                  padding: "7px 14px",
                  fontWeight: 700,
                  fontSize: 15,
                  minWidth: 70,
                  textAlign: "center",
                  boxShadow: "0 2px 8px #ddd"
                }}>
                  {order.trangThai || ""}
                </span>
                <span style={{ marginLeft: "auto", fontWeight: 600, fontSize: 15, lineHeight: 1.2 }}>Mã hóa đơn: <b style={{fontSize: 18}}>{order.code || order.maHoaDon || order.id}</b></span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 2 }}>
                <span style={{ color: "#666" }}>{order.ngayTao ? new Date(order.ngayTao).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false}) : ""}</span>
                <span style={{ color: "#222", fontWeight: 500 }}>{order.tenNhanVien || ""}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, alignItems: "center" }}>
                <span style={{ color: "#222", fontWeight: 500 }}>{order.tenKhachHang || ""}</span>
                <span style={{ fontWeight: 700, color: "#e67e22", fontSize: 16 }}>{Number(order.tongTien || 0).toLocaleString()} đ</span>
              </div>
            </div>
          ))}
        </div>
        {/* Cột phải: Chi tiết hóa đơn/chọn hóa đơn */}
        <div className={styles.rightCol}>
          {loadingDetail ? (
            <div style={{ fontSize: 20, color: '#888', marginTop: 40 }}>Đang tải chi tiết hóa đơn...</div>
          ) : selectedOrder && (selectedOrder.chiTiet || []).length > 0 ? (
            <div style={{ background: '#fff', borderRadius: 18, boxShadow: '0 2px 12px #eee', padding: 28, minWidth: 380, maxWidth: 600 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                {/* Trạng thái badge */}
                <span style={{
                  borderRadius: 12,
                  background: getStatusColor(selectedOrder.trangThai),
                  color: ["Hoàn tất", "Chờ xác nhận"].includes(selectedOrder.trangThai) ? "#fff" : "#222",
                  padding: '7px 18px',
                  fontWeight: 700,
                  fontSize: 16,
                  marginRight: 16,
                  minWidth: 90,
                  textAlign: 'center'
                }}>
                  {selectedOrder.trangThai}
                </span>
                {/* Lịch sử (placeholder) */}
                <span
                  style={{ color: '#888', fontSize: 15, marginRight: 12, cursor: 'not-allowed', opacity: 0.7 }}
                  title='Chức năng đang phát triển'
                >
                  Lịch sử <span style={{fontSize:18}}>⟳</span>
                </span>
                <span style={{ marginLeft: 'auto', fontWeight: 600, fontSize: 18 }}>
                  Hóa đơn <b>#{selectedOrder.maHoaDon}</b>
                </span>
              </div>
              <div style={{ color: '#666', fontSize: 15, marginBottom: 8 }}>Thời gian: <b>{selectedOrder.ngayTao ? new Date(selectedOrder.ngayTao).toLocaleString('vi-VN', {day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false}) : ''}</b></div>
              <div style={{ color: '#222', fontSize: 16, marginBottom: 12 }}>Khách hàng: <b>{selectedOrder.tenKhachHang || ''}</b></div>
              {/* Bảng sản phẩm */}
              <div style={{ marginBottom: 18, display: 'flex', flexDirection: 'column', gap: 16 }}>
                {(selectedOrder.chiTiet || []).map((sp: any, idx: number) => (
                  <div key={idx} style={{
                    border: '1px solid #eee',
                    borderRadius: 8,
                    padding: 16,
                    background: '#fff',
                    boxShadow: '0 1px 4px #eee',
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 24,
                    alignItems: 'flex-start',
                  }}>
                    <div style={{ minWidth: 180, flex: 2 }}>
                      <div><b>STT:</b> {idx + 1}</div>
                      <div><b>Tên sản phẩm:</b> {(sp.tenSanPham || '').replace(/\n/g, ' ')}</div>
                      <div><b>Mã:</b> {sp.maSanPham || ''}</div>
                      <div><b>Danh mục:</b> {sp.danhMuc || ''}</div>
                      <div><b>Thương hiệu:</b> {sp.thuongHieu || ''}</div>
                      <div><b>Màu sắc:</b> {sp.mauSac || ''}</div>
                      <div><b>Kích thước:</b> {sp.kichCo || ''}</div>
                    </div>
                    <div style={{ minWidth: 120, flex: 1 }}>
                      <div><b>Đơn giá:</b> {Number(sp.donGia || 0).toLocaleString()} đ</div>
                      <div><b>Số lượng:</b> {sp.soLuong}</div>
                      <div><b>Thành tiền:</b> {Number(sp.thanhTien || 0).toLocaleString()} đ</div>
                    </div>
                  </div>
                ))}
              </div>
              {/* Thông tin giao hàng & tổng tiền */}
              <div style={{ display: 'flex', gap: 32, marginBottom: 8 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ color: '#888', fontWeight: 500, marginBottom: 4 }}>Thông tin giao hàng:</div>
                  <div style={{ fontSize: 15 }}>Người nhận: <b>{selectedOrder.tenNguoiNhan || ''}</b></div>
                  <div style={{ fontSize: 15 }}>Số điện thoại: <b>{selectedOrder.soDienThoai || ''}</b></div>
                  <div style={{ fontSize: 15 }}>Địa chỉ giao hàng: <b>{selectedOrder.diaChiNhanHang || ''}</b></div>
                  {selectedOrder.ghiChu && <div style={{ fontSize: 15 }}>Ghi chú: <b>{selectedOrder.ghiChu}</b></div>}
                </div>
                <div style={{ minWidth: 160 }}>
                  <div style={{ color: '#888', fontWeight: 500, marginBottom: 4 }}>Tổng kết:</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                    <span>Tổng tiền:</span>
                    <span style={{ color: '#e67e22', fontWeight: 700 }}>{Number(selectedOrder.tongTien || 0).toLocaleString()} đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                    <span>Giảm giá:</span>
                    <span style={{ color: '#e74c3c', fontWeight: 700 }}>- {Number(selectedOrder.giamGia || 0).toLocaleString()} đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                    <span>Phí vận chuyển:</span>
                    <span style={{ color: '#2980b9', fontWeight: 700 }}>{Number(selectedOrder.phiShip || 0).toLocaleString()} đ</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, marginTop: 6, fontWeight: 700 }}>
                    <span>Tổng cộng:</span>
                    <span style={{ color: '#e67e22' }}>{Number(selectedOrder.thanhTien || selectedOrder.tongTien || 0).toLocaleString()} đ</span>
                  </div>
                </div>
              </div>
              <div style={{ color: '#888', fontSize: 14, marginTop: 10 }}>Thanh toán: <b>{Number(selectedOrder.thanhTien || selectedOrder.tongTien || 0).toLocaleString()} đ</b></div>
              {/* Nút chuyển trạng thái duy nhất và hủy hóa đơn */}
              <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
                {selectedOrder?.trangThai !== "Hoàn tất" && statusTransitions[selectedOrder?.trangThai] && (
                  <button
                    style={{
                      background: statusTransitions[selectedOrder.trangThai].color,
                      color: ["#7be495"].includes(statusTransitions[selectedOrder.trangThai].color) ? "#222" : "#fff",
                      border: 'none',
                      borderRadius: 8,
                      padding: '10px 28px',
                      fontWeight: 700,
                      fontSize: 16,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleChangeStatus(statusTransitions[selectedOrder.trangThai].next)}
                  >
                    {statusTransitions[selectedOrder.trangThai].label}
                  </button>
                )}
                <button
                  style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                  onClick={async () => {
                    if (!window.confirm('Bạn có chắc chắn muốn xóa hóa đơn này?')) return;
                    try {
                      await fetch(`http://localhost:8080/api/hoadon/${selectedOrder.idHoaDon || selectedOrder.id}`, { method: 'DELETE' });
                      alert('Đã xóa hóa đơn thành công!');
                      setSelectedOrder(null);
                      // Reload danh sách hóa đơn
                      axios.get('http://localhost:8080/api/hoadon')
                        .then(res => {
                          const ordersWithId = res.data.map((order: any) => ({ ...order, id: order.idHoaDon }));
                          setOrders(ordersWithId);
                        })
                        .catch(() => setOrders([]));
                    } catch (e) {
                      alert('Xóa hóa đơn thất bại!');
                    }
                  }}
                >
                  Hủy hóa đơn
                </button>
              </div>
            </div>
          ) : (
            <span style={{ fontSize: 28, fontWeight: 700, color: "#888" }}>Chọn hóa đơn</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default CounterInvoiceList; 