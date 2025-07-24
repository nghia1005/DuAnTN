"use client";

import React, { useEffect, useState, useRef } from "react";
import AdminLayout from "@/component/Admin-Layout";
import { FaSearch, FaSyncAlt, FaTimes } from "react-icons/fa";

interface ChiTietSanPham {
  idChiTietSanPham: number;
  tenSanPham: string;
  maSanPham: string;
  duongDanHinhAnh: string | null;
  idSanPham: number;
  idHinhAnh: number | null;
}

export default function HinhAnhPage() {
  const [chiTietList, setChiTietList] = useState<ChiTietSanPham[]>([]);
  const [sanPhamList, setSanPhamList] = useState<{ idSanPham: number; tenSanPham: string }[]>([]);
  const [selectedSanPham, setSelectedSanPham] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRefs = useRef<{ [key: number]: HTMLInputElement | null }>({});
  // Removed searchTerm and appliedSearch state

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = () => {
    setLoading(true);
    fetch("http://localhost:8080/chi-tiet-san-pham/hien-thi")
      .then((res) => res.json())
      .then((data) => {
        setChiTietList(data);
        const sanPhams = Array.from(
          new Map(data.map((ct: ChiTietSanPham) => [ct.idSanPham, { idSanPham: ct.idSanPham, tenSanPham: ct.tenSanPham }])).values()
        ) as { idSanPham: number; tenSanPham: string }[];
        setSanPhamList(sanPhams);
      })
      .finally(() => setLoading(false));
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, ct: ChiTietSanPham) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Upload ảnh lên backend
    const formData = new FormData();
    formData.append("file", file);
    const uploadRes = await fetch("http://localhost:8080/hinh-anh/upload", {
      method: "POST",
      body: formData,
    });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || !uploadData.idHinhAnh) {
      alert("Upload ảnh thất bại!");
      return;
    }
    // Gọi API cập nhật chi tiết sản phẩm với idHinhAnh mới
    const updateRes = await fetch(`http://localhost:8080/chi-tiet-san-pham/sua/${ct.idChiTietSanPham}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...ct,
        idHinhAnh: uploadData.idHinhAnh,
        duongDanHinhAnh: uploadData.fileUrl, // optional, backend sẽ tự lấy từ idHinhAnh
      }),
    });
    if (updateRes.ok) {
      fetchData();
    } else {
      alert("Cập nhật chi tiết sản phẩm thất bại!");
    }
  };

  // Lọc chi tiết sản phẩm: chỉ lọc theo sản phẩm, không còn lọc theo từ khóa
  let filteredChiTiet: ChiTietSanPham[] = chiTietList;
  if (selectedSanPham && selectedSanPham !== -1 && selectedSanPham !== ("all" as any)) {
    filteredChiTiet = chiTietList.filter((ct) => ct.idSanPham === selectedSanPham);
  }

  return (
    <AdminLayout
      activeMenu="products"
      activeSubMenu="images"
      pageTitle="Hình ảnh sản phẩm"
    >
      <div style={{ padding: 24 }}>
        <h1>Danh sách hình ảnh sản phẩm</h1>
        <div style={{ marginTop: 24, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 20 }}>
          <label style={{ marginBottom: 0, marginRight: 8, fontSize: 20, fontWeight: 600, whiteSpace: 'nowrap' }}>Chọn sản phẩm:</label>
          <select
            value={selectedSanPham === null ? "" : selectedSanPham === -1 ? "all" : selectedSanPham}
            onChange={(e) => {
              if (e.target.value === "all") setSelectedSanPham(-1);
              else if (e.target.value === "") setSelectedSanPham(null);
              else setSelectedSanPham(Number(e.target.value));
            }}
            style={{ padding: 8, minWidth: 220, borderRadius: 8, border: '1.5px solid #b59d3a55', background: '#fff', fontSize: 16, color: '#222', outline: 'none', boxShadow: '0 2px 8px #b59d3a11', marginRight: 12 }}
          >
            <option value="">-- Chọn sản phẩm --</option>
            <option value="all">Tất cả sản phẩm</option>
            {sanPhamList.map((sp) => (
              <option key={sp.idSanPham} value={sp.idSanPham}>
                {sp.tenSanPham}
              </option>
            ))}
          </select>
          <button
            style={{
              padding: '8px 14px', // giảm padding
              background: '#fff',
              color: '#b59d3a',
              border: '1.5px solid #b59d3a55',
              borderRadius: 8,
              fontWeight: 700,
              fontSize: 16,
              cursor: 'pointer',
              boxShadow: '0 2px 8px #b59d3a11',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              height: 40, // giảm chiều cao
            }}
            onClick={() => setSelectedSanPham(null)}
            title="Xóa lọc sản phẩm"
          >
            <FaTimes style={{ fontSize: 18, color: '#b59d3a' }} />
            Xóa lọc
          </button>
        </div>
        {loading && <div>Đang tải dữ liệu...</div>}
        {selectedSanPham && !loading && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginTop: 24 }}>
            {filteredChiTiet.map((ct) => (
              <div
                key={ct.idChiTietSanPham}
                style={{
                  textAlign: "center",
                  width: 170,
                  minHeight: 210,
                  background: "#fff",
                  borderRadius: 12,
                  boxShadow: "0 2px 8px #b59d3a11",
                  padding: 12,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  marginBottom: 12,
                }}
              >
                {ct.duongDanHinhAnh ? (
                  (() => {
                    const fileName = ct.duongDanHinhAnh?.split("/").pop();
                    return (
                      <>
                        <img
                          src={`http://localhost:8080/hinh-anh/view/${fileName}`}
                          alt={ct.tenSanPham}
                          style={{ width: 120, height: 120, objectFit: "cover", borderRadius: 8, border: "1px solid #eee" }}
                        />
                        <br />
                        <button
                          style={{ marginTop: 8, padding: "4px 12px", fontSize: 13, borderRadius: 6, border: "1px solid #b59d3a", background: "#fffbe6", color: "#b59d3a", cursor: "pointer" }}
                          onClick={() => fileInputRefs.current[ct.idChiTietSanPham]?.click()}
                        >
                          Sửa ảnh
                        </button>
                        <input
                          type="file"
                          accept="image/*"
                          style={{ display: "none" }}
                          ref={el => { fileInputRefs.current[ct.idChiTietSanPham] = el; }}
                          onChange={e => handleFileChange(e, ct)}
                        />
                      </>
                    );
                  })()
                ) : (
                  <>
                    {/* <div style={{ width: 120, height: 120, background: "#f3f3f3", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", border: "1px solid #eee" }}>
                      Không có ảnh
                    </div> */}
                  </>
                )}
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 14,
                    minHeight: 36,
                    maxWidth: 150,
                    overflow: "hidden",
                    wordBreak: "break-word",
                    textAlign: "center",
                  }}
                  title={`${ct.maSanPham} (${ct.tenSanPham})`}
                >
                  {ct.maSanPham} ({ct.tenSanPham})
                </div>
              </div>
            ))}
            {filteredChiTiet.length === 0 && <div>Không có chi tiết sản phẩm nào.</div>}
          </div>
        )}
      </div>
    </AdminLayout>
  );
} 