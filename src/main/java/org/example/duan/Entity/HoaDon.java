package org.example.duan.Entity;


import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import jakarta.persistence.Column;

import java.math.BigDecimal;
import java.util.Date;
@Setter
@Getter
@NoArgsConstructor
@AllArgsConstructor
@Entity

public class HoaDon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idHoaDon;

    private Long idKhachHang;
    private Long idNhanVien;
    private Long idPhieuGiamGia;
    @Column(name = "maHoaDon", nullable = false, unique = true)
    private String maHoaDon;
    private String loaiDon;
    private BigDecimal tongTien;
    private BigDecimal giamGia;
    private BigDecimal thanhTien;
    private BigDecimal phiShip;
    private String tenNguoiNhan;
    private String soDienThoai;
    private String email;
    private String diaChiNhanHang;
    @Temporal(TemporalType.DATE)
    private Date ngayGiaoHang;
    private String ghiChu;
    private String trangThai;
    @Temporal(TemporalType.TIMESTAMP)
    private Date ngayTao;

    // Getters and Setters
    public Long getIdHoaDon() { return idHoaDon; }
    public void setIdHoaDon(Long idHoaDon) { this.idHoaDon = idHoaDon; }
    public Long getIdKhachHang() { return idKhachHang; }
    public void setIdKhachHang(Long idKhachHang) { this.idKhachHang = idKhachHang; }
    public Long getIdNhanVien() { return idNhanVien; }
    public void setIdNhanVien(Long idNhanVien) { this.idNhanVien = idNhanVien; }
    public Long getIdPhieuGiamGia() { return idPhieuGiamGia; }
    public void setIdPhieuGiamGia(Long idPhieuGiamGia) { this.idPhieuGiamGia = idPhieuGiamGia; }
    public String getMaHoaDon() { return maHoaDon; }
    public void setMaHoaDon(String maHoaDon) { this.maHoaDon = maHoaDon; }
    public String getLoaiDon() { return loaiDon; }
    public void setLoaiDon(String loaiDon) { this.loaiDon = loaiDon; }
    public BigDecimal getTongTien() { return tongTien; }
    public void setTongTien(BigDecimal tongTien) { this.tongTien = tongTien; }
    public BigDecimal getGiamGia() { return giamGia; }
    public void setGiamGia(BigDecimal giamGia) { this.giamGia = giamGia; }
    public BigDecimal getThanhTien() { return thanhTien; }
    public void setThanhTien(BigDecimal thanhTien) { this.thanhTien = thanhTien; }
    public BigDecimal getPhiShip() { return phiShip; }
    public void setPhiShip(BigDecimal phiShip) { this.phiShip = phiShip; }
    public String getTenNguoiNhan() { return tenNguoiNhan; }
    public void setTenNguoiNhan(String tenNguoiNhan) { this.tenNguoiNhan = tenNguoiNhan; }
    public String getSoDienThoai() { return soDienThoai; }
    public void setSoDienThoai(String soDienThoai) { this.soDienThoai = soDienThoai; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
    public String getDiaChiNhanHang() { return diaChiNhanHang; }
    public void setDiaChiNhanHang(String diaChiNhanHang) { this.diaChiNhanHang = diaChiNhanHang; }
    public Date getNgayGiaoHang() { return ngayGiaoHang; }
    public void setNgayGiaoHang(Date ngayGiaoHang) { this.ngayGiaoHang = ngayGiaoHang; }
    public String getGhiChu() { return ghiChu; }
    public void setGhiChu(String ghiChu) { this.ghiChu = ghiChu; }
    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
    public Date getNgayTao() { return ngayTao; }
    public void setNgayTao(Date ngayTao) { this.ngayTao = ngayTao; }
} 