"use client";
import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Select, MenuItem, InputLabel, FormControl, Typography, Paper, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, Alert, CircularProgress, TableContainer, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import RefreshIcon from '@mui/icons-material/Refresh';
import { FaEye, FaEdit, FaPowerOff, FaSave, FaTimes, FaPlus } from "react-icons/fa";
import { useRouter } from 'next/navigation';

// Định nghĩa các kiểu dữ liệu (có thể cần chỉnh lại cho đúng backend)
interface ProductDetail {
  idChiTietSanPham: number;
  maSanPham: string;
  tenSanPham: string;
  tenThuongHieu: string;
  tenDanhMuc: string;
  tenMauSac: string;
  tenKichCo: string;
  duongDanHinhAnh: string;
  gia: number;
  soLuong: number;
  trangThai: string;
  moTa: string;
  idSanPham?: number;
  idMauSac?: number;
  idKichCo?: number;
  idHinhAnh?: number;
  idThuongHieu?: number;
  idDanhMuc?: number;
}

export default function ProductDetailTable() {
  // State cho filter
  const [searchTerm, setSearchTerm] = useState("");
  const [filterBrand, setFilterBrand] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterColor, setFilterColor] = useState("");
  const [filterSize, setFilterSize] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  // State cho data
  const [details, setDetails] = useState<ProductDetail[]>([]);
  const [pageLoading, setPageLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // State cho modal chi tiết
  const [openDetail, setOpenDetail] = useState(false);
  const [detailData, setDetailData] = useState<ProductDetail|null>(null);

  // State cho modal sửa
  const [editDetail, setEditDetail] = useState<ProductDetail|null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [editSuccess, setEditSuccess] = useState("");
  const [editError, setEditError] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [previewImg, setPreviewImg] = useState("");

  // State cho các select
  const [products, setProducts] = useState<any[]>([]);
  const [kichCos, setKichCos] = useState<any[]>([]);
  const [mauSacs, setMauSacs] = useState<any[]>([]);
  const [danhMucs, setDanhMucs] = useState<any[]>([]);
  const [thuongHieus, setThuongHieus] = useState<any[]>([]);

  // State cho filter select unique
  const uniqueCategories = Array.from(new Set(details.map(d => d.tenDanhMuc)));
  const uniqueColors = Array.from(new Set(details.map(d => d.tenMauSac)));
  const uniqueSizes = Array.from(new Set(details.map(d => d.tenKichCo)));
  const uniqueStatus = Array.from(new Set(details.map(d => d.trangThai)));

  // State cho modal thêm nhanh
  const [openAddDanhMuc, setOpenAddDanhMuc] = useState(false);
  const [addDanhMucError, setAddDanhMucError] = useState("");
  const [addDanhMucSuccess, setAddDanhMucSuccess] = useState("");
  const [addDanhMucLoading, setAddDanhMucLoading] = useState(false);
  const [tenDanhMucMoi, setTenDanhMucMoi] = useState("");
  const [addIdDanhMuc, setAddIdDanhMuc] = useState('');

  const [openAddThuongHieu, setOpenAddThuongHieu] = useState(false);
  const [addThuongHieuError, setAddThuongHieuError] = useState("");
  const [addThuongHieuSuccess, setAddThuongHieuSuccess] = useState("");
  const [addThuongHieuLoading, setAddThuongHieuLoading] = useState(false);
  const [tenThuongHieuMoi, setTenThuongHieuMoi] = useState("");

  const [openAddMauSac, setOpenAddMauSac] = useState(false);
  const [addMauSacError, setAddMauSacError] = useState("");
  const [addMauSacLoading, setAddMauSacLoading] = useState(false);
  const [tenMauSacMoi, setTenMauSacMoi] = useState("");

  const [openAddKichCo, setOpenAddKichCo] = useState(false);
  const [addKichCoError, setAddKichCoError] = useState("");
  const [addKichCoLoading, setAddKichCoLoading] = useState(false);
  const [tenKichCoMoi, setTenKichCoMoi] = useState("");

  // State cho biến thể
  const [variants, setVariants] = useState<any[]>([]);
  const [addVariantSuccess, setAddVariantSuccess] = useState("");
  const [genVariantError, setGenVariantError] = useState("");
  const [genVariantSuccess, setGenVariantSuccess] = useState("");
  const [setAddVariantError] = useState<any>(()=>()=>{}); // placeholder

  // State cho các hàm xử lý
  const [addMauSacSuccess, setAddMauSacSuccess] = useState('');
  const [addKichCoSuccess, setAddKichCoSuccess] = useState('');

  // Upload ảnh, chọn ảnh, preview ảnh cho modal sửa/thêm sản phẩm
  const [uploadingImg, setUploadingImg] = useState(false);
  const [uploadImgError, setUploadImgError] = useState('');
  const handleUploadImg = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImg(true);
    setUploadImgError('');
    try {
      const res = await fetch('http://localhost:8080/hinh-anh/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      console.log('Upload response:', data);
      if (!res.ok || !(data.fileUrl || data.fileName)) throw new Error(data.message || 'Lỗi upload ảnh!');
      const url = data.fileUrl.startsWith('http')
          ? data.fileUrl
          : `http://localhost:8080${data.fileUrl}`;
      setPreviewImg(url);
      if (data.idHinhAnh) setEditForm((f: any) => ({...f, idHinhAnh: data.idHinhAnh}));
    } catch (err: any) {
      setUploadImgError(err.message || 'Lỗi upload ảnh!');
    } finally {
      setUploadingImg(false);
    }
  };

  // Validate nâng cao, kiểm tra mã trùng (gọi API kiểm tra mã sản phẩm)
  const [maSanPhamCheck, setMaSanPhamCheck] = useState('');
  const [maSanPhamError, setMaSanPhamError] = useState('');
  const [tenSanPhamError, setTenSanPhamError] = useState('');
  const [moTaError, setMoTaError] = useState('');
  const [danhMucError, setDanhMucError] = useState('');
  const [thuongHieuError, setThuongHieuError] = useState('');
  const [trangThaiError, setTrangThaiError] = useState('');
  const checkMaSanPhamTrung = async (ma: string) => {
    if (!ma) return;
    try {
      const res = await fetch(`http://localhost:8080/san-pham/kiem-tra-ma?ma=${encodeURIComponent(ma)}`);
      const data = await res.json();
      if (data.trung) setMaSanPhamError('Mã sản phẩm đã tồn tại!');
      else setMaSanPhamError('');
    } catch {
      setMaSanPhamError('Không kiểm tra được mã!');
    }
  };

  // Hoàn thiện logic sinh biến thể (hiển thị, xóa, cập nhật biến thể)
  const handleRemoveVariant = (idx: number) => {
    setVariants(vs => vs.filter((_, i) => i !== idx));
  };

  // Fetch data (giả lập, bạn cần chỉnh lại endpoint cho đúng)
  useEffect(() => {
    setPageLoading(true);
    fetch('http://localhost:8080/chi-tiet-san-pham/hien-thi')
        .then(res => res.json())
        .then(data => {
          // Sắp xếp giảm dần theo idChiTietSanPham (mới nhất lên đầu)
          data.sort((a: ProductDetail, b: ProductDetail) => b.idChiTietSanPham - a.idChiTietSanPham);
          setDetails(data);
          setTotalPages(1); // Cập nhật lại nếu có phân trang
        })
        .finally(() => setPageLoading(false));
  }, []);

  // Filter logic
  const filteredDetails = details.filter(detail => {
    const search = searchTerm.trim().toLowerCase();
    return (
        (!search ||
            detail.maSanPham?.toLowerCase().includes(search) ||
            detail.tenSanPham?.toLowerCase().includes(search) ||
            detail.moTa?.toLowerCase().includes(search)
        ) &&
        (!filterBrand || detail.tenThuongHieu === filterBrand) &&
        (!filterCategory || detail.tenDanhMuc === filterCategory) &&
        (!filterColor || detail.tenMauSac === filterColor) &&
        (!filterSize || detail.tenKichCo === filterSize) &&
        (!filterStatus || detail.trangThai === filterStatus)
    );
  });

  const pageSize = 10;
  const pagedDetails = filteredDetails.slice(page * pageSize, (page + 1) * pageSize);

  useEffect(() => {
    setTotalPages(Math.ceil(filteredDetails.length / pageSize));
    if (page > 0 && page >= Math.ceil(filteredDetails.length / pageSize)) {
      setPage(0); // reset về trang đầu nếu dữ liệu bị lọc ít lại
    }
  }, [filteredDetails]);

  // Khi đổi filter/search thì về trang đầu
  useEffect(() => {
    setPage(0);
  }, [searchTerm, filterBrand, filterCategory, filterColor, filterSize, filterStatus]);

  // Các hàm xử lý (placeholder, bạn cần hoàn thiện thêm)
  const handleToggleStatus = async (detail: ProductDetail) => {
    try {
      const res = await fetch(`http://localhost:8080/chi-tiet-san-pham/doi-trang-thai/${detail.idChiTietSanPham}`, {
        method: 'PUT'
      });
      const data = await res.text(); // API trả về chuỗi
      if (!res.ok) throw new Error(data || 'Lỗi đổi trạng thái!');
      setSnackbar({ open: true, message: 'Đổi trạng thái thành công!', severity: 'success' });
      // Cập nhật lại trạng thái trong bảng
      setDetails(prev => prev.map(d =>
          d.idChiTietSanPham === detail.idChiTietSanPham
              ? { ...d, trangThai: d.trangThai === 'Đang bán' ? 'Ngừng bán' : 'Đang bán' }
              : d
      ));
    } catch (err: any) {
      setSnackbar({ open: true, message: err.message || 'Lỗi đổi trạng thái!', severity: 'error' });
    }
  };
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    // ...
  };
  const handleGenVariant = () => {
    const variants = [];
    for (const mau of addMultiMauSac) {
      for (const kc of addMultiKichCo) {
        variants.push({ idMauSac: mau, idKichCo: kc });
      }
    }
    setAddVariants(variants);
  };
  const validateVariant = () => {
    // ...
    return "";
  };

  // Validate form khi sửa/thêm sản phẩm
  const validateEditForm = () => {
    if (!editForm.maSanPham || editForm.maSanPham.length < 3 || editForm.maSanPham.length > 20) {
      return 'Mã sản phẩm phải từ 3-20 ký tự';
    }
    if (!/^[a-zA-Z0-9-]+$/.test(editForm.maSanPham)) {
      return 'Mã sản phẩm không chứa ký tự đặc biệt';
    }
    if (!editForm.tenSanPham || editForm.tenSanPham.length < 3 || editForm.tenSanPham.length > 50) {
      return 'Tên sản phẩm phải từ 3-50 ký tự';
    }
    if (!editForm.idSanPham) {
      return 'Thiếu thông tin sản phẩm cha';
    }
    // ...các validate khác nếu cần...
    return '';
  };

  // Quick add (thêm nhanh danh mục, thương hiệu, màu sắc, kích cỡ)
  // Modal thêm nhanh danh mục
  const handleAddDanhMuc = async () => {
    if (!tenDanhMucMoi.trim()) {
      setAddDanhMucError('Vui lòng nhập tên danh mục!');
      return;
    }
    setAddDanhMucError('');
    try {
      const res = await fetch('http://localhost:8080/danh-muc/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenDanhMuc: tenDanhMucMoi })
      });
      const data = await res.json();
      if (!res.ok || !data.idDanhMuc) throw new Error(data.message || 'Lỗi thêm danh mục!');
      setAddDanhMucSuccess('Thêm danh mục thành công!');
      setTimeout(()=>setAddDanhMucSuccess(''), 2000);
      setOpenAddDanhMuc(false);
      setTenDanhMucMoi('');
      // Fetch lại danh mục và auto chọn
      const res2 = await fetch('http://localhost:8080/danh-muc/hien-thi');
      const danhMucData = await res2.json();
      setDanhMucs(danhMucData);
      setAddIdDanhMuc(String(data.idDanhMuc));
    } catch (err) {
      setAddDanhMucError((err as Error).message || 'Lỗi thêm danh mục!');
    }
  };

  // Quick add thương hiệu
  const handleAddThuongHieu = async () => {
    if (!tenThuongHieuMoi.trim()) {
      setAddThuongHieuError('Vui lòng nhập tên thương hiệu!');
      return;
    }
    setAddThuongHieuError('');
    try {
      const res = await fetch('http://localhost:8080/thuong-hieu/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenThuongHieu: tenThuongHieuMoi })
      });
      const data = await res.json();
      if (!res.ok || !data.idThuongHieu) throw new Error(data.message || 'Lỗi thêm thương hiệu!');
      setAddThuongHieuSuccess('Thêm thương hiệu thành công!');
      setTimeout(()=>setAddThuongHieuSuccess(''), 2000);
      setOpenAddThuongHieu(false);
      setTenThuongHieuMoi('');
      // Fetch lại thương hiệu và auto chọn
      const res2 = await fetch('http://localhost:8080/thuong-hieu/hien-thi');
      const thuongHieuData = await res2.json();
      setThuongHieus(thuongHieuData);
      setAddIdThuongHieu(String(data.idThuongHieu));
    } catch (err) {
      setAddThuongHieuError((err as Error).message || 'Lỗi thêm thương hiệu!');
    }
  };

  // Quick add màu sắc
  const handleAddMauSac = async () => {
    if (!tenMauSacMoi.trim()) {
      setAddMauSacError('Vui lòng nhập tên màu sắc!');
      return;
    }
    setAddMauSacError('');
    try {
      const res = await fetch('http://localhost:8080/mau-sac/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mauSac: tenMauSacMoi })
      });
      const data = await res.json();
      if (!res.ok || !data.idMauSac) throw new Error(data.message || 'Lỗi thêm màu sắc!');
      setAddMauSacSuccess('Thêm màu sắc thành công!');
      setTimeout(()=>setAddMauSacSuccess(''), 2000);
      setOpenAddMauSac(false);
      setTenMauSacMoi('');
      // Fetch lại màu sắc và auto chọn
      const res2 = await fetch('http://localhost:8080/mau-sac/hien-thi');
      const mauSacData = await res2.json();
      setMauSacs(mauSacData);
      setAddIdMauSac(String(data.idMauSac));
      setAddMultiMauSac(prev => prev.includes(String(data.idMauSac)) ? prev : [...prev, String(data.idMauSac)]);
    } catch (err) {
      setAddMauSacError((err as Error).message || 'Lỗi thêm màu sắc!');
    }
  };

  // Quick add kích cỡ
  const handleAddKichCo = async () => {
    if (!tenKichCoMoi.trim()) {
      setAddKichCoError('Vui lòng nhập tên kích cỡ!');
      return;
    }
    setAddKichCoError('');
    try {
      const res = await fetch('http://localhost:8080/kich-co/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kichCo: tenKichCoMoi })
      });
      const data = await res.json();
      if (!res.ok || !data.idKichCo) throw new Error(data.message || 'Lỗi thêm kích cỡ!');
      setAddKichCoSuccess('Thêm kích cỡ thành công!');
      setTimeout(()=>setAddKichCoSuccess(''), 2000);
      setOpenAddKichCo(false);
      setTenKichCoMoi('');
      // Fetch lại kích cỡ và auto chọn
      const res2 = await fetch('http://localhost:8080/kich-co/hien-thi');
      const kichCoData = await res2.json();
      setKichCos(kichCoData);
      setAddIdKichCo(String(data.idKichCo));
      setAddMultiKichCo(prev => prev.includes(String(data.idKichCo)) ? prev : [...prev, String(data.idKichCo)]);
    } catch (err) {
      setAddKichCoError((err as Error).message || 'Lỗi thêm kích cỡ!');
    }
  };

  const [showAddForm, setShowAddForm] = useState(false);
  const [addMode, setAddMode] = useState<'new' | 'select' | null>(null);

  // State cho form thêm mới chi tiết sản phẩm
  const [addIdSanPham, setAddIdSanPham] = useState('');
  const [addMaSanPham, setAddMaSanPham] = useState('');
  const [addTenSanPham, setAddTenSanPham] = useState('');
  const [addMoTa, setAddMoTa] = useState('');
  const [addIdThuongHieu, setAddIdThuongHieu] = useState('');
  const [addIdMauSac, setAddIdMauSac] = useState('');
  const [addIdKichCo, setAddIdKichCo] = useState('');
  const [addGia, setAddGia] = useState('');
  const [addSoLuong, setAddSoLuong] = useState('');
  const [addPreviewImg, setAddPreviewImg] = useState('');
  const [addMultiMauSac, setAddMultiMauSac] = useState<string[]>([]);
  const [addMultiKichCo, setAddMultiKichCo] = useState<string[]>([]);
  const [addVariants, setAddVariants] = useState<any[]>([]);



  // Thêm state cho trường trạng thái nếu chưa có
  const [addTrangThai, setAddTrangThai] = useState('');
  // Thêm state lỗi cho số lượng và giá
  const [addSoLuongError, setAddSoLuongError] = useState('');
  const [addGiaError, setAddGiaError] = useState('');

  // State cho snackbar thông báo
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Thêm state cho form thêm mới:
  const [addIdHinhAnh, setAddIdHinhAnh] = useState('');

  // Hàm upload ảnh cho form thêm mới:
  const handleUploadImgAdd = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('file', file);
    setUploadingImg(true);
    setUploadImgError('');
    try {
      const res = await fetch('http://localhost:8080/hinh-anh/upload', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      console.log('Upload response:', data);
      if (!res.ok || !(data.fileUrl || data.fileName)) throw new Error(data.message || 'Lỗi upload ảnh!');
      // Sử dụng đúng đường dẫn trả về từ backend
      const addUrl = data.fileUrl.startsWith('http')
          ? data.fileUrl
          : `http://localhost:8080${data.fileUrl}`;
      setAddPreviewImg(addUrl);
      if (data.idHinhAnh) setAddIdHinhAnh(String(data.idHinhAnh));
    } catch (err: any) {
      setUploadImgError(err.message || 'Lỗi upload ảnh!');
    } finally {
      setUploadingImg(false);
    }
  };

  // Fetch dữ liệu động từ backend khi mount
  useEffect(() => {
    fetch('http://localhost:8080/danh-muc/hien-thi')
        .then(res => res.json())
        .then(data => setDanhMucs(data));
    fetch('http://localhost:8080/thuong-hieu/hien-thi')
        .then(res => res.json())
        .then(data => setThuongHieus(data));
    fetch('http://localhost:8080/mau-sac/hien-thi')
        .then(res => res.json())
        .then(data => setMauSacs(data));
    fetch('http://localhost:8080/kich-co/hien-thi')
        .then(res => res.json())
        .then(data => setKichCos(data));
    fetch('http://localhost:8080/san-pham/hien-thi')
        .then(res => res.json())
        .then(data => setProducts(data));
  }, []);

  // Thêm mới sản phẩm cha
  const handleCreateNewProduct = async () => {
    try {
      const res = await fetch('http://localhost:8080/san-pham/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maSanPham: addMaSanPham,
          tenSanPham: addTenSanPham,
          moTa: addMoTa,
          idDanhMuc: addIdDanhMuc,
          idThuongHieu: addIdThuongHieu,
          trangThai: addTrangThai
        })
      });
      const data = await res.json();
      if (!res.ok || !data.idSanPham) throw new Error(data.message || 'Lỗi thêm sản phẩm!');
      // Fetch lại danh sách sản phẩm và auto chọn
      const res2 = await fetch('http://localhost:8080/san-pham/hien-thi');
      const productsData = await res2.json();
      setProducts(productsData);
      setAddIdSanPham(String(data.idSanPham));
      setSnackbar({ open: true, message: 'Thêm sản phẩm thành công!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: (err as Error).message || 'Lỗi thêm sản phẩm!', severity: 'error' });
    }
  };

  // Reset form thêm mới sản phẩm
  const handleResetAddForm = () => {
    setAddIdSanPham('');
    setAddMaSanPham('');
    setAddTenSanPham('');
    setAddMoTa('');
    setAddIdDanhMuc('');
    setAddIdThuongHieu('');
    setAddTrangThai('');
    setAddIdMauSac('');
    setAddIdKichCo('');
    setAddGia('');
    setAddSoLuong('');
    setAddPreviewImg('');
    setAddMultiMauSac([]);
    setAddMultiKichCo([]);
    setAddVariants([]);
    setAddIdHinhAnh('');

  };

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  // Reset lại lựa chọn màu sắc, kích cỡ và danh sách biến thể
  const handleResetMauSacKichCo = () => {
    setAddMultiMauSac([]);
    setAddMultiKichCo([]);
    setAddVariants([]);
  };

  // Validate toàn bộ form thêm chi tiết sản phẩm
  const validateAddForm = () => {
    if (!addIdSanPham) return 'Vui lòng chọn sản phẩm cha hoặc tạo mới!';
    if (!addMaSanPham || addMaSanPham.length < 3 || addMaSanPham.length > 20) return 'Mã sản phẩm phải từ 3-20 ký tự!';
    if (!/^[a-zA-Z0-9-]+$/.test(addMaSanPham)) return 'Mã sản phẩm không chứa ký tự đặc biệt!';
    if (!addTenSanPham || addTenSanPham.length < 3 || addTenSanPham.length > 50) return 'Tên sản phẩm phải từ 3-50 ký tự!';
    if (!addIdDanhMuc) return 'Vui lòng chọn danh mục!';
    if (!addIdThuongHieu) return 'Vui lòng chọn thương hiệu!';
    if (!addTrangThai) return 'Vui lòng chọn trạng thái!';
    if (addMultiMauSac.length === 0) return 'Vui lòng chọn ít nhất 1 màu sắc!';
    if (addMultiKichCo.length === 0) return 'Vui lòng chọn ít nhất 1 kích cỡ!';
    if (addGia === '' || Number(addGia) <= 0) {
      if (!addGiaError) setAddGiaError('Giá phải lớn hơn 0');
      return 'Giá phải lớn hơn 0!';
    }
    if (addSoLuong === '' || Number(addSoLuong) <= 0) {
      if (!addSoLuongError) setAddSoLuongError('Số lượng phải lớn hơn 0');
      return 'Số lượng phải lớn hơn 0!';
    }
    return '';
  };

  const handleSaveEdit = async () => {
    try {
      setEditLoading(true);
      
      // Validate form trước khi lưu
      const validationError = validateEditForm();
      if (validationError) {
        setSnackbar({ open: true, message: validationError, severity: 'error' });
        return;
      }

      // Nếu có thay đổi mô tả, cần cập nhật sản phẩm cha trước
      if (editForm.moTa !== editDetail?.moTa) {
        const sanPhamUpdateData = {
          maSanPham: editForm.maSanPham,
          tenSanPham: editForm.tenSanPham,
          moTa: editForm.moTa,
          idDanhMuc: editForm.idDanhMuc,
          idThuongHieu: editForm.idThuongHieu,
          trangThai: editForm.trangThai
        };
        
        const sanPhamRes = await fetch(`http://localhost:8080/san-pham/sua/${editForm.idSanPham}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sanPhamUpdateData)
        });
        
        if (!sanPhamRes.ok) {
          const sanPhamError = await sanPhamRes.json();
          setSnackbar({ open: true, message: sanPhamError.message || 'Lỗi khi cập nhật sản phẩm!', severity: 'error' });
          return;
        }
      }

      // Sau đó cập nhật chi tiết sản phẩm
      const chiTietUpdateData = {
        idSanPham: editForm.idSanPham,
        idMauSac: editForm.idMauSac,
        idKichCo: editForm.idKichCo,
        soLuong: editForm.soLuong,
        gia: editForm.gia,
        trangThai: editForm.trangThai,
        idHinhAnh: editForm.idHinhAnh
      };

      const res = await fetch(`http://localhost:8080/chi-tiet-san-pham/sua/${editForm.idChiTietSanPham}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(chiTietUpdateData)
      });
      
      const data = await res.json();
              if (res.ok) {
          setSnackbar({ open: true, message: 'Lưu thành công!', severity: 'success' });
          
          // Cập nhật lại toàn bộ danh sách để đảm bảo hiển thị đúng
          // Đặc biệt quan trọng khi sửa mô tả vì mô tả thuộc về sản phẩm cha
          const refreshRes = await fetch('http://localhost:8080/chi-tiet-san-pham/hien-thi');
          const refreshData = await refreshRes.json();
          refreshData.sort((a: ProductDetail, b: ProductDetail) => b.idChiTietSanPham - a.idChiTietSanPham);
          setDetails(refreshData);
          
          setEditDetail(null);
        } else {
        setSnackbar({ open: true, message: data.message || 'Lỗi khi lưu!', severity: 'error' });
      }
            } catch (err) {
          setSnackbar({ open: true, message: 'Lỗi khi lưu!', severity: 'error' });
        } finally {
          setEditLoading(false);
        }
      };

  const handleAddAll = async () => {
    // Validate form trước khi thêm
    const validationError = validateAddForm();
    if (validationError) {
      setSnackbar({ open: true, message: validationError, severity: 'error' });
      return;
    }

    // CHẶN nếu chưa có biến thể
    if (!variants || variants.length === 0) {
      setSnackbar({ open: true, message: 'Vui lòng tạo ít nhất một biến thể!', severity: 'error' });
      return;
    }
    
    let idSanPham = addIdSanPham;
    // Nếu đang tạo mới sản phẩm cha
    if (!idSanPham) {
      const res = await fetch('http://localhost:8080/san-pham/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          maSanPham: addMaSanPham,
          tenSanPham: addTenSanPham,
          moTa: addMoTa,
          idDanhMuc: addIdDanhMuc,
          idThuongHieu: addIdThuongHieu,
          trangThai: addTrangThai
          // Nếu có ảnh đại diện, thêm trường idHinhAnh
        })
      });
      const data = await res.json();
      if (!res.ok || !data.idSanPham) {
        setSnackbar({ open: true, message: data.message || 'Lỗi tạo sản phẩm!', severity: 'error' });
        return;
      }
      idSanPham = String(data.idSanPham);
    }
    
    // Tạo các biến thể với giá và số lượng từ form
    for (const [idx, v] of variants.entries()) {
      // ... upload ảnh biến thể nếu có ...
      const res = await fetch('http://localhost:8080/chi-tiet-san-pham/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idSanPham,
          idMauSac: v.idMauSac,
          idKichCo: v.idKichCo,
          soLuong: addSoLuong, // Sử dụng số lượng từ form
          gia: addGia, // Sử dụng giá từ form
          // idHinhAnh: ...,
          trangThai: 'Đang bán'
        })
      });
      if (!res.ok) {
        const msg = await res.text();
        setSnackbar({ open: true, message: msg, severity: 'error' });
        return;
      }
    }
    setSnackbar({ open: true, message: 'Thêm sản phẩm và biến thể thành công!', severity: 'success' });
    // Reset form
    setShowAddForm(false);
    handleResetAddForm();
    // Refresh danh sách
    const refreshRes = await fetch('http://localhost:8080/chi-tiet-san-pham/hien-thi');
    const refreshData = await refreshRes.json();
    refreshData.sort((a: ProductDetail, b: ProductDetail) => b.idChiTietSanPham - a.idChiTietSanPham);
    setDetails(refreshData);
  };
  // 2. Add state for error and for controlling when to show the variant table
  const [variantTableVisible, setVariantTableVisible] = useState(false);
  const [variantError, setVariantError] = useState('');

  // 1. Thêm state lỗi cho màu sắc và kích cỡ
  const [mauSacError, setMauSacError] = useState('');
  const [kichCoError, setKichCoError] = useState('');

  // Đặt ngay trước return hoặc trước JSX Box ảnh đại diện sản phẩm cha:
  const selectedProduct = products.find(p => String(p.idSanPham) === String(addIdSanPham));
  let imgUrl = '';
  if (addPreviewImg) {
    imgUrl = addPreviewImg;
  } else if (selectedProduct?.duongDanHinhAnh) {
    if (selectedProduct.duongDanHinhAnh.startsWith('http')) {
      imgUrl = selectedProduct.duongDanHinhAnh;
    } else {
      imgUrl = `http://localhost:8080/${selectedProduct.duongDanHinhAnh.replace(/^\/+/, '')}`;
    }
  }
  console.log('selectedProduct:', selectedProduct);
  console.log('imgUrl:', imgUrl);

  const router = useRouter();

  // Thêm hàm tiện ích lấy file ảnh theo màu sắc
  const getImageForColor = (colorId: string, variantsList: any[] = variants) => {
    const found = variantsList.find(v => v.idMauSac === colorId && v.hinhAnh);
    return found ? found.hinhAnh : null;
  };

  // Thêm hàm tiện ích lấy previewImg và file theo màu sắc
  const getPreviewImgForColor = (colorId: string) => {
    const found = variants.find(v => v.idMauSac === colorId && v.previewImg);
    return found ? found.previewImg : '';
  };
  const getFileForColor = (colorId: string) => {
    const found = variants.find(v => v.idMauSac === colorId && v.hinhAnh);
    return found ? found.hinhAnh : null;
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  // Thêm state cho lỗi từng dòng biến thể
  const [variantErrors, setVariantErrors] = useState<{ soLuong?: string; gia?: string }[]>([]);

  const validateAllVariants = () => {
    // Chỉ cần kiểm tra có biến thể nào được tạo không
    return variants.length > 0;
  };

  return (
      <div style={{background:'#fffbe6', minHeight:'100vh', padding:'24px 0'}}>
        <div style={{maxWidth:1400, margin:'0 auto', background:'#fffbe6'}}>
          <h2 style={{fontWeight:700, fontSize:28, marginBottom:18, color:'#2c2c2c'}}>Danh sách chi tiết sản phẩm</h2>
          <Dialog open={showAddForm} onClose={()=>setShowAddForm(false)} maxWidth="lg" fullWidth PaperProps={{ style: { borderRadius: 18, minHeight: 600, padding: 0 } }}>
            <DialogTitle sx={{ fontSize: 28, fontWeight: 700, textAlign: 'center', py: 3 }}>
              Thêm chi tiết sản phẩm
            </DialogTitle>
            <DialogContent sx={{p:5, overflowX:'hidden'}}>
              <Box sx={{display:'flex', flexDirection:'row', gap:6, mb:2, mt:1, flexWrap:'wrap', alignItems:'flex-start', justifyContent: 'center'}}>
                {/* Cột trái: Thông tin sản phẩm cha */}
                <Paper sx={{flex:1, minWidth:350, maxWidth:500, p:4, borderRadius:8, boxShadow:2, bgcolor:'#fafbfc', mb:2, mr:3}} elevation={3}>
                  {/* Nút chọn chế độ nằm trong modal */}
                  <Box sx={{display:'flex', justifyContent:'flex-end', mb:2, gap:1}}>
                    <Button
                      variant={addMode === 'new' ? 'contained' : 'outlined'}
                      color="primary"
                      size="small"
                      sx={{fontWeight:600}}
                      onClick={() => {
                        setAddMode('new');
                        setAddIdSanPham('');
                        setAddMaSanPham('');
                        setAddTenSanPham('');
                        setAddMoTa('');
                        setAddIdDanhMuc('');
                        setAddIdThuongHieu('');
                        setAddTrangThai('');
                      }}
                    >
                      Tạo mới sản phẩm
                    </Button>
                    <Button
                      variant={addMode === 'select' ? 'contained' : 'outlined'}
                      color="secondary"
                      size="small"
                      sx={{fontWeight:600}}
                      onClick={() => {
                        setAddMode('select');
                        setAddIdSanPham(products[0]?.idSanPham ? String(products[0].idSanPham) : '');
                        const selected = products[0];
                        if (selected) {
                          setAddMaSanPham(selected.maSanPham || '');
                          setAddTenSanPham(selected.tenSanPham || '');
                          setAddMoTa(selected.moTa || '');
                          setAddIdDanhMuc(selected.idDanhMuc ? String(selected.idDanhMuc) : '');
                          setAddIdThuongHieu(selected.idThuongHieu ? String(selected.idThuongHieu) : '');
                          setAddTrangThai(selected.trangThai || '');
                          setAddPreviewImg(selected.duongDanHinhAnh || '');
                        }
                      }}
                    >
                      Chọn sản phẩm có sẵn
                    </Button>
                  </Box>
                  {/* Chỉ hiển thị dropdown Id sản phẩm khi ở chế độ chọn sản phẩm có sẵn */}
                  {addMode === 'select' && (
                    <FormControl fullWidth size="small" sx={{mb:2}}>
                      <InputLabel>Id sản phẩm</InputLabel>
                      <Select
                        value={addIdSanPham || ''}
                        label="Id sản phẩm"
                        onChange={e => {
                          const id = e.target.value;
                          setAddIdSanPham(id);
                          const selected = products.find(p => String(p.idSanPham) === String(id));
                          if (selected) {
                            setAddMaSanPham(selected.maSanPham || '');
                            setAddTenSanPham(selected.tenSanPham || '');
                            setAddMoTa(selected.moTa || '');
                            setAddIdDanhMuc(selected.idDanhMuc ? String(selected.idDanhMuc) : '');
                            setAddIdThuongHieu(selected.idThuongHieu ? String(selected.idThuongHieu) : '');
                            setAddTrangThai(selected.trangThai || '');
                            setAddPreviewImg(selected.duongDanHinhAnh || '');
                          }
                        }}
                      >
                        <MenuItem value="">---</MenuItem>
                        {products.map(p => (
                          <MenuItem key={p.idSanPham} value={String(p.idSanPham)}>{p.idSanPham}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  )}
                  <TextField label="Mã sản phẩm" fullWidth size="small" sx={{mb:2}} value={addMaSanPham} onChange={e => { setMaSanPhamError(''); setAddMaSanPham(e.target.value); }} InputProps={{ readOnly: addMode === 'select' }} error={!!maSanPhamError} helperText={maSanPhamError} />
                  <TextField label="Tên sản phẩm" fullWidth size="small" sx={{mb:2}} value={addTenSanPham} onChange={e => { setTenSanPhamError(''); setAddTenSanPham(e.target.value); }} InputProps={{ readOnly: addMode === 'select' }} error={!!tenSanPhamError} helperText={tenSanPhamError} />
                  <TextField label="Mô tả" fullWidth size="small" multiline minRows={3} sx={{mb:2}} value={addMoTa} onChange={e=>setAddMoTa(e.target.value)} InputProps={{ readOnly: addMode === 'select' }} />
                  <FormControl fullWidth size="small" sx={{mb:2}} error={!!danhMucError}>
                    <InputLabel>Danh mục</InputLabel>
                    <Select value={addIdDanhMuc || ''} label="Danh mục" onChange={addMode === 'select' ? undefined : e=>setAddIdDanhMuc(e.target.value)}>
                      <MenuItem value="">---</MenuItem>
                      {danhMucs.map(dm => (
                        <MenuItem key={dm.idDanhMuc} value={String(dm.idDanhMuc)}>{dm.tenDanhMuc}</MenuItem>
                      ))}
                    </Select>
                    {danhMucError && <Typography color="error" fontSize={13} mt={0.5}>{danhMucError}</Typography>}
                  </FormControl>
                  <FormControl fullWidth size="small" sx={{mb:2}} error={!!thuongHieuError}>
                    <InputLabel>Thương hiệu</InputLabel>
                    <Select value={addIdThuongHieu || ''} label="Thương hiệu" onChange={addMode === 'select' ? undefined : e=>setAddIdThuongHieu(e.target.value)}>
                      <MenuItem value="">---</MenuItem>
                      {thuongHieus.map(th => (
                        <MenuItem key={th.idThuongHieu} value={String(th.idThuongHieu)}>{th.tenThuongHieu}</MenuItem>
                      ))}
                    </Select>
                    {thuongHieuError && <Typography color="error" fontSize={13} mt={0.5}>{thuongHieuError}</Typography>}
                  </FormControl>
                  <FormControl fullWidth size="small" sx={{mb:2}} error={!!trangThaiError}>
                    <InputLabel>Trạng thái</InputLabel>
                    <Select value={addTrangThai || ''} label="Trạng thái" onChange={addMode === 'select' ? undefined : e=>setAddTrangThai(e.target.value)}>
                      <MenuItem value="">---</MenuItem>
                      <MenuItem value="Đang bán">Đang bán</MenuItem>
                      <MenuItem value="Ngừng bán">Ngừng bán</MenuItem>
                    </Select>
                    {trangThaiError && <Typography color="error" fontSize={13} mt={0.5}>{trangThaiError}</Typography>}
                  </FormControl>
                  
                  {/* Thêm trường nhập giá và số lượng cho form thêm mới */}
                  <TextField 
                    label="Giá" 
                    fullWidth 
                    size="small" 
                    sx={{mb:2}} 
                    value={addGia} 
                    onChange={e => {
                      setAddGia(e.target.value);
                      if (e.target.value === '' || Number(e.target.value) <= 0) {
                        setAddGiaError('Giá phải lớn hơn 0');
                      } else {
                        setAddGiaError('');
                      }
                    }}
                    type="number"
                    error={!!addGiaError}
                    helperText={addGiaError}
                  />
                  <TextField 
                    label="Số lượng" 
                    fullWidth 
                    size="small" 
                    sx={{mb:2}} 
                    value={addSoLuong} 
                    onChange={e => {
                      setAddSoLuong(e.target.value);
                      if (e.target.value === '' || Number(e.target.value) <= 0) {
                        setAddSoLuongError('Số lượng phải lớn hơn 0');
                      } else {
                        setAddSoLuongError('');
                      }
                    }}
                    type="number"
                    error={!!addSoLuongError}
                    helperText={addSoLuongError}
                  />
                  
                  {/* Ẩn phần chọn ảnh đại diện khi tạo mới sản phẩm */}
                  {addMode === 'select' && (
                    <Box sx={{display:'flex', flexDirection:'column', alignItems:'center', mt:2}}>
                    </Box>
                  )}
                </Paper>
                {/* Cột phải: Bảng nhập từng biến thể */}
                {variantTableVisible && (
                  <Paper sx={{flex:1, minWidth:350, maxWidth:600, p:4, borderRadius:8, boxShadow:2, bgcolor:'#fafbfc', mb:2}} elevation={3}>
                    <TableContainer component={Paper} sx={{ mt: 0 }}>
                      <Table>
                        <TableHead>
                          <TableRow>
                            <TableCell>Màu sắc</TableCell>
                            <TableCell>Kích cỡ</TableCell>
                            <TableCell>Ảnh</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {variants.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={3} align="center" style={{ color: '#888', fontStyle: 'italic' }}>
                                Hãy chọn màu sắc và kích cỡ để tạo biến thể
                              </TableCell>
                            </TableRow>
                          ) : (
                            variants.map((v, idx) => (
                                                          <TableRow key={v.idMauSac + '-' + v.idKichCo}>
                              <TableCell>{mauSacs.find(ms => String(ms.idMauSac) === v.idMauSac)?.mauSac || v.idMauSac}</TableCell>
                              <TableCell>{kichCos.find(kc => String(kc.idKichCo) === v.idKichCo)?.kichCo || v.idKichCo}</TableCell>
                              <TableCell>
                                  <label style={{ display: 'block' }}>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      style={{ display: 'none' }}
                                      onChange={e => {
                                        const file = e.target.files?.[0] || null;
                                        if (!file) return;
                                        const preview = file ? URL.createObjectURL(file) : '';
                                        const currentMauSac = v.idMauSac;
                                        setVariants(prevVariants =>
                                          prevVariants.map((item, i) => {
                                            if (item.idMauSac === currentMauSac) {
                                              return {
                                                ...item,
                                                previewImg: preview,
                                                hinhAnh: idx === i ? file : item.hinhAnh
                                              };
                                            }
                                            // Luôn trả về object mới để React re-render
                                            return { ...item };
                                          })
                                        );
                                      }}
                                    />
                                    <Button variant="outlined" component="span" size="small">
                                      Chọn ảnh
                                    </Button>
                                  </label>
                                  {getPreviewImgForColor(v.idMauSac) && (
                                    <img src={getPreviewImgForColor(v.idMauSac)} alt="preview" style={{ width: 40, height: 40, marginTop: 4 }} />
                                  )}
                                  {!getPreviewImgForColor(v.idMauSac) && (
                                    <Typography color="error" fontSize={13}>Chọn ảnh</Typography>
                                  )}
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </Paper>
                )}
              </Box>
              {/* Chọn nhiều biến thể */}
              <Paper sx={{p:3, borderRadius:4, mb:3}} elevation={2}>
                <Typography fontWeight={600} mb={2}>Chọn màu sắc và kích cỡ</Typography>
                <Box sx={{display:'flex', gap:2, alignItems:'center', mb:2}}>
                  <FormControl size="small" sx={{minWidth:180}} error={!!mauSacError}>
                    <InputLabel>Chọn màu sắc</InputLabel>
                    <Select value={addMultiMauSac} label="màu sắc" multiple onChange={e=>setAddMultiMauSac(typeof e.target.value==='string'?e.target.value.split(','):e.target.value as string[])}>
                      {mauSacs.map(ms=>(<MenuItem key={ms.idMauSac} value={String(ms.idMauSac)}>{ms.mauSac}</MenuItem>))}
                    </Select>
                    {mauSacError && <Typography color="error" fontSize={13} mt={0.5}>{mauSacError}</Typography>}
                  </FormControl>
                  <FormControl size="small" sx={{minWidth:180}} error={!!kichCoError}>
                    <InputLabel>kích cỡ</InputLabel>
                    <Select value={addMultiKichCo} label="kích cỡ" multiple onChange={e=>setAddMultiKichCo(typeof e.target.value==='string'?e.target.value.split(','):e.target.value as string[])}>
                      {kichCos.map(kc=>(<MenuItem key={kc.idKichCo} value={String(kc.idKichCo)}>{kc.kichCo}</MenuItem>))}
                    </Select>
                    {kichCoError && <Typography color="error" fontSize={13} mt={0.5}>{kichCoError}</Typography>}
                  </FormControl>
                  <Button
                    variant="contained"
                    color="primary"
                    sx={{fontWeight:600, minWidth:140}}
                    onClick={() => {
                      // Gom lỗi vào object
                      const error: Record<string, string> = {};
                      if (!addMaSanPham.trim()) error.maSanPham = 'Vui lòng nhập mã sản phẩm!';
                      if (!addTenSanPham.trim()) error.tenSanPham = 'Vui lòng nhập tên sản phẩm!';
                      if (!addIdDanhMuc) error.danhMuc = 'Vui lòng chọn danh mục!';
                      if (!addIdThuongHieu) error.thuongHieu = 'Vui lòng chọn thương hiệu!';
                      if (!addTrangThai) error.trangThai = 'Vui lòng chọn trạng thái!';
                      if (addMultiMauSac.length === 0) error.mauSac = 'Vui lòng chọn ít nhất 1 màu sắc!';
                      if (addMultiKichCo.length === 0) error.kichCo = 'Vui lòng chọn ít nhất 1 kích cỡ!';
                      setMaSanPhamError(error.maSanPham || '');
                      setTenSanPhamError(error.tenSanPham || '');
                      setDanhMucError(error.danhMuc || '');
                      setThuongHieuError(error.thuongHieu || '');
                      setTrangThaiError(error.trangThai || '');
                      setMauSacError(error.mauSac || '');
                      setKichCoError(error.kichCo || '');
                      if (Object.keys(error).length > 0) {
                        setVariantError('');
                        setVariantTableVisible(false);
                        setVariants([]);
                        return;
                      }
                      setVariantError('');
                      setVariantTableVisible(true);
                      // Generate variants
                      const newVariants = [];
                      for (const mauSacId of addMultiMauSac) {
                        for (const kichCoId of addMultiKichCo) {
                          newVariants.push({
                            idMauSac: mauSacId,
                            idKichCo: kichCoId,
                            hinhAnh: null,
                            previewImg: ''
                          });
                        }
                      }
                      setVariants(newVariants);
                    }}
                  >
                    Tạo biến thể
                  </Button>
                </Box>
                {variantError && <Typography color="error" sx={{mb:1}}>{variantError}</Typography>}
              </Paper>
            </DialogContent>
            <DialogActions sx={{display:'flex', justifyContent:'space-between', mt:3}}>
              <Button variant="outlined" onClick={() => {
                setShowAddForm(false);
                setAddMode(null);
                setVariants([]);
                setVariantTableVisible(false);
                setAddMultiMauSac([]);
                setAddMultiKichCo([]);
                setMauSacError('');
                setKichCoError('');
                setMaSanPhamError('');
                setTenSanPhamError('');
                setDanhMucError('');
                setThuongHieuError('');
                setTrangThaiError('');
              }}>Hủy</Button>
              <Button variant="contained" color="primary" onClick={handleAddAll}>Thêm</Button>
            </DialogActions>
          </Dialog>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: 16,
              flexWrap: 'wrap', // Cho phép xuống dòng khi thiếu chỗ
              gap: 12
            }}
          >
            <div
              style={{
                display: 'flex',
                gap: 8,
                alignItems: 'center',
                marginLeft: 24,
                flexWrap: 'wrap', // Cho phép filter xuống dòng
                flex: 1,
                minWidth: 0
              }}
            >
              <TextField placeholder="Tìm kiếm sản phẩm" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} size="small" sx={{minWidth:220, background:'#fff'}} />
              <Select value={filterBrand} onChange={e => setFilterBrand(e.target.value)} displayEmpty size="small" sx={{minWidth:140, background:'#fff'}}>
                <MenuItem value="">--Thương hiệu--</MenuItem>
                {thuongHieus.map(th => (
                    <MenuItem key={th.idThuongHieu} value={th.tenThuongHieu}>{th.tenThuongHieu}</MenuItem>
                ))}
              </Select>
              <Select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} displayEmpty size="small" sx={{minWidth:140, background:'#fff'}}>
                <MenuItem value="">--Danh mục--</MenuItem>
                {danhMucs.map(dm => (
                    <MenuItem key={dm.idDanhMuc} value={dm.tenDanhMuc}>{dm.tenDanhMuc}</MenuItem>
                ))}
              </Select>
              <Select value={filterColor} onChange={e => setFilterColor(e.target.value)} displayEmpty size="small" sx={{minWidth:120, background:'#fff'}}>
                <MenuItem value="">--Màu sắc--</MenuItem>
                {mauSacs.map(ms => (
                    <MenuItem key={ms.idMauSac} value={ms.mauSac}>{ms.mauSac}</MenuItem>
                ))}
              </Select>
              <Select value={filterSize} onChange={e => setFilterSize(e.target.value)} displayEmpty size="small" sx={{minWidth:120, background:'#fff'}}>
                <MenuItem value="">--Kích cỡ--</MenuItem>
                {kichCos.map(kc => (
                    <MenuItem key={kc.idKichCo} value={kc.kichCo}>{kc.kichCo}</MenuItem>
                ))}
              </Select>
              <Select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)} displayEmpty size="small" sx={{minWidth:120, background:'#fff'}}>
                <MenuItem value="">--Trạng thái--</MenuItem>
                {uniqueStatus.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
              </Select>
              {(searchTerm || filterBrand || filterCategory || filterColor || filterSize || filterStatus) && (
                  <Button onClick={() => {
                    setSearchTerm('');
                    setFilterBrand('');
                    setFilterCategory('');
                    setFilterColor('');
                    setFilterSize('');
                    setFilterStatus('');
                    setPage(0);
                  }} variant="outlined" color="secondary" sx={{fontWeight:600}}>Xóa lọc</Button>
              )}
            </div>
            <div style={{ display: 'flex', gap: 12, marginLeft: 32 }}>
              <Button
                variant="contained"
                style={{
                  fontWeight: 700,
                  fontSize: 16,
                  borderRadius: 12,
                  background: '#b59d3a',
                  color: '#fff',
                  height: 44,
                  minWidth: 10,
                  padding: '0 16px',
                  boxShadow: '0 2px 8px #b59d3a22',
                  whiteSpace: 'nowrap',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10
                }}
                onClick={() => {
                  window.location.href = '/ChiTietSanPham/ThemChiTietSanPham';
                }}
              >
                <FaPlus style={{ fontSize: 18, marginRight: 6 }} />
                Thêm chi tiết sản phẩm
              </Button>
            </div>
          </div>
          <div style={{overflowX:'auto', background:'#fff', borderRadius:10, boxShadow:'0 2px 8px #b59d3a22'}}>
            <table style={{minWidth:1100, width:'100%', borderCollapse:'collapse', background:'#fff', fontSize:15, lineHeight:1.4}}>
              <thead>
              <tr>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>STT</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Mã sản phẩm</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Tên sản phẩm</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Thương hiệu</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Danh mục</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Màu sắc</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Kích cỡ</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Hình ảnh</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Giá</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Số lượng</th>
                <th style={{padding:'6px 8px', minWidth:90, maxWidth:110, whiteSpace:'nowrap', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Trạng thái</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Mô tả</th>
                <th style={{padding:'6px 8px', fontWeight: 700, textAlign: "left", fontSize: "0.9rem", borderBottom: "2px solid "}}>Thao tác</th>
              </tr>
              </thead>
              <tbody>
              {pagedDetails.map((detail, idx) => (
                  <tr
                      key={detail.idChiTietSanPham}
                      style={{
                        color: '#222',
                      }}
                  >
                    <td style={{padding:'6px 8px', textAlign:'center'}}>{detail.idChiTietSanPham}</td>
                    <td style={{padding:'6px 8px'}}>{detail.maSanPham}</td>
                    <td style={{padding:'6px 8px'}}>{detail.tenSanPham}</td>
                    <td style={{padding:'6px 8px'}}>{detail.tenThuongHieu}</td>
                    <td style={{padding:'6px 8px'}}>{detail.tenDanhMuc}</td>
                    <td style={{padding:'6px 8px'}}>{detail.tenMauSac}</td>
                    <td style={{padding:'6px 8px'}}>{detail.tenKichCo}</td>
                    <td style={{padding:'6px 8px', textAlign:'center'}}>
                      {detail.duongDanHinhAnh && detail.duongDanHinhAnh.trim() ? (
                          <img
                              src={detail.duongDanHinhAnh.startsWith('/images/')
                                  ? `http://localhost:8080${detail.duongDanHinhAnh}`
                                  : detail.duongDanHinhAnh.startsWith('http')
                                    ? detail.duongDanHinhAnh
                                    : `http://localhost:8080/hinh-anh/view/${detail.duongDanHinhAnh.replace(/^.*[\\/]/, '')}`}
                              alt="Hình ảnh"
                              style={{width:40, height:40, objectFit:'contain', borderRadius:6, border:'1px solid #eee', background:'#fafafa'}}
                          />
                      ) : (
                          <span style={{color:'#aaa'}}>Hình ảnh</span>
                      )}
                    </td>
                    <td style={{padding:'6px 8px', textAlign:'right'}}>{detail.gia?.toLocaleString('vi-VN')}đ</td>
                    <td style={{padding:'6px 8px', textAlign:'center'}}>{detail.soLuong}</td>
                    <td style={{padding:'6px 8px', textAlign:'center', minWidth:90, maxWidth:110, whiteSpace:'nowrap'}}>
                      <span style={{color: detail.trangThai === 'Đang bán' ? '#388e3c' : '#d32f2f', fontWeight:600, fontSize:15, letterSpacing:0.2}}>{detail.trangThai}</span>
                    </td>
                    <td style={{padding:'6px 8px'}}>{detail.moTa}</td>
                    <td style={{padding:'6px 8px', textAlign:'center'}}>
                      <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                        <button
                          style={{
                            background: "#3498db",
                            color: "black",
                            border: "none",
                            borderRadius: 6,
                            padding: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 15,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 4
                          }}
                          title="Xem chi tiết"
                          onClick={() => { setDetailData(detail); setOpenDetail(true); }}
                        >
                          <FaEye style={{ fontSize: 15 }} />
                        </button>
                        <button
                          style={{
                            background: "#f1c40f",
                            color: "#222",
                            border: "none",
                            borderRadius: 6,
                            padding: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 15,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center",
                            marginRight: 4
                          }}
                          title="Sửa"
                          onClick={() => {
                            setEditDetail(detail);
                            setEditForm({
                              ...detail,
                              idSanPham: detail.idSanPham,
                              idThuongHieu: thuongHieus.find(th => th.tenThuongHieu === detail.tenThuongHieu)?.idThuongHieu ? String(thuongHieus.find(th => th.tenThuongHieu === detail.tenThuongHieu)?.idThuongHieu) : '',
                              idDanhMuc: danhMucs.find(dm => dm.tenDanhMuc === detail.tenDanhMuc)?.idDanhMuc ? String(danhMucs.find(dm => dm.tenDanhMuc === detail.tenDanhMuc)?.idDanhMuc) : '',
                              idMauSac: mauSacs.find(ms => ms.mauSac === detail.tenMauSac)?.idMauSac ? String(mauSacs.find(ms => ms.mauSac === detail.tenMauSac)?.idMauSac) : '',
                              idKichCo: kichCos.find(kc => kc.kichCo === detail.tenKichCo)?.idKichCo ? String(kichCos.find(kc => kc.kichCo === detail.tenKichCo)?.idKichCo) : '',
                            });
                            setPreviewImg("");
                          }}
                        >
                          <FaEdit style={{ fontSize: 15 }} />
                        </button>
                        <button
                          style={{
                            background: detail.trangThai === "Đang bán" ? "#2ecc40" : "#e74c3c",
                            color: "#fff",
                            border: "none",
                            borderRadius: 6,
                            padding: 6,
                            cursor: "pointer",
                            fontWeight: 600,
                            fontSize: 15,
                            display: "inline-flex",
                            alignItems: "center",
                            justifyContent: "center"
                          }}
                          title={detail.trangThai === "Đang bán" ? "Ngừng bán" : "Kích hoạt lại"}
                          onClick={() => handleToggleStatus(detail)}
                        >
                          <FaPowerOff style={{ fontSize: 15 }} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div style={{display:'flex',justifyContent:'center',alignItems:'center',gap:8,margin:'18px 0'}}>
            <Button onClick={()=>handlePageChange(page-1)} disabled={page===0} variant="outlined" sx={{borderRadius:6, minWidth:80}} style={{color:'#222'}}>Trước</Button>
            {Array.from({length: totalPages}, (_,i)=>(
                <Button key={i} onClick={()=>handlePageChange(i)} disabled={i===page} variant={i===page?'contained':'outlined'} sx={{borderRadius:6, minWidth:40, fontWeight:700}} style={{color:'#222'}}>{i+1}</Button>
            ))}
            <Button onClick={()=>handlePageChange(page+1)} disabled={page===totalPages-1} variant="outlined" sx={{borderRadius:6, minWidth:80}} style={{color:'#222'}}>Sau</Button>
          </div>
          {/* Modal chi tiết sản phẩm */}
          <Dialog open={openDetail} onClose={()=>setOpenDetail(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{textAlign:'center', fontWeight:700, fontSize:24}}>Chi tiết sản phẩm</DialogTitle>
            <DialogContent>
              {detailData && (
                  <Box sx={{display:'flex', flexDirection:{xs:'column',sm:'row'}, gap:4, alignItems:'flex-start', justifyContent:'center', mt:2}}>
                    {/* Thông tin bên trái */}
                    <Box sx={{flex:1, minWidth:220}}>
                      <Box sx={{mb:1}}><b>ID:</b> <span>{detailData.idChiTietSanPham}</span></Box>
                      <Box sx={{mb:1}}><b>Mã SP:</b> <span>{detailData.maSanPham}</span></Box>
                      <Box sx={{mb:1}}><b>Tên SP:</b> <span>{detailData.tenSanPham}</span></Box>
                      <Box sx={{mb:1}}><b>Thương hiệu:</b> <span>{detailData.tenThuongHieu}</span></Box>
                      <Box sx={{mb:1}}><b>Danh mục:</b> <span>{detailData.tenDanhMuc}</span></Box>
                      <Box sx={{mb:1}}><b>Màu sắc:</b> <span>{detailData.tenMauSac}</span></Box>
                      <Box sx={{mb:1}}><b>Kích cỡ:</b> <span>{detailData.tenKichCo}</span></Box>
                      <Box sx={{mb:1}}><b>Giá:</b> <span style={{color:'#1976d2', fontWeight:600}}>{detailData.gia?.toLocaleString('vi-VN')}đ</span></Box>
                      <Box sx={{mb:1}}><b>Số lượng:</b> <span>{detailData.soLuong}</span></Box>
                      <Box sx={{mb:1}}><b>Trạng thái:</b> <span style={{color: detailData.trangThai === 'Đang bán' ? '#388e3c' : '#d32f2f', fontWeight:600}}>{detailData.trangThai}</span></Box>
                      <Box sx={{mb:1}}><b>Mô tả:</b> <span>{detailData.moTa}</span></Box>
                    </Box>
                    {/* Ảnh bên phải */}
                    <Box sx={{flex:1, display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center'}}>
                      {detailData.duongDanHinhAnh && detailData.duongDanHinhAnh.trim() ? (
                          <img
                              src={detailData.duongDanHinhAnh.startsWith('/images/')
                                  ? `http://localhost:8080${detailData.duongDanHinhAnh}`
                                  : detailData.duongDanHinhAnh.startsWith('http')
                                    ? detailData.duongDanHinhAnh
                                    : `http://localhost:8080/hinh-anh/view/${detailData.duongDanHinhAnh.replace(/^.*[\\/]/, '')}`}
                              alt="Hình ảnh"
                              style={{width:180, height:180, objectFit:'contain', borderRadius:12, border:'1px solid #eee', background:'#fafafa', boxShadow:'0 2px 8px #0001', marginTop:8}}
                          />
                      ) : (
                          <Box sx={{width:180, height:180, border:'1px dashed #ccc', borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', color:'#aaa', mt:1}}>
                            Không có ảnh
                          </Box>
                      )}
                    </Box>
                  </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setOpenDetail(false)} color="primary">ĐÓNG</Button>
            </DialogActions>
          </Dialog>
          {/* Modal sửa sản phẩm */}
          <Dialog open={!!editDetail} onClose={()=>setEditDetail(null)} maxWidth="sm" fullWidth>
            <DialogTitle>Sửa chi tiết sản phẩm</DialogTitle>
            <DialogContent>
              {editForm && (
                  <Box component="form" sx={{mt:2}}>
                    <TextField label="Mã SP" value={editForm.maSanPham} onChange={e=>setEditForm((f:any)=>({...f, maSanPham:e.target.value}))} fullWidth sx={{mb:2}} onBlur={e=>checkMaSanPhamTrung(e.target.value)} error={!!maSanPhamError} helperText={maSanPhamError} />
                    <TextField label="Tên SP" value={editForm.tenSanPham} onChange={e=>setEditForm((f:any)=>({...f, tenSanPham:e.target.value}))} fullWidth sx={{mb:2}} />
                    <FormControl fullWidth size="small" sx={{mb:2}}>
                      <InputLabel>Thương hiệu</InputLabel>
                      <Select
                          value={editForm.idThuongHieu || ''}
                          label="Thương hiệu"
                          onChange={e => setEditForm((f:any) => ({...f, idThuongHieu: e.target.value}))}
                      >
                        <MenuItem value="">---</MenuItem>
                        {thuongHieus.map(th => (
                            <MenuItem key={th.idThuongHieu} value={String(th.idThuongHieu)}>
                              {th.tenThuongHieu}
                            </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{mb:2}}>
                      <InputLabel>Danh mục</InputLabel>
                      <Select
                          value={editForm.idDanhMuc || ''}
                          label="Danh mục"
                          onChange={e => setEditForm((f:any) => ({...f, idDanhMuc: e.target.value}))}
                      >
                        <MenuItem value="">---</MenuItem>
                        {danhMucs.map(dm => (
                            <MenuItem key={dm.idDanhMuc} value={String(dm.idDanhMuc)}>
                              {dm.tenDanhMuc}
                            </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{mb:2}}>
                      <InputLabel>Màu sắc</InputLabel>
                      <Select
                          value={editForm.idMauSac || ''}
                          label="Màu sắc"
                          onChange={e => setEditForm((f:any) => ({...f, idMauSac: e.target.value}))}
                      >
                        <MenuItem value="">---</MenuItem>
                        {mauSacs.map(ms => (
                            <MenuItem key={ms.idMauSac} value={String(ms.idMauSac)}>
                              {ms.mauSac}
                            </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <FormControl fullWidth size="small" sx={{mb:2}}>
                      <InputLabel>Kích cỡ</InputLabel>
                      <Select
                          value={editForm.idKichCo || ''}
                          label="Kích cỡ"
                          onChange={e => setEditForm((f:any) => ({...f, idKichCo: e.target.value}))}
                      >
                        <MenuItem value="">---</MenuItem>
                        {kichCos.map(kc => (
                            <MenuItem key={kc.idKichCo} value={String(kc.idKichCo)}>
                              {kc.kichCo}
                            </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <TextField label="Giá" value={editForm.gia} onChange={e=>setEditForm((f:any)=>({...f, gia:e.target.value}))} fullWidth sx={{mb:2}} type="number" />
                    <TextField label="Số lượng" value={editForm.soLuong} onChange={e=>setEditForm((f:any)=>({...f, soLuong:e.target.value}))} fullWidth sx={{mb:2}} type="number" />
                    <FormControl fullWidth size="small" sx={{mb:2}}>
                      <InputLabel>Trạng thái</InputLabel>
                      <Select
                          value={editForm.trangThai || ''}
                          label="Trạng thái"
                          onChange={e => setEditForm((f:any) => ({...f, trangThai: e.target.value}))}
                      >
                        <MenuItem value="">---</MenuItem>
                        <MenuItem value="Đang bán">Đang bán</MenuItem>
                        <MenuItem value="Ngừng bán">Ngừng bán</MenuItem>
                      </Select>
                    </FormControl>
                    <TextField label="Mô tả" value={editForm.moTa} onChange={e=>setEditForm((f:any)=>({...f, moTa:e.target.value}))} fullWidth sx={{mb:2}} multiline minRows={2} />
                    {/* Upload ảnh */}
                    <Box sx={{mb:2}}>
                      <input type="file" accept="image/*" onChange={handleUploadImg} />
                      {uploadingImg && <CircularProgress size={18} sx={{ml:2}} />}
                      {uploadImgError && <Alert severity="error">{uploadImgError}</Alert>}
                      {previewImg ? (
                          <img src={previewImg} alt="Preview" style={{width:60, height:60, objectFit:'contain', borderRadius:6, border:'1px solid #eee', background:'#fafafa', marginTop:8}} />
                      ) : (
                          editForm?.duongDanHinhAnh && (
                              <img
                                  src={editForm.duongDanHinhAnh.startsWith('/images/')
                                      ? `http://localhost:8080${editForm.duongDanHinhAnh}`
                                      : editForm.duongDanHinhAnh.startsWith('http')
                                        ? editForm.duongDanHinhAnh
                                        : `http://localhost:8080/hinh-anh/view/${editForm.duongDanHinhAnh.replace(/^.*[\\/]/, '')}`}
                                  alt="Ảnh hiện tại"
                                  style={{width:60, height:60, objectFit:'contain', borderRadius:6, border:'1px solid #eee', background:'#fafafa', marginTop:8, marginRight:8}}
                              />
                          )
                      )}
                    </Box>
                  </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setEditDetail(null)} disabled={editLoading}>Hủy</Button>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={handleSaveEdit}
                disabled={editLoading}
              >
                {editLoading ? 'Đang lưu...' : 'Lưu'}
              </Button>
            </DialogActions>
          </Dialog>
          {/* Modal quick add danh mục */}
          <Dialog open={openAddDanhMuc} onClose={()=>setOpenAddDanhMuc(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Thêm danh mục mới</DialogTitle>
            <DialogContent>
              {addDanhMucError && <Alert severity="error" sx={{mb:2}}>{addDanhMucError}</Alert>}
              {addDanhMucSuccess && <Alert severity="success" sx={{mb:2}}>{addDanhMucSuccess}</Alert>}
              <TextField label="Tên danh mục" fullWidth value={tenDanhMucMoi} onChange={e=>setTenDanhMucMoi(e.target.value)} sx={{mb:2}} />
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setOpenAddDanhMuc(false)} variant="outlined">Hủy</Button>
              <Button onClick={handleAddDanhMuc} variant="contained">Thêm</Button>
            </DialogActions>
          </Dialog>
          {/* Modal quick add thương hiệu */}
          <Dialog open={openAddThuongHieu} onClose={()=>setOpenAddThuongHieu(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Thêm thương hiệu mới</DialogTitle>
            <DialogContent>
              {addThuongHieuError && <Alert severity="error" sx={{mb:2}}>{addThuongHieuError}</Alert>}
              {addThuongHieuSuccess && <Alert severity="success" sx={{mb:2}}>{addThuongHieuSuccess}</Alert>}
              <TextField label="Tên thương hiệu" fullWidth value={tenThuongHieuMoi} onChange={e=>setTenThuongHieuMoi(e.target.value)} sx={{mb:2}} />
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setOpenAddThuongHieu(false)} variant="outlined">Hủy</Button>
              <Button onClick={handleAddThuongHieu} variant="contained">Thêm</Button>
            </DialogActions>
          </Dialog>
          {/* Modal quick add màu sắc */}
          <Dialog open={openAddMauSac} onClose={()=>setOpenAddMauSac(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Thêm màu sắc mới</DialogTitle>
            <DialogContent>
              {addMauSacError && <Alert severity="error" sx={{mb:2}}>{addMauSacError}</Alert>}
              {addMauSacSuccess && <Alert severity="success" sx={{mb:2}}>{addMauSacSuccess}</Alert>}
              <TextField label="Tên màu sắc" fullWidth value={tenMauSacMoi} onChange={e=>setTenMauSacMoi(e.target.value)} sx={{mb:2}} />
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setOpenAddMauSac(false)} variant="outlined">Hủy</Button>
              <Button onClick={handleAddMauSac} variant="contained">Thêm</Button>
            </DialogActions>
          </Dialog>
          {/* Modal quick add kích cỡ */}
          <Dialog open={openAddKichCo} onClose={()=>setOpenAddKichCo(false)} maxWidth="xs" fullWidth>
            <DialogTitle>Thêm kích cỡ mới</DialogTitle>
            <DialogContent>
              {addKichCoError && <Alert severity="error" sx={{mb:2}}>{addKichCoError}</Alert>}
              {addKichCoSuccess && <Alert severity="success" sx={{mb:2}}>{addKichCoSuccess}</Alert>}
              <TextField label="Tên kích cỡ" fullWidth value={tenKichCoMoi} onChange={e=>setTenKichCoMoi(e.target.value)} sx={{mb:2}} />
            </DialogContent>
            <DialogActions>
              <Button onClick={()=>setOpenAddKichCo(false)} variant="outlined">Hủy</Button>
              <Button onClick={handleAddKichCo} variant="contained">Thêm</Button>
            </DialogActions>
          </Dialog>
          {/* Alert/thông báo động */}
          {addDanhMucSuccess && <Alert severity="success" sx={{mb:2}}>{addDanhMucSuccess}</Alert>}
          {addThuongHieuSuccess && <Alert severity="success" sx={{mb:2}}>{addThuongHieuSuccess}</Alert>}
          {addMauSacSuccess && <Alert severity="success" sx={{mb:2}}>{addMauSacSuccess}</Alert>}
          {addKichCoSuccess && <Alert severity="success" sx={{mb:2}}>{addKichCoSuccess}</Alert>}
          <Snackbar
            open={snackbar.open}
            autoHideDuration={4000}
            onClose={handleCloseSnackbar}
            anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
          >
            <MuiAlert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
              {snackbar.message}
            </MuiAlert>
          </Snackbar>
        </div>
      </div>
  );
} 