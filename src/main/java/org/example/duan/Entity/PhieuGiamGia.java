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
public class PhieuGiamGia {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idPhieuGiamGia")
    private Long idPhieuGiamGia;

    @Column(name = "maPhieuGiamGia")
    private String maPhieuGiamGia;
    @Column(name = "tenPhieuGiamGia")
    private String tenPhieuGiamGia;
    @Column(name = "kieuGiamGia")
    private String kieuGiamGia;
    @Column(name = "giaTriToiThieu")
    private BigDecimal giaTriToiThieu;
    @Column(name = "giaTriToiDa")
    private BigDecimal giaTriToiDa;
    @Column(name = "soLuong")
    private Integer soLuong;
    @Temporal(TemporalType.DATE)
    @Column(name = "ngayBatDau")
    private Date ngayBatDau;
    @Temporal(TemporalType.DATE)
    @Column(name = "ngayKetThuc")
    private Date ngayKetThuc;
    @Column(name = "moTa")
    private String moTa;
    @Column(name = "trangThai")
    private String trangThai;
    @Column(name = "phanTramGiamGia")
    private BigDecimal phanTramGiamGia;
} 