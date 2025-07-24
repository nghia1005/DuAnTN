package org.example.duan.Service;

import org.example.duan.DTO.HoaDonDTO;
import org.example.duan.DTO.HoaDonChiTietDTO;
import org.example.duan.DTO.HoaDonRequest;
import org.example.duan.Entity.HoaDon;
import org.example.duan.Entity.HoaDonChiTiet;
import org.example.duan.Entity.ThanhToanHoaDon;
import org.example.duan.Entity.PhieuGiamGia;
import org.example.duan.Repository.HoaDonRepository;
import org.example.duan.Repository.HoaDonChiTietRepository;
import org.example.duan.Repository.ThanhToanHoaDonRepository;
import org.example.duan.Repository.ChiTietSanPhamRepository;
import org.example.duan.Repository.NhanVienRepository;
import org.example.duan.Repository.KhachHangRepository;
import org.example.duan.Repository.PhieuGiamGiaRepository;
import org.example.duan.Service.EmailThanhToan;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;

@Service
public class HoaDonService {
    @Autowired
    private HoaDonRepository hoaDonRepo;
    @Autowired
    private HoaDonChiTietRepository chiTietRepo;
    @Autowired
    private ThanhToanHoaDonRepository thanhToanRepo;
    @Autowired
    private ChiTietSanPhamRepository chiTietSanPhamRepo;
    @Autowired
    private NhanVienRepository nhanVienRepo;
    @Autowired
    private KhachHangRepository khachHangRepo;
    @Autowired
    private PhieuGiamGiaRepository phieuGiamGiaRepository;
    @Autowired
    private EmailThanhToan emailThanhToan;

    @Transactional
    public HoaDonDTO taoHoaDon(HoaDonDTO dto) {
        // ... code như đã hướng dẫn ở trên ...
        return dto;
    }

