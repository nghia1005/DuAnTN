package org.example.duan.Entity;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Temporal;
import jakarta.persistence.TemporalType;


import java.math.BigDecimal;
import java.util.Date;

@Entity
public class HoaDonChiTiet {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idHoaDonChiTiet;

    private Long idHoaDon;
    private Long idChiTietSanPham;
    private Integer soLuong;
    private BigDecimal donGia;
    private BigDecimal thanhTien;
    private String trangThai;
    @Temporal(TemporalType.DATE)
    private Date ngayTao;

    // Getters and Setters
    public Long getIdHoaDonChiTiet() { return idHoaDonChiTiet; }
    public void setIdHoaDonChiTiet(Long idHoaDonChiTiet) { this.idHoaDonChiTiet = idHoaDonChiTiet; }
    public Long getIdHoaDon() { return idHoaDon; }
    public void setIdHoaDon(Long idHoaDon) { this.idHoaDon = idHoaDon; }
    public Long getIdChiTietSanPham() { return idChiTietSanPham; }
    public void setIdChiTietSanPham(Long idChiTietSanPham) { this.idChiTietSanPham = idChiTietSanPham; }
    public Integer getSoLuong() { return soLuong; }
    public void setSoLuong(Integer soLuong) { this.soLuong = soLuong; }
    public BigDecimal getDonGia() { return donGia; }
    public void setDonGia(BigDecimal donGia) { this.donGia = donGia; }
    public BigDecimal getThanhTien() { return thanhTien; }
    public void setThanhTien(BigDecimal thanhTien) { this.thanhTien = thanhTien; }
    public String getTrangThai() { return trangThai; }
    public void setTrangThai(String trangThai) { this.trangThai = trangThai; }
    public Date getNgayTao() { return ngayTao; }
    public void setNgayTao(Date ngayTao) { this.ngayTao = ngayTao; }
} 