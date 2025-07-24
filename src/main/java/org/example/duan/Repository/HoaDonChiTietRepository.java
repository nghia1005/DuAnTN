package org.example.duan.Repository;

import org.example.duan.Entity.HoaDonChiTiet;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface HoaDonChiTietRepository extends JpaRepository<HoaDonChiTiet, Long> {
    List<HoaDonChiTiet> findByIdHoaDon(Long idHoaDon);
} 