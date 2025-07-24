package org.example.duan.Controller;

import org.example.duan.DTO.HoaDonDTO;
import org.example.duan.DTO.HoaDonRequest;
import org.example.duan.Entity.HoaDon;
import org.example.duan.Repository.HoaDonRepository;
import org.example.duan.Service.HoaDonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Optional;
import java.util.Map;

@RestController
@RequestMapping("/api/hoadon")
public class HoaDonController {
    @Autowired
    private HoaDonService hoaDonService;
    @Autowired
    private HoaDonRepository hoaDonRepository;

    @PostMapping
    public ResponseEntity<?> taoHoaDon(@RequestBody HoaDonRequest request) {
        HoaDon hoaDon = hoaDonService.taoHoaDonFull(request);
        return ResponseEntity.ok(java.util.Map.of(
            "success", true,
            "message", "Tạo hóa đơn thành công!",
            "data", java.util.Map.of(
                "maHoaDon", hoaDon.getMaHoaDon(),
                "idHoaDon", hoaDon.getIdHoaDon()
            )
        ));
    }

    @GetMapping
    public ResponseEntity<List<HoaDonDTO>> getAll() {
        return ResponseEntity.ok(hoaDonService.getAllHoaDonDTO());
    }

    @GetMapping("/ma/{maHoaDon}")
    public ResponseEntity<?> getByMaHoaDon(@PathVariable String maHoaDon) {
        try {
            HoaDonDTO hoaDon = hoaDonService.findByMaHoaDon(maHoaDon);
            if (hoaDon == null) {
                return ResponseEntity.status(404).body(java.util.Map.of(
                    "success", false,
                    "message", "Không tìm thấy hóa đơn!",
                    "data", null
                ));
            }
            return ResponseEntity.ok(hoaDon);
        } catch (Exception e) {
            return ResponseEntity.status(500).body(java.util.Map.of(
                "success", false,
                "message", "Đã xảy ra lỗi: " + e.getMessage(),
                "data", null
            ));
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getById(@PathVariable Long id) {
        HoaDonDTO hoaDon = hoaDonService.findById(id);
        if (hoaDon == null) {
            return ResponseEntity.status(404).body(java.util.Map.of(
                "success", false,
                "message", "Không tìm thấy hóa đơn!",
                "data", null
            ));
        }
        return ResponseEntity.ok(hoaDon);
    }
    // Xóa hẳn hóa đơn
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteHoaDon(@PathVariable Long id) {
        boolean deleted = hoaDonService.deleteHoaDon(id);
        if (!deleted) {
            return ResponseEntity.status(404).body(java.util.Map.of(
                "success", false,
                "message", "Không tìm thấy hóa đơn để xóa!"
            ));
        }
        return ResponseEntity.ok(java.util.Map.of(
            "success", true,
            "message", "Đã xóa hóa đơn thành công!"
        ));
    }

    // Endpoint cập nhật trạng thái hóa đơn
    @PutMapping("/{id}")
    public ResponseEntity<?> updateTrangThai(@PathVariable Long id, @RequestBody Map<String, Object> payload) {
        String trangThai = (String) payload.get("trangThai");
        if (trangThai == null) {
            return ResponseEntity.badRequest().body(Map.of("success", false, "message", "Thiếu trường trạng thái!"));
        }
        boolean updated = hoaDonService.updateTrangThai(id, trangThai);
        if (!updated) {
            return ResponseEntity.status(404).body(Map.of("success", false, "message", "Không tìm thấy hóa đơn!"));
        }
        return ResponseEntity.ok(Map.of("success", true, "message", "Cập nhật trạng thái thành công!"));
    }
} 