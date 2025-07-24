package org.example.duan.Controller;

import org.example.duan.DTO.ApiResponse;
import org.example.duan.Entity.TaiKhoan;
import org.example.duan.Entity.NhanVien;
import org.example.duan.Entity.VaiTro;
import org.example.duan.Repository.TaiKhoanRepository;
import org.example.duan.Repository.NhanVienRepository;
import org.example.duan.Repository.VaiTroRepository;
import org.example.duan.Service.EmailService;

import org.example.duan.Repository.TaiKhoanRepository;
import org.example.duan.Repository.NhanVienRepository;
import org.example.duan.Entity.NhanVien;
import org.example.duan.Repository.VaiTroRepository;
import org.example.duan.Entity.VaiTro;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.example.duan.Repository.KhachHangRepository;
import org.example.duan.Entity.KhachHang;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.Map;
import java.util.HashMap;
import java.util.Optional;

@RestController
@RequestMapping("/api/auth")
@CrossOrigin(origins = "*")
public class AuthController {

    @Autowired
    private TaiKhoanRepository taiKhoanRepository;

    @Autowired
    private NhanVienRepository nhanVienRepository;

    @Autowired
    private VaiTroRepository vaiTroRepository;

    @Autowired
    private EmailService emailService;

    @Autowired
    private KhachHangRepository khachHangRepository;


    @PostMapping("/login")
    public ResponseEntity<ApiResponse<?>> login(@RequestBody TaiKhoan loginRequest) {
        TaiKhoan tk = taiKhoanRepository.findByTenTaiKhoan(loginRequest.getTenTaiKhoan());
        if (tk == null) {
            return ResponseEntity.ok(ApiResponse.error("Tài khoản không tồn tại!"));
        }
        if (!tk.getMatKhau().equals(loginRequest.getMatKhau())) {
            return ResponseEntity.ok(ApiResponse.error("Mật khẩu không đúng!"));
        }
        if (!"Hoạt động".equalsIgnoreCase(tk.getTrangThai())) {
            return ResponseEntity.ok(ApiResponse.error("Tài khoản đã bị khóa hoặc chưa kích hoạt!"));
        }
        
        // Chuẩn bị thông tin trả về
        String vaiTro = tk.getVaiTro() != null ? tk.getVaiTro().getTenVaiTro() : "";
        Integer idVaiTro = tk.getVaiTro() != null ? tk.getVaiTro().getIdVaiTro() : null;
        String tenNhanVien = null;
        String tenKhachHang = null;
        NhanVien nv = nhanVienRepository.findByTaiKhoan(tk);
        if (nv != null) {
            tenNhanVien = nv.getTenNhanVien();
        } else {
            Optional<KhachHang> khOpt = khachHangRepository.findByTaiKhoan(tk);
            if (khOpt.isPresent()) {
                tenKhachHang = khOpt.get().getTenKhachHang();
            }
        }
        // Tạo object trả về
        Map<String, Object> userInfo = new java.util.HashMap<>();
        userInfo.put("tenTaiKhoan", tk.getTenTaiKhoan());
        userInfo.put("vaiTro", vaiTro);
        userInfo.put("idVaiTro", idVaiTro);
        if (tenNhanVien != null) userInfo.put("tenNhanVien", tenNhanVien);
        if (tenKhachHang != null) userInfo.put("tenKhachHang", tenKhachHang);
        return ResponseEntity.ok(ApiResponse.success("Đăng nhập thành công!", userInfo));
    }

