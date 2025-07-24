package org.example.duan.Controller;

import org.example.duan.Entity.HoaDonChiTiet;
import org.example.duan.Repository.HoaDonChiTietRepository;
import org.example.duan.DTO.HoaDonChiTietDTO;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/hoadonchitiet")
public class HoaDonChiTietController {
    @Autowired
    private HoaDonChiTietRepository repository;

    // Lấy chi tiết theo id
    @GetMapping("/{id}")
    public ResponseEntity<HoaDonChiTiet> getById(@PathVariable Long id) {
        Optional<HoaDonChiTiet> result = repository.findById(id);
        return result.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Lấy toàn bộ chi tiết theo idHoaDon
    @GetMapping
    public ResponseEntity<?> getByIdHoaDon(@RequestParam Long idHoaDon) {
        List<HoaDonChiTiet> list = repository.findByIdHoaDon(idHoaDon);
        if (list == null || list.isEmpty()) {
            return ResponseEntity.status(404).body(java.util.Map.of(
                "success", false,
                "message", "Không tìm thấy chi tiết hóa đơn!",
                "data", null
            ));
        }
        return ResponseEntity.ok(list);
    }

    // Thêm mới
    @PostMapping
    public ResponseEntity<HoaDonChiTiet> create(@RequestBody HoaDonChiTiet chiTiet) {
        HoaDonChiTiet saved = repository.save(chiTiet);
        return ResponseEntity.ok(saved);
    }

    // Sửa
    @PutMapping("/{id}")
    public ResponseEntity<HoaDonChiTiet> update(@PathVariable Long id, @RequestBody HoaDonChiTiet chiTiet) {
        Optional<HoaDonChiTiet> existing = repository.findById(id);
        if (existing.isEmpty()) return ResponseEntity.notFound().build();
        chiTiet.setIdHoaDonChiTiet(id);
        HoaDonChiTiet saved = repository.save(chiTiet);
        return ResponseEntity.ok(saved);
    }

    // Xóa
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (!repository.existsById(id)) return ResponseEntity.notFound().build();
        repository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
} 