import React from "react";

interface InvoicePreviewProps {
  order: any;
  maHoaDon: string;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({ order, maHoaDon }) => {
  if (!order) return null;
  const tongTien = order.chiTiet?.reduce((sum: number, item: any) => sum + (item.gia || item.donGia) * (item.qty || item.soLuong), 0) || 0;
  const giamGia = order.appliedVoucher?.giaTriToiDa || 0;
  const phiVanChuyen = order.shippingFee || 0;
  const thanhToan = tongTien - giamGia + phiVanChuyen;
  return (
    <div
      style={{
        width: 800,
        background: "#fff",
        color: "#222",
        fontFamily: "Arial, sans-serif",
        fontSize: 14,
        padding: 32,
        lineHeight: 1.6,
        margin: '0 auto',
        boxSizing: "border-box"
      }}
    >
      {/* Tiêu đề và thông tin cửa hàng */}
      <div style={{ textAlign: "center", marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 24, marginBottom: 2 }}>SoleKing Store</div>
        <div style={{ fontSize: 13 }}>
          Số điện thoại: 0123456789 | Email: info@soleking.vn | Website: www.soleking.vn
        </div>
        <div style={{ fontSize: 13, marginBottom: 8 }}>
          Địa chỉ: 123 Đường ABC, Quận Hoàn Kiếm, Hà Nội
        </div>
      </div>
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 22, margin: "12px 0 16px 0", letterSpacing: 1 }}>
        HÓA ĐƠN #{maHoaDon || "---"}
      </div>
      {/* Hai cột thông tin nhân viên/khách hàng */}
      <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', fontSize: 13, marginBottom: 8, gap: 40 }}>
        <div style={{ minWidth: 220, flex: 1, textAlign: 'left' }}>
          <div>ID Nhân viên: {order.idNhanVien || ""}</div>
          <div>Nhân viên: {order.tenNhanVien || ""}</div>
          <div>Ngày mua: {order.ngayTao ? new Date(order.ngayTao).toLocaleString('vi-VN') : ""}</div>
          <div>Nơi mua: {order.loaiDon || "Tại cửa hàng"}</div>
        </div>
        <div style={{ minWidth: 220, flex: 1, textAlign: 'left', wordBreak: 'break-word' }}>
          <div>ID Khách hàng: {order.idKhachHang || ""}</div>
          <div>Khách hàng: {order.tenKhachHang || ""}</div>
          <div>Số điện thoại: {order.soDienThoaiKhachHang || ""}</div>
        </div>
      </div>
      {/* Danh sách sản phẩm dạng card/list */}
      <div style={{ margin: '24px 0 16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {order.chiTiet?.map((item: any, idx: number) => (
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
              <div><b>Tên sản phẩm:</b> {item.tenSanPham}</div>
              <div><b>Mã:</b> {item.maSanPham}</div>
              <div><b>Danh mục:</b> {item.tenDanhMuc}</div>
              <div><b>Thương hiệu:</b> {item.tenThuongHieu}</div>
              <div><b>Màu sắc:</b> {item.tenMauSac}</div>
              <div><b>Kích thước:</b> {item.tenKichCo}</div>
            </div>
            <div style={{ minWidth: 120, flex: 1 }}>
              <div><b>Đơn giá:</b> {(item.gia || item.donGia)?.toLocaleString()}đ</div>
              <div><b>Số lượng:</b> {item.qty || item.soLuong}</div>
              <div><b>Thành tiền:</b> {((item.gia || item.donGia) * (item.qty || item.soLuong))?.toLocaleString()}đ</div>
            </div>
          </div>
        ))}
        {(!order.chiTiet || order.chiTiet.length === 0) && (
          <div style={{ textAlign: 'center', color: '#aaa', fontSize: 18 }}>
            Không có sản phẩm nào trong hóa đơn.
          </div>
        )}
      </div>

      {/* Thông tin người nhận, địa chỉ, ghi chú */}
      <div style={{ fontSize: 14, margin: '12px 0 8px 0' }}>
        <div>Người nhận: {order.shippingInfo?.name || order.tenKhachHang || ""}</div>
        <div>Số điện thoại: {order.shippingInfo?.phone || order.soDienThoaiKhachHang || ""}</div>
        <div>Địa chỉ: {order.shippingInfo?.address || ""}</div>
        <div>Ghi chú hóa đơn: {order.shippingInfo?.note || "N/A"}</div>
      </div>
      {/* Đường kẻ phân cách */}
      <hr style={{ border: 'none', borderTop: '2px solid #222', margin: '12px 0 8px 0' }} />
      {/* Thông tin QR nếu có */}
      {order.selectedQR && (
        <div style={{ background: '#e3f2fd', borderRadius: 10, padding: 12, margin: '16px 0', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
          <div>
            <img src={order.selectedQR.qrImage} alt={order.selectedQR.name} style={{ width: 120, borderRadius: 4, background: '#fff' }} />
          </div>
          <div style={{ fontSize: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>
              Đã chọn QR: {order.selectedQR.bank} - {order.selectedQR.name} ({order.selectedQR.bank})
            </div>
            <div>STK: <b>{order.selectedQR.account}</b> ({order.selectedQR.bank})</div>
            <div>Số tiền: <b>{(tongTien - giamGia + phiVanChuyen).toLocaleString()}đ</b></div>
            <div>Nội dung: Chuyển tiền thanh toán QR CODE</div>
          </div>
        </div>
      )}
      {/* Tổng tiền, giảm giá, phí vận chuyển, thanh toán */}
      <div style={{ fontSize: 15, textAlign: "center", fontWeight: 700, marginTop: 8 }}>
        <div>Tổng tiền: {tongTien.toLocaleString()} VND</div>
        <div>Giảm giá: -{giamGia.toLocaleString()} VND</div>
        <div>Phí vận chuyển: {phiVanChuyen.toLocaleString()} VND</div>
        <div>Thanh toán: {(order.thanhTien !== undefined ? order.thanhTien : thanhToan).toLocaleString()} VND</div>
      </div>
    </div>
  );
};

export default InvoicePreview; 