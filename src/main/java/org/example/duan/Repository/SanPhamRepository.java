package org.example.duan.Repository;

import org.example.duan.Entity.SanPham;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SanPhamRepository extends JpaRepository<SanPham, Integer> {

    @Query("SELECT DISTINCT s FROM SanPham s WHERE s.trangThai = 'Đang bán'")
    List<SanPham> findAllActive();

    @Query("SELECT s FROM SanPham s WHERE s.tenSanPham LIKE %:keyword% OR s.maSanPham LIKE %:keyword%")
    Page<SanPham> searchByKeyword(@Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.thuongHieu.idThuongHieu = :thuongHieuId AND s.trangThai = 'Đang bán'")
    Page<SanPham> findByThuongHieuId(@Param("thuongHieuId") Integer thuongHieuId, Pageable pageable);

    @Query("SELECT s FROM SanPham s WHERE s.danhMuc.idDanhMuc = :danhMucId AND s.trangThai = 'Đang bán'")
    Page<SanPham> findByDanhMucId(@Param("danhMucId") Integer danhMucId, Pageable pageable);

    @Modifying
    @Query("UPDATE SanPham s SET s.trangThai = :trangThai WHERE s.idSanPham = :id")
    void updateTrangThai(@Param("id") Integer id, @Param("trangThai") String trangThai);


    boolean existsByMaSanPham(String maSanPham);

}