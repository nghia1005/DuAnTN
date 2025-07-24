package org.example.duan.DTO;

import java.math.BigDecimal;
import java.util.List;

public class HoaDonRequest {
    public Integer idKhachHang;
    public Integer idNhanVien;
    public Integer idPhieuGiamGia;
    public String loaiDon;
    public BigDecimal tongTien;
    public BigDecimal thanhTien;
    public BigDecimal phiShip;
    public String tenNguoiNhan;
    public String soDienThoai;
    public String email;
    public String diaChiNhanHang;
    public String ghiChu;
    public String trangThai;
    public List<ChiTiet> chiTiet;
    public ThanhToan thanhToan;

    public static class ChiTiet {
        public Integer idChiTietSanPham;
        public Integer soLuong;
        public BigDecimal donGia;
        public BigDecimal thanhTien;
    }
    public static class ThanhToan {
        public BigDecimal soTienThanhToan;
        public String phuongThucThanhToan;
        public String ghiChu;
        public String trangThai;
    }
} 