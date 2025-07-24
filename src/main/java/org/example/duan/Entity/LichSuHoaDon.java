package org.example.duan.Entity;

import jakarta.persistence.*;
import java.util.Date;

@Entity
public class LichSuHoaDon {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idLichSuHoaDon;

    private Long idHoaDon;
    private String trangThaiCu;
    private String trangThaiMoi;
    @Temporal(TemporalType.TIMESTAMP)
    private Date ngayTao;

    // Getters and Setters
    public Long getIdLichSuHoaDon() { return idLichSuHoaDon; }
    public void setIdLichSuHoaDon(Long idLichSuHoaDon) { this.idLichSuHoaDon = idLichSuHoaDon; }
    public Long getIdHoaDon() { return idHoaDon; }
    public void setIdHoaDon(Long idHoaDon) { this.idHoaDon = idHoaDon; }
    public String getTrangThaiCu() { return trangThaiCu; }
    public void setTrangThaiCu(String trangThaiCu) { this.trangThaiCu = trangThaiCu; }
    public String getTrangThaiMoi() { return trangThaiMoi; }
    public void setTrangThaiMoi(String trangThaiMoi) { this.trangThaiMoi = trangThaiMoi; }
    public Date getNgayTao() { return ngayTao; }
    public void setNgayTao(Date ngayTao) { this.ngayTao = ngayTao; }
} 