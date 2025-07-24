package org.example.duan.Controller;

import org.example.duan.DTO.*;
import org.example.duan.Service.HoaDonService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/hoadon")
public class HoaDonController {
    @Autowired
    private HoaDonService hoaDonService;

    @PostMapping
    public HoaDonDTO create(@RequestBody HoaDonRequest req) {
        return hoaDonService.createHoaDon(req);
    }

    @GetMapping
    public List<HoaDonDTO> getAll() {
        return hoaDonService.getAllHoaDon();
    }

    @GetMapping("/{id}")
    public HoaDonDTO getById(@PathVariable Long id) {
        return hoaDonService.getById(id);
    }

    @PutMapping("/{id}")
    public HoaDonDTO update(@PathVariable Long id, @RequestBody HoaDonDTO dto) {
        return hoaDonService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    public boolean delete(@PathVariable Long id) {
        return hoaDonService.delete(id);
    }
    // Thêm các API getAll, getById, update, delete...
} 