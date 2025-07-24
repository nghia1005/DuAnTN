import React, { useState, useEffect } from "react";
import axios from "axios";
import styles from "./CounterInvoiceList.module.css";
import CartList from "../pos/CartList";
import ProductSelector from "../pos/ProductSelector";
import { ProductDetail } from '../pos/types';
import { v4 as uuidv4 } from "uuid";
import MuiDateTimeInput from '../../component/MuiDateTimeInput';
import { toast } from 'react-toastify';
import Select from 'react-select';

// 1. Thêm trạng thái 'Đã hủy' vào danh sách trạng thái
const STATUS_OPTIONS = [
    { label: "Tất cả", value: "ALL", color: "#1976d2" },
    { label: "Đã xác nhận", value: "Đã xác nhận", color: "#1976d2" },
    { label: "Đang vận chuyển", value: "Đang vận chuyển", color: "#ff9800" },
    { label: "Giao hàng thành công", value: "Giao hàng thành công", color: "#4caf50" },
    { label: "Giao hàng thất bại", value: "Giao hàng thất bại", color: "#e74c3c" },
    { label: "Đã hủy", value: "Đã hủy", color: "#e74c3c" },
];

// 2. Sửa màu trạng thái
const getStatusColor = (status: string) => {
    switch (status) {
        case "Đã xác nhận": return "#1976d2"; // xanh dương
        case "Đang vận chuyển": return "#ff9800"; // cam
        case "Giao hàng thành công": return "#4caf50"; // xanh lá
        case "Giao hàng thất bại": return "#e74c3c"; // đỏ
        case "Đã hủy": return "#e74c3c"; // đỏ
        default: return "#eee";
    }
};

const getFilterButtonColor = (status: string) => {
    switch (status) {
        case "Tất cả": return "#1976d2";
        case "Đã xác nhận": return "#1976d2";
        case "Đang vận chuyển": return "#ff9800";
        case "Giao hàng thành công": return "#4caf50";
        case "Giao hàng thất bại": return "#e74c3c";
        case "Đã hủy": return "#e74c3c";
        default: return "#222";
    }
};