    @PostMapping("/change-password")
    public ResponseEntity<ApiResponse<?>> changePassword(@RequestBody Map<String, String> req) {
        String tenTaiKhoan = req.get("tenTaiKhoan");
        String matKhauCu = req.get("matKhauCu");
        String matKhauMoi = req.get("matKhauMoi");
        TaiKhoan tk = taiKhoanRepository.findByTenTaiKhoan(tenTaiKhoan);
        if (tk == null) {
            return ResponseEntity.ok(ApiResponse.error("Tài khoản không tồn tại!"));
        }
        if (!tk.getMatKhau().equals(matKhauCu)) {
            return ResponseEntity.ok(ApiResponse.error("Mật khẩu cũ không đúng!"));
        }
        if (!"Hoạt động".equalsIgnoreCase(tk.getTrangThai())) {
            return ResponseEntity.ok(ApiResponse.error("Tài khoản đã bị khóa hoặc chưa kích hoạt!"));
        }
        tk.setMatKhau(matKhauMoi);
        taiKhoanRepository.save(tk);
        return ResponseEntity.ok(ApiResponse.success(null, "Đổi mật khẩu thành công!"));
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<ApiResponse<?>> forgotPassword(@RequestBody Map<String, String> req) {
        String tenTaiKhoan = req.get("tenTaiKhoan");
        String email = req.get("email");
        String matKhauMoi = req.get("matKhauMoi");
        TaiKhoan tk = taiKhoanRepository.findByTenTaiKhoan(tenTaiKhoan);
        if (tk == null) {
            return ResponseEntity.ok(ApiResponse.error("Tài khoản không tồn tại!"));
        }
        NhanVien nv = nhanVienRepository.findByTaiKhoan(tk);
        if (nv == null || nv.getEmail() == null || !nv.getEmail().equalsIgnoreCase(email)) {
            return ResponseEntity.ok(ApiResponse.error("Email không đúng!"));
        }
        tk.setMatKhau(matKhauMoi);
        taiKhoanRepository.save(tk);
        return ResponseEntity.ok(ApiResponse.success(null, "Đặt lại mật khẩu thành công!"));
    }

    @PostMapping("/refresh-token")
    public ResponseEntity<ApiResponse<?>> refreshToken(@RequestBody Map<String, String> req) {
        String refreshToken = req.get("refreshToken");
        if (refreshToken == null || refreshToken.isEmpty()) {
            return ResponseEntity.ok(ApiResponse.error("Refresh token không hợp lệ!"));
        }

        // Sinh accessToken mới (giả lập)
        String newAccessToken = "access-token-mock-" + System.currentTimeMillis();
        return ResponseEntity.ok(ApiResponse.success(newAccessToken, "Làm mới token thành công!"));
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<?>> register(@RequestBody Map<String, String> req) {
        String tenTaiKhoan = req.get("tenTaiKhoan");
        String matKhau = req.get("matKhau");
        String email = req.get("email");
        String soDienThoai = req.get("soDienThoai");
        String tenNhanVien = req.get("tenNhanVien");
        if (taiKhoanRepository.existsByTenTaiKhoan(tenTaiKhoan)) {
            return ResponseEntity.ok(ApiResponse.error("Tên tài khoản đã tồn tại!"));
        }
        if (nhanVienRepository.existsByEmail(email)) {
            return ResponseEntity.ok(ApiResponse.error("Email đã được sử dụng!"));
        }
        if (nhanVienRepository.existsBySoDienThoai(soDienThoai)) {
            return ResponseEntity.ok(ApiResponse.error("Số điện thoại đã được sử dụng!"));
        }
        VaiTro vaiTro = vaiTroRepository.findById(2).orElse(null);
        if (vaiTro == null) {
            return ResponseEntity.ok(ApiResponse.error("Không tìm thấy vai trò mặc định!"));
        }

        TaiKhoan tk = new TaiKhoan();
        tk.setTenTaiKhoan(tenTaiKhoan);
        tk.setMatKhau(matKhau);
        tk.setTrangThai("Hoạt động");
        tk.setVaiTro(vaiTro);
        taiKhoanRepository.save(tk);
        // Tạo nhân viên mới

        NhanVien nv = new NhanVien();
        nv.setTaiKhoan(tk);
        nv.setTenNhanVien(tenNhanVien);
        nv.setEmail(email);
        nv.setSoDienThoai(soDienThoai);
        nv.setMaNhanVien("NV" + System.currentTimeMillis());
        nv.setGioiTinh(true);
        nhanVienRepository.save(nv);
        return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản thành công!", null));
    }

    @PostMapping("/register-with-email")
    public ResponseEntity<ApiResponse<?>> registerWithEmail(@RequestBody Map<String, String> req) {
        String email = req.get("email");
        String soDienThoai = req.get("soDienThoai");
        String tenNhanVien = req.get("tenNhanVien");
        String gioiTinh = req.get("gioiTinh");
        String ngaySinh = req.get("ngaySinh");

        if (nhanVienRepository.existsByEmail(email)) {
            return ResponseEntity.ok(ApiResponse.error("Email đã được sử dụng!"));
        }
        if (nhanVienRepository.existsBySoDienThoai(soDienThoai)) {
            return ResponseEntity.ok(ApiResponse.error("Số điện thoại đã được sử dụng!"));
        }

        VaiTro vaiTro = vaiTroRepository.findById(2).orElse(null);
        if (vaiTro == null) {
            return ResponseEntity.ok(ApiResponse.error("Không tìm thấy vai trò mặc định!"));
        }

        // Tạo tên đăng nhập và mật khẩu tự động
        String tenTaiKhoan = "user" + System.currentTimeMillis();
        String matKhau = generateRandomPassword();

        TaiKhoan tk = new TaiKhoan();
        tk.setTenTaiKhoan(tenTaiKhoan);
        tk.setMatKhau(matKhau);
        tk.setTrangThai("Hoạt động");
        tk.setVaiTro(vaiTro);
        taiKhoanRepository.save(tk);

        NhanVien nv = new NhanVien();
        nv.setTaiKhoan(tk);
        nv.setTenNhanVien(tenNhanVien);
        nv.setEmail(email);
        nv.setSoDienThoai(soDienThoai);
        nv.setMaNhanVien("NV" + System.currentTimeMillis());
        nv.setGioiTinh("true".equals(gioiTinh));
        if (ngaySinh != null && !ngaySinh.isEmpty()) {
            nv.setNgaySinh(LocalDate.parse(ngaySinh));
        }
        nhanVienRepository.save(nv);

        // Gửi email thông tin tài khoản
        try {
            emailService.sendAccountInfo(email, tenTaiKhoan, matKhau, tenNhanVien);

            // Tạo response data với thông tin tài khoản
            Map<String, String> accountInfo = new HashMap<>();
            accountInfo.put("tenTaiKhoan", tenTaiKhoan);
            accountInfo.put("matKhau", matKhau);
            accountInfo.put("email", email);

            return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản thành công! Thông tin đăng nhập đã được gửi qua email.", accountInfo));
        } catch (Exception e) {
            // Log lỗi nhưng không fail request
            System.err.println("Lỗi gửi email: " + e.getMessage());

            // Trả về thông tin tài khoản trong response khi gửi email thất bại
            Map<String, String> accountInfo = new HashMap<>();
            accountInfo.put("tenTaiKhoan", tenTaiKhoan);
            accountInfo.put("matKhau", matKhau);
            accountInfo.put("email", email);

            return ResponseEntity.ok(ApiResponse.success("Đăng ký tài khoản thành công! Thông tin đăng nhập: " + tenTaiKhoan + " / " + matKhau, accountInfo));
        }
    }

    private String generateRandomPassword() {
        String chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < 8; i++) {
            sb.append(chars.charAt((int) (Math.random() * chars.length())));
        }
        return sb.toString();
    }
}
