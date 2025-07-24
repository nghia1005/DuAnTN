package org.example.duan.Repository;

import org.example.duan.Entity.LichSuHoaDon;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface LichSuHoaDonRepository extends JpaRepository<LichSuHoaDon, Long> {
    List<LichSuHoaDon> findByIdHoaDon(Long idHoaDon);
} 