package org.example.duan.Controller;

import org.example.duan.Entity.LichSuHoaDon;
import org.example.duan.Entity.HoaDon;
import org.example.duan.Repository.LichSuHoaDonRepository;
import org.example.duan.Repository.HoaDonRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/lich-su-hoa-don")
public class LichSuHoaDonController {
    @Autowired
    private LichSuHoaDonRepository lichSuRepo;
    @Autowired
    private HoaDonRepository hoaDonRepo;

    @GetMapping("/ma/{maHoaDon}")
    public ResponseEntity<?> getByMaHoaDon(@PathVariable String maHoaDon) {
        HoaDon hoaDon = hoaDonRepo.findByMaHoaDon(maHoaDon);
        if (hoaDon == null) {
            return ResponseEntity.status(404).body(java.util.Map.of(
                "success", false,
                "message", "Không tìm thấy hóa đơn!",
                "data", null
            ));
        }
        List<LichSuHoaDon> lichSu = lichSuRepo.findByIdHoaDon(hoaDon.getIdHoaDon());
        return ResponseEntity.ok(java.util.Map.of(
            "success", true,
            "data", lichSu
        ));
    }
} 