    @Transactional
    public HoaDon taoHoaDonFull(HoaDonRequest req) {
        // 1. Lưu hóa đơn
        HoaDon hd = new HoaDon();
        hd.setIdKhachHang(req.idKhachHang != null ? req.idKhachHang.longValue() : null);
        hd.setIdNhanVien(req.idNhanVien != null ? req.idNhanVien.longValue() : null);
        hd.setIdPhieuGiamGia(req.idPhieuGiamGia != null ? req.idPhieuGiamGia.longValue() : null);
        hd.setLoaiDon(req.loaiDon);
        hd.setTongTien(req.tongTien);
        hd.setPhiShip(req.phiShip);
        hd.setTenNguoiNhan(req.tenNguoiNhan);
        hd.setSoDienThoai(req.soDienThoai);
        hd.setEmail(req.email);
        hd.setDiaChiNhanHang(req.diaChiNhanHang);
        hd.setGhiChu(req.ghiChu);
        hd.setTrangThai(req.trangThai);
        hd.setNgayTao(new java.util.Date());
        // Tính giảm giá từ voucher nếu có
        java.math.BigDecimal giamGia = java.math.BigDecimal.ZERO;
        if (req.idPhieuGiamGia != null) {
            PhieuGiamGia voucher = phieuGiamGiaRepository.findById(req.idPhieuGiamGia.longValue()).orElse(null);
            if (voucher != null) {
                // Kiểu giảm giá: "PERCENT" hoặc "FIXED"
                if ("PERCENT".equalsIgnoreCase(voucher.getKieuGiamGia())) {
                    giamGia = req.tongTien.multiply(voucher.getPhanTramGiamGia()).divide(java.math.BigDecimal.valueOf(100));
                    // Giới hạn tối đa nếu vượt quá giá trị tối đa
                    if (voucher.getGiaTriToiDa() != null && giamGia.compareTo(voucher.getGiaTriToiDa()) > 0) {
                        giamGia = voucher.getGiaTriToiDa();
                    }
                } else if ("FIXED".equalsIgnoreCase(voucher.getKieuGiamGia())) {
                    giamGia = voucher.getGiaTriToiDa(); // hoặc voucher.getGiaTriCoDinh() nếu có
                }
            }
        }
        hd.setGiamGia(giamGia);
        // Tính thành tiền: tổng tiền - giảm giá + phí ship
        java.math.BigDecimal thanhTien = req.tongTien.subtract(giamGia);
        if (req.phiShip != null) {
            thanhTien = thanhTien.add(req.phiShip);
        }
        hd.setThanhTien(thanhTien);
        // Sinh mã hóa đơn nếu chưa có
        String maHoaDon = "HD" + System.currentTimeMillis();
        hd.setMaHoaDon(maHoaDon);
        hoaDonRepo.save(hd);

        // 2. Lưu chi tiết hóa đơn
        if (req.chiTiet != null) {
            for (HoaDonRequest.ChiTiet ct : req.chiTiet) {
                HoaDonChiTiet ctd = new HoaDonChiTiet();
                ctd.setIdHoaDon(hd.getIdHoaDon());
                ctd.setIdChiTietSanPham(ct.idChiTietSanPham != null ? ct.idChiTietSanPham.longValue() : null);
                ctd.setSoLuong(ct.soLuong);
                ctd.setDonGia(ct.donGia);
                ctd.setThanhTien(ct.thanhTien);
                ctd.setTrangThai("Chờ xử lý");
                chiTietRepo.save(ctd);
                // Trừ tồn kho sản phẩm
                if (ct.idChiTietSanPham != null) {
                    var chiTietSanPhamOpt = chiTietSanPhamRepo.findById(ct.idChiTietSanPham.intValue());
                    if (chiTietSanPhamOpt.isPresent()) {
                        var chiTietSanPham = chiTietSanPhamOpt.get();
                        int soLuongConLai = (chiTietSanPham.getSoLuong() != null ? chiTietSanPham.getSoLuong() : 0) - (ct.soLuong != null ? ct.soLuong : 0);
                        chiTietSanPham.setSoLuong(Math.max(soLuongConLai, 0));
                        chiTietSanPhamRepo.save(chiTietSanPham);
                    }
                }
            }
        }

        // 3. Lưu thanh toán
        if (req.thanhToan != null) {
            ThanhToanHoaDon tt = new ThanhToanHoaDon();
            tt.setIdHoaDon(hd.getIdHoaDon());
            tt.setSoTienThanhToan(req.thanhToan.soTienThanhToan);
            tt.setPhuongThucThanhToan(req.thanhToan.phuongThucThanhToan);
            tt.setGhiChu(req.thanhToan.ghiChu);
            tt.setTrangThai(req.thanhToan.trangThai);
            thanhToanRepo.save(tt);
        }

        // 4. Gửi email xác nhận hóa đơn nếu có email khách hàng
        if (hd.getEmail() != null && !hd.getEmail().trim().isEmpty()) {
            try {
                emailThanhToan.sendInvoiceConfirmation(
                    hd.getEmail(),
                    hd.getTenNguoiNhan() != null ? hd.getTenNguoiNhan() : (hd.getIdKhachHang() != null ? khachHangRepo.findById(hd.getIdKhachHang().intValue()).map(kh -> kh.getTenKhachHang()).orElse("") : ""),
                    hd.getMaHoaDon()
                );
            } catch (Exception ex) {
                // Log lỗi gửi email nhưng không làm fail đơn hàng
                System.err.println("Lỗi gửi email xác nhận hóa đơn: " + ex.getMessage());
            }
        }
        return hd;
    }