// 3. Sửa logic chuyển trạng thái (không cho chuyển tiếp nếu đã hủy)
const statusTransitions: Record<string, { next: string, label: string, color: string }> = {
    "Đã xác nhận": { next: "Đang vận chuyển", label: "Chuyển sang Đang vận chuyển", color: "#1976d2" },
    "Đang vận chuyển": { next: "Giao hàng thành công", label: "Giao hàng thành công", color: "#4caf50" },
    // Nếu muốn cho phép chuyển sang thất bại hoặc hủy, có thể thêm nút riêng hoặc thêm dòng dưới:
    // "Đang vận chuyển": { next: "Giao hàng thất bại", label: "Giao hàng thất bại", color: "#e74c3c" },
    // "Đang vận chuyển": { next: "Đã hủy", label: "Hủy đơn hàng", color: "#757575" },
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
    const [selectedMonth, setSelectedMonth] = useState<Date | null>(null);
    const [selectedYear, setSelectedYear] = useState<Date | null>(null);
    // XÓA: const [quickDate, setQuickDate] = useState('today');
    const [showSuccessBanner, setShowSuccessBanner] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
    const [deletingProductId, setDeletingProductId] = useState<number | null>(null);
    const [showEditAddressModal, setShowEditAddressModal] = useState(false);
    const [editAddress, setEditAddress] = useState({
      tenNguoiNhan: '',
      soDienThoai: '',
      diaChiNhanHang: ''
    });
    const [showEditAddressSuccess, setShowEditAddressSuccess] = useState(false);

    useEffect(() => {
        axios.get("http://localhost:8080/api/hoadon")
            .then(res => {
                const ordersWithId = res.data.map((order: any) => ({
                    ...order,
                    id: order.idHoaDon
                }));
                setOrders(ordersWithId);
            })
            .catch(() => setOrders([]));
    }, []);

    // Lọc hóa đơn tại cửa hàng (bỏ lọc nếu không có trường loaiDon)
    const storeOrders = orders.filter(order => !order.loaiDon || order.loaiDon === "Tại cửa hàng");
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

    // Lọc theo tháng/năm
    if (selectedMonth) filteredOrders = filteredOrders.filter(order => new Date(order.ngayTao).getMonth() === selectedMonth.getMonth());
    if (selectedYear) filteredOrders = filteredOrders.filter(order => new Date(order.ngayTao).getFullYear() === selectedYear.getFullYear());

    // Sắp xếp mới nhất
    if (sortNewest) {
        filteredOrders = filteredOrders.sort((a, b) => {
            const dateA = a.ngayTao ? new Date(a.ngayTao).getTime() : 0;
            const dateB = b.ngayTao ? new Date(b.ngayTao).getTime() : 0;
            return dateB - dateA;
        });
    }

    // Lấy danh sách sản phẩm khi mở modal
    useEffect(() => {
      if (showAddProductModal) {
        fetch('/api/chi-tiet-san-pham/hien-thi')
          .then(res => res.json())
          .then(data => setProductDetails(data))
          .catch(() => setProductDetails([]));
      }
    }, [showAddProductModal]);

    // Khi chọn hóa đơn, lấy chi tiết
    const handleSelectOrder = async (code: string, orderFromList: any) => {
        setSelectedOrderCode(code);
        setLoadingDetail(true);
        // Thêm log để debug
        console.log('===> Object hóa đơn khi click:', orderFromList);
        console.log('===> idHoaDon truyền vào fetch:', orderFromList.idHoaDon);
        let id = orderFromList.idHoaDon;
        if (!id || isNaN(Number(id))) {
            toast.error('Không tìm thấy ID số của hóa đơn!');
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
            toast.error('Không tìm thấy hóa đơn!');
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
            toast.error('Không lấy được chi tiết hóa đơn!');
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
            toast.success('Đã xác nhận đơn hàng!');
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
            toast.error('Xác nhận đơn hàng thất bại!');
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
            setShowSuccessBanner(true);
            setTimeout(() => setShowSuccessBanner(false), 2000);
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
            toast.error('Cập nhật trạng thái thất bại!');
        }
    };

    // Mapping trạng thái hiện tại sang trạng thái tiếp theo và label nút
    const statusTransitions: Record<string, { next: string, label: string, color: string }> = {
        "Đã xác nhận": { next: "Đang vận chuyển", label: "Chuyển sang Đang vận chuyển", color: "#1976d2" },
        "Đang vận chuyển": { next: "Giao hàng thành công", label: "Giao hàng thành công", color: "#4caf50" },
        // Nếu muốn cho phép chuyển sang thất bại, có thể thêm nút riêng hoặc thêm dòng dưới:
        // "Đang vận chuyển": { next: "Giao hàng thất bại", label: "Giao hàng thất bại", color: "#e74c3c" },
        // "Giao hàng thành công": { next: "", label: "", color: "#4caf50" },
        // "Giao hàng thất bại": { next: "", label: "", color: "#e74c3c" },
    };

    return (
        <>
        <div style={{ background: "#fffbe6", minHeight: "100vh", padding: 32 }}>
            {showSuccessBanner && (
              <div style={{
                position: 'fixed',
                top: 32,
                right: 32,
                left: 'auto',
                transform: 'none',
                background: '#2ecc40',
                color: '#fff',
                fontWeight: 700,
                fontSize: 16,
                padding: '10px 24px',
                borderRadius: 8,
                zIndex: 9999,
                boxShadow: '0 4px 16px #b2f7c1',
                minWidth: 220,
                textAlign: 'center',
                maxWidth: 320
              }}>
                Đổi trạng thái thành công!
              </div>
            )}
                {showEditAddressSuccess && (
                  <div style={{
                    position: 'fixed',
                    top: 80,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: '#1976d2',
                    color: '#fff',
                    fontWeight: 700,
                    fontSize: 16,
                    padding: '10px 28px',
                    borderRadius: 8,
                    zIndex: 9999,
                    boxShadow: '0 4px 16px #b2f7c1',
                    minWidth: 220,
                    textAlign: 'center',
                    maxWidth: 320
                  }}>
                    Đã cập nhật địa chỉ giao hàng!
                  </div>
                )}
                {showEditAddressModal && (
                  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 340, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', position: 'relative' }}>
                      <h3 style={{ margin: 0, marginBottom: 16 }}>Sửa địa chỉ giao hàng</h3>
                      <div style={{ marginBottom: 12 }}>
                        <div style={{ marginBottom: 8 }}>
                          <label>Người nhận:</label>
                          <input type="text" value={editAddress.tenNguoiNhan} onChange={e => setEditAddress(a => ({ ...a, tenNguoiNhan: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label>Số điện thoại:</label>
                          <input type="text" value={editAddress.soDienThoai} onChange={e => setEditAddress(a => ({ ...a, soDienThoai: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                        </div>
                        <div style={{ marginBottom: 8 }}>
                          <label>Địa chỉ giao hàng:</label>
                          <input type="text" value={editAddress.diaChiNhanHang} onChange={e => setEditAddress(a => ({ ...a, diaChiNhanHang: e.target.value }))} style={{ width: '100%', padding: 8, borderRadius: 4, border: '1px solid #ccc' }} />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                        <button onClick={() => setShowEditAddressModal(false)} style={{ background: '#bbb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Hủy</button>
                        <button
                          onClick={async () => {
                            // Validate
                            if (!editAddress.tenNguoiNhan.trim()) {
                              toast.error('Vui lòng nhập tên người nhận!');
                              return;
                            }
                            if (!editAddress.soDienThoai.trim() || !/^[0-9]{10,11}$/.test(editAddress.soDienThoai)) {
                              toast.error('Số điện thoại phải có 10-11 chữ số!');
                              return;
                            }
                            if (!editAddress.diaChiNhanHang.trim()) {
                              toast.error('Vui lòng nhập địa chỉ giao hàng!');
                              return;
                            }
                            try {
                              const dataToSend = {
                                ...selectedOrder,
                                tenNguoiNhan: editAddress.tenNguoiNhan,
                                soDienThoai: editAddress.soDienThoai,
                                diaChiNhanHang: editAddress.diaChiNhanHang
                              };
                              console.log('PUT /api/hoadon/', selectedOrder.idHoaDon, dataToSend);
                              await fetch(`http://localhost:8080/api/hoadon/${selectedOrder.idHoaDon}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify(dataToSend)
                              });
                              // Reload lại chi tiết hóa đơn
                              const resOrder = await fetch(`http://localhost:8080/api/hoadon/${selectedOrder.idHoaDon}`);
                              const orderData = await resOrder.json();
                              const resDetails = await fetch(`http://localhost:8080/api/hoadonchitiet?idHoaDon=${selectedOrder.idHoaDon}`);
                              const chiTietList = await resDetails.json();
                              setSelectedOrder({ ...orderData, chiTiet: chiTietList });
                              toast.success('Đã cập nhật địa chỉ giao hàng!');
                              setShowEditAddressSuccess(true);
                              setTimeout(() => setShowEditAddressSuccess(false), 2000);
                            } catch (e) {
                              toast.error('Cập nhật địa chỉ thất bại!');
                            }
                            setShowEditAddressModal(false);
                          }}
                          style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                        >Lưu</button>
                      </div>
                    </div>
                  </div>
                )}
            {/* Gộp tất cả bộ lọc vào 1 box, sắp xếp lại theo yêu cầu */}
            <div className={styles.filterBox}>
                <input
                    type="text"
                    placeholder="Tìm kiếm hóa đơn..."
                    value={searchText}
                    onChange={e => setSearchText(e.target.value)}
                    style={{ minWidth: 180 }}
                />
                <label style={{ fontWeight: 500, marginLeft: 8 }}>Từ</label>
                <div style={{ display: 'inline-block', minWidth: 170 }}>
                  <MuiDateTimeInput
                    value={dateFrom ? new Date(dateFrom) : null}
                    onChange={date => setDateFrom(date ? date.toISOString() : '')}
                    maxDateTime={dateTo ? new Date(dateTo) : undefined}
                  />
                </div>
                <label style={{ fontWeight: 500, marginLeft: 8 }}>Đến</label>
                <div style={{ display: 'inline-block', minWidth: 170 }}>
                  <MuiDateTimeInput
                    value={dateTo ? new Date(dateTo) : null}
                    onChange={date => setDateTo(date ? date.toISOString() : '')}
                    minDateTime={dateFrom ? new Date(dateFrom) : undefined}
                  />
                </div>
                    {/* Lọc trạng thái */}
                    <div style={{ minWidth: 200 }}>
                      <label style={{ fontWeight: 500, marginRight: 8 }}>Lọc trạng thái</label>
                      <Select
                        options={STATUS_OPTIONS}
                        value={STATUS_OPTIONS.find(opt => opt.value === activeStatus)}
                        onChange={(opt: any) => opt && setActiveStatus(opt.value)}
                        formatOptionLabel={opt => (
                          <span style={{ color: opt.color, fontWeight: 600 }}>{opt.label}</span>
                        )}
                        getOptionValue={opt => opt.value}
                        styles={{
                          control: (base) => ({ ...base, minWidth: 160 }),
                          option: (base, state) => ({
                            ...base,
                            color: state.data.color,
                            fontWeight: 600,
                            backgroundColor: state.isSelected ? '#f5f5f5' : '#fff',
                          }),
                          singleValue: (base, state) => ({
                            ...base,
                            color: state.data.color,
                            fontWeight: 700,
                          })
                        }}
                        menuPlacement="auto"
                        menuPosition="fixed"
                        isSearchable={false}
                      />
                    </div>
                <button
                    onClick={() => {
                        setSearchText("");
                        setMinAmount("");
                        setMaxAmount("");
                        setDateFrom("");
                        setDateTo("");
                        setSelectedMonth(null);
                        setSelectedYear(null);
                    }}
                    style={{ marginLeft: 8, padding: '8px 18px', borderRadius: 8, border: '1px solid #bbb', background: '#fff' }}
                >
                    Xóa lọc
                </button>
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
                                        color: ["Giao hàng thành công", "Đã xác nhận"].includes(order.trangThai) ? "#fff" : "#222",
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
                                <span style={{ fontWeight: 700, color: "#e67e22", fontSize: 16 }}>{Number(order.thanhTien || order.tongTien || 0).toLocaleString()} đ</span>
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
                                        color: ["Giao hàng thành công", "Đã xác nhận"].includes(selectedOrder.trangThai) ? "#fff" : "#222",
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
                                <div style={{ marginBottom: 8 }}>
  <b>Khách hàng:</b> {selectedOrder?.tenKhachHang || '---'}
</div>
                                {/* Tiêu đề và nút mua thêm */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                  <h4 style={{ margin: 0 }}>Chi tiết sản phẩm</h4>
                                  {selectedOrder?.trangThai === 'Đã xác nhận' && (
                                    <button
                                      style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
                                      onClick={() => setShowAddProductModal(true)}
                                    >
                                      + Mua thêm
                                    </button>
                                  )}
                                </div>
                            {/* Bảng sản phẩm */}
                                <div style={{ marginBottom: 18 }}>
  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
    <thead>
      <tr>
        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>STT</th>
        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>TÊN HÀNG</th>
        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>Số lượng</th>
        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>Đơn giá</th>
        <th style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5' }}>Thành tiền</th>
        {selectedOrder?.trangThai === 'Đã xác nhận' && (
          <th style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', background: '#f5f5f5', textAlign: 'center' }}>Thao tác</th>
        )}
      </tr>
    </thead>
    <tbody>
                                {(selectedOrder.chiTiet || []).map((sp: any, idx: number) => (
        <tr key={idx}>
          <td style={{ textAlign: 'center', fontWeight: 500, padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>{idx + 1}</td>
          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>
            <b>{sp.tenSanPham}</b>
            <div style={{ color: '#555', fontSize: 14 }}>
              {sp.danhMuc}, {sp.thuongHieu}, Màu {sp.mauSac}, Kích cỡ {sp.kichCo}
                                        </div>
          </td>
          <td style={{ textAlign: 'center', padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>{sp.soLuong}</td>
          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>{Number(sp.donGia || 0).toLocaleString()} đ</td>
          <td style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0' }}>{Number(sp.thanhTien || 0).toLocaleString()} đ</td>
          {/* Nút Xóa */}
          {selectedOrder?.trangThai === 'Đã xác nhận' && (
            <td style={{ padding: '8px 12px', borderBottom: '1px solid #e0e0e0', textAlign: 'center' }}>
              <button
                style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                title="Xóa sản phẩm khỏi hóa đơn"
                onClick={() => { console.log('Click xóa:', sp.idHoaDonChiTiet); setDeletingProductId(sp.idHoaDonChiTiet); }}
              >🗑️</button>
            </td>
          )}
        </tr>
      ))}
    </tbody>
  </table>
                            </div>
                            {/* Thông tin giao hàng & tổng tiền */}
                            <div style={{ display: 'flex', gap: 32, marginBottom: 8 }}>
                                <div style={{ flex: 1 }}>
                                        <div style={{ color: '#888', fontWeight: 500, marginBottom: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                            Thông tin giao hàng:
                                            {selectedOrder?.trangThai === 'Đã xác nhận' && (
                                              <button
                                                style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 16px', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}
                                                onClick={() => {
                                                  setEditAddress({
                                                    tenNguoiNhan: selectedOrder.tenNguoiNhan || '',
                                                    soDienThoai: selectedOrder.soDienThoai || '',
                                                    diaChiNhanHang: selectedOrder.diaChiNhanHang || ''
                                                  });
                                                  setShowEditAddressModal(true);
                                                }}
                                              >Sửa địa chỉ</button>
                                            )}
                                        </div>
                                    <div style={{ fontSize: 15 }}>Người nhận: <b>{selectedOrder.tenNguoiNhan || ''}</b></div>
                                    <div style={{ fontSize: 15 }}>Số điện thoại: <b>{selectedOrder.soDienThoai || ''}</b></div>
                                    <div style={{ fontSize: 15 }}>Địa chỉ giao hàng: <b>{selectedOrder.diaChiNhanHang || ''}</b></div>
                                    {selectedOrder.ghiChu && <div style={{ fontSize: 15 }}>Ghi chú: <b>{selectedOrder.ghiChu}</b></div>}
                                </div>
                                <div style={{ minWidth: 160 }}>
                                    <div style={{ color: '#888', fontWeight: 500, marginBottom: 4 }}>Tổng kết:</div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                                            <span><b>Tổng tiền:</b></span>
                                            <span style={{ color: '#e67e22', fontWeight: 700 }}><b>{Number(selectedOrder.tongTien || 0).toLocaleString()} đ</b></span>
                                    </div>
                                    {Number(selectedOrder.giamGia || 0) > 0 && (
                                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                                            <span><b>Giảm giá:</b></span>
                                            <span style={{ color: '#e74c3c', fontWeight: 700 }}><b>- {Number(selectedOrder.giamGia || 0).toLocaleString()} đ</b></span>
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                                            <span><b>Phí vận chuyển:</b></span>
                                            <span style={{ color: '#2980b9', fontWeight: 700 }}><b>{Number(selectedOrder.phiShip || 0).toLocaleString()} đ</b></span>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 17, marginTop: 6, fontWeight: 700 }}>
                                            <span><b>Tổng cộng:</b></span>
                                            <span style={{ color: '#e67e22' }}><b>{Number(selectedOrder.thanhTien || selectedOrder.tongTien || 0).toLocaleString()} đ</b></span>
                                        </div>
                                    </div>
                                </div>
                                <div style={{ color: '#222', fontSize: 16, marginTop: 10, fontWeight: 700 }}>
  Thanh toán: {Number(selectedOrder.thanhTien || selectedOrder.tongTien || 0).toLocaleString()} đ
                            </div>
                                {/* Nút chuyển trạng thái duy nhất */}
                            <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
  {selectedOrder?.trangThai === 'Đang vận chuyển' ? (
    <>
      <button
        style={{
          background: '#4caf50', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer'
        }}
        onClick={() => handleChangeStatus('Giao hàng thành công')}
      >Giao hàng thành công</button>
      <button
        style={{
          background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer'
        }}
        onClick={() => handleChangeStatus('Giao hàng thất bại')}
      >Giao hàng thất bại</button>
    </>
  ) : (
    selectedOrder?.trangThai !== "Giao hàng thành công" && statusTransitions[selectedOrder?.trangThai] && (
      <button
        style={{
          background: statusTransitions[selectedOrder.trangThai].color,
          color: ["#4caf50"].includes(statusTransitions[selectedOrder.trangThai].color) ? "#222" : "#fff",
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
    )
  )}
  {/* Nút chuyển sang Đã hủy chỉ khi trạng thái là Đã xác nhận */}
  {selectedOrder?.trangThai === 'Đã xác nhận' && (
    <button
      style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px', fontWeight: 700, fontSize: 16, cursor: 'pointer' }}
      onClick={() => handleChangeStatus('Đã hủy')}
    >
      Chuyển sang Đã hủy
    </button>
  )}
</div>
                                {/* Modal chọn sản phẩm */}
                                {showAddProductModal && (
                                  <ProductSelector
                                    products={productDetails}
                                    onSelectAction={async (product, qty) => {
                                      if (!selectedOrder) return;
                                      try {
                                        const res = await fetch('http://localhost:8080/api/hoadonchitiet', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({
                                            idHoaDon: selectedOrder.idHoaDon,
                                            idChiTietSanPham: product.idChiTietSanPham,
                                            soLuong: qty
                                          })
                                        });
                                        const resJson = await res.json().catch(() => ({}));
                                        console.log('DEBUG: Response thêm sản phẩm vào hóa đơn:', res.status, resJson);
                                        if (!res.ok) {
                                          toast.error('Không thể thêm sản phẩm vào hóa đơn!');
                                          setShowAddProductModal(false);
                                          return;
                                        }
                                        // Sau khi thêm, reload lại chi tiết hóa đơn
                                        const resOrder = await fetch(`http://localhost:8080/api/hoadon/${selectedOrder.idHoaDon}`);
                                        const orderData = await resOrder.json();
                                        const resDetails = await fetch(`http://localhost:8080/api/hoadonchitiet?idHoaDon=${selectedOrder.idHoaDon}`);
                                        const chiTietList = await resDetails.json();
                                        setSelectedOrder({ ...orderData, chiTiet: chiTietList });
                                      } catch (e) {
                                        toast.error('Không thể thêm sản phẩm vào hóa đơn!');
                                      }
                                      setShowAddProductModal(false);
                                    }}
                                    onCloseAction={() => setShowAddProductModal(false)}
                                  />
                                )}
                        </div>
                    ) : (
                        <span style={{ fontSize: 28, fontWeight: 700, color: "#888" }}>Chọn hóa đơn</span>
                    )}
                </div>
            </div>
        </div>
            {deletingProductId !== null && (
              <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.3)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ background: '#fff', borderRadius: 8, padding: 32, minWidth: 320, boxShadow: '0 4px 24px rgba(0,0,0,0.2)', position: 'relative' }}>
                  <h3 style={{ margin: 0, marginBottom: 16 }}>Xác nhận xóa sản phẩm khỏi hóa đơn?</h3>
                  <div style={{ marginBottom: 24 }}>Bạn có chắc chắn muốn xóa sản phẩm này khỏi hóa đơn không?</div>
                  <div style={{ display: 'flex', gap: 16, justifyContent: 'flex-end' }}>
                    <button onClick={() => setDeletingProductId(null)} style={{ background: '#bbb', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Hủy</button>
                    <button
                      onClick={async () => {
                        try {
                          await fetch(`http://localhost:8080/api/hoadonchitiet/${deletingProductId}`, { method: 'DELETE' });
                          if (selectedOrder) {
                            const resOrder = await fetch(`http://localhost:8080/api/hoadon/${selectedOrder.idHoaDon}`);
                            const orderData = await resOrder.json();
                            const resDetails = await fetch(`http://localhost:8080/api/hoadonchitiet?idHoaDon=${selectedOrder.idHoaDon}`);
                            const chiTietList = await resDetails.json();
                            setSelectedOrder({ ...orderData, chiTiet: chiTietList });
                          }
                          toast.success('Đã xóa sản phẩm khỏi hóa đơn!');
                        } catch (e) {
                          toast.error('Xóa sản phẩm thất bại!');
                        }
                        setDeletingProductId(null);
                      }}
                      style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '8px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}
                    >Xóa</button>
                  </div>
                </div>
              </div>
            )}
        </>
    );
};

export default CounterInvoiceList;