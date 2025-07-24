// 'use client';

// import React, { useEffect, useState, use } from 'react';

// interface HoaDonDetailPageProps {
//   params: { maHoaDon: string };
// }

// interface HoaDonChiTiet {
//   idHoaDonChiTiet: number;
//   tenSanPham: string;
//   soLuong: number;
//   donGia: number;
//   thanhTien: number;
//   danhMuc?: string;
//   thuongHieu?: string;
//   mauSac?: string;
//   kichCo?: string;
// }

// interface HoaDon {
//   idHoaDon: number;
//   maHoaDon: string;
//   tenKhachHang: string;
//   soDienThoai: string;
//   diaChiNhanHang: string;
//   tongTien: number;
//   giamGia: number;
//   phiShip: number;
//   thanhTien: number;
//   trangThai: string;
//   chiTiet: HoaDonChiTiet[];
// }

// export default function HoaDonDetailPage({ params }: HoaDonDetailPageProps) {
//   // Tự động nhận biết params là Promise hay object thường
//   let actualParams: { maHoaDon: string };
//   if (typeof (params as any).then === 'function') {
//     actualParams = use(params as unknown as Promise<{ maHoaDon: string }>);
//   } else {
//     actualParams = params as { maHoaDon: string };
//   }
//   const [hoaDon, setHoaDon] = useState<HoaDon | null>(null);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState('');

//   useEffect(() => {
//     const fetchHoaDon = async () => {
//       setLoading(true);
//       setError('');
//       try {
//         const BACKEND_URL = "http://192.168.1.219:8080";
//         const resAll = await fetch(`${BACKEND_URL}/api/hoadon`);
//         if (!resAll.ok) throw new Error('Không lấy được danh sách hóa đơn');
//         const allData = await resAll.json();
//         console.log('params.maHoaDon:', actualParams.maHoaDon);
//         console.log('allData maHoaDon:', allData.map((hd: any) => hd.maHoaDon));
//         const found = allData.find((hd: any) =>
//           (hd.maHoaDon || '').trim().toUpperCase() === (actualParams.maHoaDon || '').trim().toUpperCase()
//         );
//         if (!found) throw new Error('Không tìm thấy hóa đơn');
//         const res = await fetch(`${BACKEND_URL}/api/hoadon/${found.idHoaDon}`);
//         if (!res.ok) throw new Error('Không tìm thấy chi tiết hóa đơn');
//         const data = await res.json();
//         setHoaDon(data);
//       } catch (e: any) {
//         setError(e.message || 'Lỗi khi tải hóa đơn');
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchHoaDon();
//   }, [actualParams.maHoaDon]);

//   if (loading) return <div>Đang tải hóa đơn...</div>;
//   if (error) return <div style={{ color: 'red' }}>{error}</div>;
//   if (!hoaDon) return <div>Không có dữ liệu hóa đơn</div>;

//   return (
//     <div style={{ padding: 32 }}>
//       <h1>Chi tiết hóa đơn</h1>
//       <p><b>Mã hóa đơn:</b> {hoaDon.maHoaDon}</p>
//       <p><b>Khách hàng:</b> {hoaDon.tenKhachHang}</p>
//       <p><b>SĐT:</b> {hoaDon.soDienThoai}</p>
//       <p><b>Địa chỉ:</b> {hoaDon.diaChiNhanHang}</p>
//       <p><b>Trạng thái:</b> {hoaDon.trangThai}</p>
//       <h3>Sản phẩm:</h3>
//       <table border={1} cellPadding={6} style={{ minWidth: 400 }}>
//         <thead>
//           <tr>
//             <th>Tên sản phẩm</th>
//             <th>Danh mục</th>
//             <th>Thương hiệu</th>
//             <th>Màu sắc</th>
//             <th>Kích cỡ</th>
//             <th>Số lượng</th>
//             <th>Đơn giá</th>
//             <th>Thành tiền</th>
//           </tr>
//         </thead>
//         <tbody>
//           {(hoaDon.chiTiet || []).map((sp, idx) => (
//             <tr key={idx}>
//               <td>{sp.tenSanPham}</td>
//               <td>{sp.danhMuc || ''}</td>
//               <td>{sp.thuongHieu || ''}</td>
//               <td>{sp.mauSac || ''}</td>
//               <td>{sp.kichCo || ''}</td>
//               <td>{sp.soLuong}</td>
//               <td>{sp.donGia?.toLocaleString()}đ</td>
//               <td>{sp.thanhTien?.toLocaleString()}đ</td>
//             </tr>
//           ))}
//         </tbody>
//       </table>
//       <p><b>Phí ship:</b> {hoaDon.phiShip?.toLocaleString()}đ</p>
//       <p><b>Giảm giá:</b> {hoaDon.giamGia?.toLocaleString()}đ</p>
//       <p><b>Tổng cộng:</b> {hoaDon.thanhTien?.toLocaleString()}đ</p>
//     </div>
//   );
// } 