    public HoaDonDTO findByMaHoaDon(String maHoaDon) {
        HoaDon entity = hoaDonRepo.findByMaHoaDon(maHoaDon);
        if (entity == null) return null;
        HoaDonDTO dto = new HoaDonDTO();
        dto.setId(entity.getIdHoaDon());
        dto.setIdKhachHang(entity.getIdKhachHang());
        dto.setIdNhanVien(entity.getIdNhanVien());
        dto.setIdPhieuGiamGia(entity.getIdPhieuGiamGia());
        dto.setLoaiDon(entity.getLoaiDon());
        dto.setTenNguoiNhan(entity.getTenNguoiNhan());
        dto.setSoDienThoai(entity.getSoDienThoai());
        dto.setEmail(entity.getEmail());
        dto.setDiaChiNhanHang(entity.getDiaChiNhanHang());
        dto.setPhiShip(entity.getPhiShip());
        dto.setGhiChu(entity.getGhiChu());
        dto.setMaHoaDon(entity.getMaHoaDon());
        dto.setTrangThai(entity.getTrangThai());
        // Set tổng tiền, giảm giá, phí ship, thành tiền
        dto.setTongTien(entity.getTongTien());
        dto.setPhiShip(entity.getPhiShip());
        if (entity.getGiamGia() != null) {
            dto.setGiamGia(entity.getGiamGia());
        } else {
            dto.setGiamGia(java.math.BigDecimal.ZERO);
        }
        if (entity.getThanhTien() != null) {
            dto.setThanhTien(entity.getThanhTien());
        } else {
            java.math.BigDecimal tongTien = entity.getTongTien() != null ? entity.getTongTien() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal giamGia = entity.getGiamGia() != null ? entity.getGiamGia() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal phiShip = entity.getPhiShip() != null ? entity.getPhiShip() : java.math.BigDecimal.ZERO;
            dto.setThanhTien(tongTien.subtract(giamGia).add(phiShip));
        }
        // Map thêm tên nhân viên
        if (entity.getIdNhanVien() != null) {
            var nv = nhanVienRepo.findById(entity.getIdNhanVien().intValue()).orElse(null);
            if (nv != null) dto.setTenNhanVien(nv.getTenNhanVien());
        }
        // Map thêm tên khách hàng, số điện thoại khách hàng
        if (entity.getIdKhachHang() != null) {
            var kh = khachHangRepo.findById(entity.getIdKhachHang().intValue()).orElse(null);
            if (kh != null) {
                dto.setTenKhachHang(kh.getTenKhachHang());
                dto.setSoDienThoaiKhachHang(kh.getSoDienThoai());
            }
        }
        // Map chi tiết hóa đơn
        java.util.List<org.example.duan.Entity.HoaDonChiTiet> chiTietList = chiTietRepo.findByIdHoaDon(entity.getIdHoaDon());
        java.util.List<org.example.duan.DTO.HoaDonChiTietDTO> chiTietDTOs = new java.util.ArrayList<>();
        for (org.example.duan.Entity.HoaDonChiTiet ct : chiTietList) {
            org.example.duan.DTO.HoaDonChiTietDTO ctdto = new org.example.duan.DTO.HoaDonChiTietDTO();
            ctdto.setIdChiTietSanPham(ct.getIdChiTietSanPham());
            ctdto.setSoLuong(ct.getSoLuong());
            ctdto.setDonGia(ct.getDonGia());
            ctdto.setThanhTien(ct.getThanhTien());
            // Lấy thông tin chi tiết sản phẩm
            org.example.duan.Entity.ChiTietSanPham chiTietSanPham = chiTietSanPhamRepo.findById(ct.getIdChiTietSanPham().intValue()).orElse(null);
            if (chiTietSanPham != null) {
                if (chiTietSanPham.getSanPham() != null) {
                    ctdto.setTenSanPham(chiTietSanPham.getSanPham().getTenSanPham());
                    ctdto.setMaSanPham(chiTietSanPham.getSanPham().getMaSanPham());
                    if (chiTietSanPham.getSanPham().getDanhMuc() != null) {
                        ctdto.setDanhMuc(chiTietSanPham.getSanPham().getDanhMuc().getTenDanhMuc());
                    }
                    if (chiTietSanPham.getSanPham().getThuongHieu() != null) {
                        ctdto.setThuongHieu(chiTietSanPham.getSanPham().getThuongHieu().getTenThuongHieu());
                    }
                }
                if (chiTietSanPham.getMauSac() != null) {
                    ctdto.setMauSac(chiTietSanPham.getMauSac().getMauSac());
                }
                if (chiTietSanPham.getKichCo() != null) {
                    ctdto.setKichCo(chiTietSanPham.getKichCo().getKichCo());
                }
            }
            chiTietDTOs.add(ctdto);
        }
        dto.setChiTiet(chiTietDTOs);
        // Lấy ngày tạo từ entity HoaDon
        dto.setNgayTao(entity.getNgayTao());
        return dto;
    }

