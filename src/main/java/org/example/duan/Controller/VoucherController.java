package org.example.duan.Controller;

import org.example.duan.DTO.ApDungVoucherRequest;
import org.example.duan.Entity.PhieuGiamGia;
import org.example.duan.Repository.PhieuGiamGiaRepository;
import org.example.duan.Service.VoucherService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;

@RestController
@RequestMapping("/api/voucher")
public class VoucherController {
    @Autowired
    private PhieuGiamGiaRepository repo;
    @Autowired
    private VoucherService voucherService;

    @GetMapping
    public ResponseEntity<List<PhieuGiamGia>> getAll() {
        return ResponseEntity.ok(repo.findAll());
    }

    @PostMapping("/apdung")
    public ResponseEntity<BigDecimal> apDungVoucher(@RequestBody ApDungVoucherRequest req) {
        BigDecimal discount = voucherService.tinhGiamGia(req.getMaPhieuGiamGia(), req.getTongTien());
        return ResponseEntity.ok(discount);
    }

    @PostMapping
    public ResponseEntity<PhieuGiamGia> add(@RequestBody PhieuGiamGia voucher) {
        return ResponseEntity.ok(voucherService.add(voucher));
    }

    @PutMapping("/{id}")
    public ResponseEntity<PhieuGiamGia> update(@PathVariable Long id, @RequestBody PhieuGiamGia voucher) {
        return ResponseEntity.ok(voucherService.update(id, voucher));
    }

    @PutMapping("/{id}/toggle-status")
    public ResponseEntity<PhieuGiamGia> toggleStatus(@PathVariable Long id) {
        return ResponseEntity.ok(voucherService.toggleStatus(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        voucherService.delete(id);
        return ResponseEntity.noContent().build();
    }
} 