    public HoaDonDTO findById(Long id) {
        HoaDon entity = hoaDonRepo.findById(id).orElse(null);
        if (entity == null) return null;
        HoaDonDTO dto = new HoaDonDTO();
        dto.setId(entity.getIdHoaDon());
        dto.setIdHoaDon(entity.getIdHoaDon()); // Đảm bảo luôn set idHoaDon
        dto.setIdKhachHang(entity.getIdKhachHang());
        dto.setIdNhanVien(entity.getIdNhanVien());
        dto.setIdPhieuGiamGia(entity.getIdPhieuGiamGia());
        dto.setLoaiDon(entity.getLoaiDon());
        dto.setTenNguoiNhan(entity.getTenNguoiNhan());
        dto.setSoDienThoai(entity.getSoDienThoai());
        dto.setEmail(entity.getEmail());
        dto.setDiaChiNhanHang(entity.getDiaChiNhanHang());
        dto.setPhiShip(entity.getPhiShip());
        dto.setGhiChu(entity.getGhiChu());
        dto.setMaHoaDon(entity.getMaHoaDon());
        dto.setTrangThai(entity.getTrangThai());
        dto.setTongTien(entity.getTongTien());
        dto.setPhiShip(entity.getPhiShip());
        if (entity.getGiamGia() != null) {
            dto.setGiamGia(entity.getGiamGia());
        } else {
            dto.setGiamGia(java.math.BigDecimal.ZERO);
        }
        if (entity.getThanhTien() != null) {
            dto.setThanhTien(entity.getThanhTien());
        } else {
            java.math.BigDecimal tongTien = entity.getTongTien() != null ? entity.getTongTien() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal giamGia = entity.getGiamGia() != null ? entity.getGiamGia() : java.math.BigDecimal.ZERO;
            java.math.BigDecimal phiShip = entity.getPhiShip() != null ? entity.getPhiShip() : java.math.BigDecimal.ZERO;
            dto.setThanhTien(tongTien.subtract(giamGia).add(phiShip));
        }
        if (entity.getIdNhanVien() != null) {
            var nv = nhanVienRepo.findById(entity.getIdNhanVien().intValue()).orElse(null);
            if (nv != null) dto.setTenNhanVien(nv.getTenNhanVien());
        }
        if (entity.getIdKhachHang() != null) {
            var kh = khachHangRepo.findById(entity.getIdKhachHang().intValue()).orElse(null);
            if (kh != null) {
                dto.setTenKhachHang(kh.getTenKhachHang());
                dto.setSoDienThoaiKhachHang(kh.getSoDienThoai());
            }
        }
        java.util.List<org.example.duan.Entity.HoaDonChiTiet> chiTietList = chiTietRepo.findByIdHoaDon(entity.getIdHoaDon());
        java.util.List<org.example.duan.DTO.HoaDonChiTietDTO> chiTietDTOs = new java.util.ArrayList<>();
        for (org.example.duan.Entity.HoaDonChiTiet ct : chiTietList) {
            org.example.duan.DTO.HoaDonChiTietDTO ctdto = new org.example.duan.DTO.HoaDonChiTietDTO();
            ctdto.setIdHoaDonChiTiet(ct.getIdHoaDonChiTiet());
            ctdto.setIdHoaDon(ct.getIdHoaDon());
            ctdto.setIdChiTietSanPham(ct.getIdChiTietSanPham());
            ctdto.setSoLuong(ct.getSoLuong());
            ctdto.setDonGia(ct.getDonGia());
            ctdto.setThanhTien(ct.getThanhTien());
            ctdto.setTrangThai(ct.getTrangThai());
            ctdto.setNgayTao(ct.getNgayTao());
            // Bổ sung lấy thông tin sản phẩm
            org.example.duan.Entity.ChiTietSanPham chiTietSanPham = chiTietSanPhamRepo.findById(ct.getIdChiTietSanPham().intValue()).orElse(null);
            if (chiTietSanPham != null) {
                if (chiTietSanPham.getSanPham() != null) {
                    ctdto.setTenSanPham(chiTietSanPham.getSanPham().getTenSanPham());
                    ctdto.setMaSanPham(chiTietSanPham.getSanPham().getMaSanPham());
                    if (chiTietSanPham.getSanPham().getDanhMuc() != null) {
                        ctdto.setDanhMuc(chiTietSanPham.getSanPham().getDanhMuc().getTenDanhMuc());
                    }
                    if (chiTietSanPham.getSanPham().getThuongHieu() != null) {
                        ctdto.setThuongHieu(chiTietSanPham.getSanPham().getThuongHieu().getTenThuongHieu());
                    }
                }
                if (chiTietSanPham.getMauSac() != null) {
                    ctdto.setMauSac(chiTietSanPham.getMauSac().getMauSac());
                }
                if (chiTietSanPham.getKichCo() != null) {
                    ctdto.setKichCo(chiTietSanPham.getKichCo().getKichCo());
                }
            }
            chiTietDTOs.add(ctdto);
        }
        dto.setChiTiet(chiTietDTOs);
        dto.setNgayTao(entity.getNgayTao());
        return dto;
    }

    @Transactional
    public boolean deleteHoaDon(Long id) {
        HoaDon hd = hoaDonRepo.findById(id).orElse(null);
        if (hd == null) return false;
        // Xóa chi tiết hóa đơn trước (nếu có)
        chiTietRepo.deleteAll(chiTietRepo.findByIdHoaDon(id));
        // Xóa thanh toán hóa đơn trước (nếu có)
        thanhToanRepo.deleteAll(thanhToanRepo.findByIdHoaDon(id));
        // Xóa hóa đơn
        hoaDonRepo.deleteById(id);
        return true;
    }

    public java.util.List<HoaDonDTO> getAllHoaDonDTO() {
        java.util.List<HoaDon> hoaDons = hoaDonRepo.findAll();
        java.util.List<HoaDonDTO> dtos = new java.util.ArrayList<>();
        for (HoaDon hd : hoaDons) {
            HoaDonDTO dto = new HoaDonDTO();
            dto.setId(hd.getIdHoaDon());
            dto.setIdHoaDon(hd.getIdHoaDon()); // Đảm bảo luôn set idHoaDon
            dto.setMaHoaDon(hd.getMaHoaDon());
            dto.setLoaiDon(hd.getLoaiDon());
            dto.setTongTien(hd.getTongTien());
            dto.setTrangThai(hd.getTrangThai());
            if (hd.getIdNhanVien() != null) {
                var nv = nhanVienRepo.findById(hd.getIdNhanVien().intValue()).orElse(null);
                if (nv != null) dto.setTenNhanVien(nv.getTenNhanVien());
            }
            if (hd.getIdKhachHang() != null) {
                var kh = khachHangRepo.findById(hd.getIdKhachHang().intValue()).orElse(null);
                if (kh != null) dto.setTenKhachHang(kh.getTenKhachHang());
            }
            // Lấy ngày tạo từ entity HoaDon
            dto.setNgayTao(hd.getNgayTao());
            dtos.add(dto);
        }
        return dtos;
    }

    // Thêm hàm cập nhật trạng thái hóa đơn
    @org.springframework.transaction.annotation.Transactional
    public boolean updateTrangThai(Long id, String trangThai) {
        HoaDon hoaDon = hoaDonRepo.findById(id).orElse(null);
        if (hoaDon == null) return false;
        hoaDon.setTrangThai(trangThai);
        hoaDonRepo.save(hoaDon);
        return true;
    }
}