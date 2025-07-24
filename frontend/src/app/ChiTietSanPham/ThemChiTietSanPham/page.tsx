"use client";
import React, { useState, useEffect } from 'react';
import { Box, Button, TextField, Select, MenuItem, InputLabel, FormControl, Typography, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Snackbar, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useRouter } from 'next/navigation';
import { FaPlus, FaTimes } from 'react-icons/fa';

export default function ThemChiTietSanPhamPage() {
  // --- State và logic copy từ modal cũ ---
  const [addMode, setAddMode] = useState<'new' | 'select' | null>('select');
  const [products, setProducts] = useState<any[]>([]);
  const [danhMucs, setDanhMucs] = useState<any[]>([]);
  const [thuongHieus, setThuongHieus] = useState<any[]>([]);
  const [mauSacs, setMauSacs] = useState<any[]>([]);
  const [kichCos, setKichCos] = useState<any[]>([]);

  const [addIdSanPham, setAddIdSanPham] = useState('');
  const [addMaSanPham, setAddMaSanPham] = useState('');
  const [addTenSanPham, setAddTenSanPham] = useState('');
  const [addMoTa, setAddMoTa] = useState('');
  const [addIdDanhMuc, setAddIdDanhMuc] = useState('');
  const [addIdThuongHieu, setAddIdThuongHieu] = useState('');
  const [addTrangThai, setAddTrangThai] = useState('');
  const [addMultiMauSac, setAddMultiMauSac] = useState<string[]>([]);
  const [addMultiKichCo, setAddMultiKichCo] = useState<string[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [showVariants, setShowVariants] = useState(false);

  // Error state
  const [maSanPhamError, setMaSanPhamError] = useState('');
  const [tenSanPhamError, setTenSanPhamError] = useState('');
  const [danhMucError, setDanhMucError] = useState('');
  const [thuongHieuError, setThuongHieuError] = useState('');
  const [trangThaiError, setTrangThaiError] = useState('');
  const [mauSacError, setMauSacError] = useState('');
  const [kichCoError, setKichCoError] = useState('');
  const [variantError, setVariantError] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  // Dialog state
  const [openAddDialog, setOpenAddDialog] = useState<{type: string, open: boolean}>({type: '', open: false});
  const [newValue, setNewValue] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');

  // Thêm state lưu lỗi cho từng biến thể
  const [variantErrors, setVariantErrors] = useState<{[key: string]: string}>({});
  const [showVariantErrors, setShowVariantErrors] = useState(false);

  // State cho modal thuộc tính chung
  const [openCommonAttrModal, setOpenCommonAttrModal] = useState(false);
  const [commonSoLuong, setCommonSoLuong] = useState('');
  const [commonGia, setCommonGia] = useState('');
  const [commonError, setCommonError] = useState('');

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

  // Hàm thêm chi tiết sản phẩm
  const handleAddAll = async () => {
    setShowVariantErrors(true);
    if (variants.length === 0) {
      setSnackbar({ open: true, message: 'Bạn phải tạo ít nhất 1 biến thể!', severity: 'error' });
      return;
    }
    // Kiểm tra từng biến thể
    const errors: {[key: string]: string} = {};
    variants.forEach((v) => {
      let err = '';
      if (!v.soLuong || isNaN(Number(v.soLuong))) err += 'Chưa nhập số lượng. ';
      else if (Number(v.soLuong) <= 0) err += 'Số lượng phải > 0. ';
      if (!v.gia || isNaN(Number(v.gia))) err += 'Chưa nhập giá. ';
      else if (Number(v.gia) <= 0) err += 'Giá phải > 0. ';
      if (!v.hinhAnh) err += 'Chọn ảnh.';
      if (err) errors[v.idMauSac + '-' + v.idKichCo] = err;
    });
    setVariantErrors(errors);
    if (Object.keys(errors).length > 0) return;

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
        })
      });
      const data = await res.json();
      if (!res.ok || !data.idSanPham) {
        setSnackbar({ open: true, message: data.message || 'Lỗi tạo sản phẩm!', severity: 'error' });
        return;
      }
      idSanPham = String(data.idSanPham);
    }
    // Tạo các biến thể
    for (const v of variants) {
      let idHinhAnh = null;
      if (v.hinhAnh) {
        const formData = new FormData();
        formData.append('file', v.hinhAnh);
        const res = await fetch('http://localhost:8080/hinh-anh/upload', { method: 'POST', body: formData });
        const data = await res.json();
        idHinhAnh = data.idHinhAnh;
      }
      const res = await fetch('http://localhost:8080/chi-tiet-san-pham/them', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          idSanPham,
          idMauSac: v.idMauSac,
          idKichCo: v.idKichCo,
          soLuong: v.soLuong,
          gia: v.gia,
          idHinhAnh,
          trangThai: 'Đang bán'
        })
      });
      if (!res.ok) {
        let data;
        try {
          data = await res.json();
        } catch {
          data = await res.text();
        }
        setSnackbar({ open: true, message: (data && data.message) ? data.message : (typeof data === 'string' ? data : 'Lỗi khi thêm chi tiết sản phẩm!'), severity: 'error' });
        return; // Dừng thêm tiếp nếu có lỗi
      }
    }
    setSnackbar({ open: true, message: 'Thêm sản phẩm và biến thể thành công!', severity: 'success' });
    // Reset form nếu cần
    setTimeout(() => {
      router.push('/ChiTietSanPham?reload=' + Date.now());
    }, 1000);
  };

  // Hàm thêm sản phẩm cha
  const handleCreateProduct = async () => {
    let hasError = false;
    if (!addIdDanhMuc || addIdDanhMuc === '') {
      setDanhMucError('Vui lòng chọn danh mục!');
      hasError = true;
    }
    if (!addIdThuongHieu || addIdThuongHieu === '') {
      setThuongHieuError('Vui lòng chọn thương hiệu!');
      hasError = true;
    }
    if (!addTrangThai || addTrangThai === '') {
      setTrangThaiError('Vui lòng chọn trạng thái!');
      hasError = true;
    }
    if (!addMaSanPham) {
      setMaSanPhamError('Vui lòng nhập mã sản phẩm!');
      hasError = true;
    }
    if (!addTenSanPham) {
      setTenSanPhamError('Vui lòng nhập tên sản phẩm!');
      hasError = true;
    }
    if (hasError) return;

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
      if (!res.ok || !data.idSanPham) {
        // Nếu lỗi là trùng mã sản phẩm
        if (
            (data.message && data.message.toLowerCase().includes('duplicate')) ||
            (data.message && data.message.toLowerCase().includes('tồn tại')) ||
            (data.message && data.message.toLowerCase().includes('trùng'))
        ) {
          setMaSanPhamError('Mã sản phẩm đã tồn tại!');
          return; // KHÔNG show snackbar nữa
        }
        setSnackbar({ open: true, message: data.message || 'Lỗi tạo sản phẩm!', severity: 'error' });
        return;
      }
      // Fetch lại danh sách sản phẩm và auto chọn sản phẩm vừa tạo
      const res2 = await fetch('http://localhost:8080/san-pham/hien-thi');
      const productsData = await res2.json();
      setProducts(productsData);
      setAddIdSanPham(String(data.idSanPham));
      setAddMode('select');
      setSnackbar({ open: true, message: 'Tạo sản phẩm thành công!', severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Lỗi tạo sản phẩm!', severity: 'error' });
    }
  };

  // Validate mã sản phẩm khi nhập
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

  // Hàm mở dialog
  const handleOpenAddDialog = (type: string) => {
    setOpenAddDialog({type, open: true});
    setNewValue('');
    setAddError('');
  };
  const handleCloseAddDialog = () => {
    setOpenAddDialog({type: '', open: false});
    setNewValue('');
    setAddError('');
  };
  // Hàm thêm mới
  const handleAddNew = async () => {
    if (!newValue.trim()) {
      setAddError('Vui lòng nhập tên!');
      return;
    }
    setAddLoading(true);
    let url = '', body = {};
    if (openAddDialog.type === 'danhmuc') {
      url = 'http://localhost:8080/danh-muc/them';
      body = { tenDanhMuc: newValue };
    } else if (openAddDialog.type === 'thuonghieu') {
      url = 'http://localhost:8080/thuong-hieu/them';
      body = { tenThuongHieu: newValue };
    } else if (openAddDialog.type === 'mausac') {
      url = 'http://localhost:8080/mau-sac/them';
      body = { mauSac: newValue };
    } else if (openAddDialog.type === 'kichco') {
      url = 'http://localhost:8080/kich-co/them';
      body = { kichCo: newValue };
    } else if (openAddDialog.type === 'trangthai') {
      url = 'http://localhost:8080/trang-thai/them'; // Thêm trạng thái
      body = { tenTrangThai: newValue };
    }
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error('Lỗi khi thêm mới!');
      // Reload lại danh sách
      if (openAddDialog.type === 'danhmuc') {
        const res = await fetch('http://localhost:8080/danh-muc/hien-thi');
        setDanhMucs(await res.json());
      } else if (openAddDialog.type === 'thuonghieu') {
        const res = await fetch('http://localhost:8080/thuong-hieu/hien-thi');
        setThuongHieus(await res.json());
      } else if (openAddDialog.type === 'mausac') {
        const res = await fetch('http://localhost:8080/mau-sac/hien-thi');
        setMauSacs(await res.json());
      } else if (openAddDialog.type === 'kichco') {
        const res = await fetch('http://localhost:8080/kich-co/hien-thi');
        setKichCos(await res.json());
      } else if (openAddDialog.type === 'trangthai') {
        const res = await fetch('http://localhost:8080/trang-thai/hien-thi');
        setDanhMucs(await res.json()); // Danh mục cũng là trạng thái
      }
      setSnackbar({ open: true, message: 'Thêm mới thành công!', severity: 'success' });
      handleCloseAddDialog();
    } catch (e) {
      setAddError('Lỗi khi thêm mới!');
    } finally {
      setAddLoading(false);
    }
  };

  // Thêm hàm kiểm tra biến thể hợp lệ
  const isAllVariantsValid = variants.length > 0 && variants.every(v => v.soLuong && v.gia && v.hinhAnh);

  // Tự động sinh biến thể khi đủ thông tin
  useEffect(() => {
    // Kiểm tra đủ thông tin sản phẩm, màu sắc, kích cỡ
    const valid =
        addMaSanPham.trim() &&
        addTenSanPham.trim() &&
        addIdDanhMuc &&
        addIdThuongHieu &&
        addTrangThai &&
        addMultiMauSac.length > 0 &&
        addMultiKichCo.length > 0;
    if (valid) {
      // Sinh variants
      const newVariants = [];
      for (const mauSacId of addMultiMauSac) {
        for (const kichCoId of addMultiKichCo) {
          newVariants.push({
            idMauSac: mauSacId,
            idKichCo: kichCoId,
            soLuong: '',
            gia: '',
            hinhAnh: null,
            previewImg: ''
          });
        }
      }
      setVariants(newVariants);
      setShowVariants(true);
      setVariantError('');
    } else {
      setVariants([]);
      setShowVariants(false);
    }
  }, [addMaSanPham, addTenSanPham, addIdDanhMuc, addIdThuongHieu, addTrangThai, addMultiMauSac, addMultiKichCo]);

  // --- Giao diện như modal cũ nhưng là trang riêng ---
  const router = useRouter();
  // CustomBannerAlert: Banner lớn, căn giữa trên cùng, không icon, không Alert MUI
  function CustomBannerAlert({ open, message, severity, onClose }: { open: boolean, message: string, severity: 'success' | 'error', onClose: () => void }) {
    if (!open) return null;
    return (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 32,
          left: 'auto',
          transform: 'none',
          zIndex: 1300,
          background: severity === 'success' ? '#22c55e' : '#ef4444',
          color: '#fff',
          padding: '10px 22px',
          borderRadius: 8,
          fontWeight: 600,
          fontSize: 16,
          minWidth: 220,
          maxWidth: '60vw',
          textAlign: 'left',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-start',
          gap: 10,
          boxShadow: 'none',
          border: 'none'
        }}>
          <span style={{flex:1}}>{message}</span>
          <button onClick={onClose} style={{
            background:'none',
            border:'none',
            color:'#fff',
            fontSize:20,
            fontWeight:900,
            cursor:'pointer',
            marginLeft:8
          }}>×</button>
        </div>
    );
  }
  // Tự động ẩn banner sau 4s
  React.useEffect(() => {
    if (snackbar.open) {
      const t = setTimeout(() => setSnackbar(s => ({...s, open: false})), 4000);
      return () => clearTimeout(t);
    }
  }, [snackbar.open]);

  const numberInputNoSpinnerSx = {
    '& input[type=number]::-webkit-outer-spin-button, & input[type=number]::-webkit-inner-spin-button': {
      WebkitAppearance: 'none',
      margin: 0,
    },
    '& input[type=number]': {
      MozAppearance: 'textfield',
    },
    '& .MuiOutlinedInput-root': {
      '&.Mui-focused fieldset': {
        borderColor: '#bdbdbd',
      },
    },
    '& label.Mui-focused': {
      color: '#757575',
    },
  };
  return (
      <Box sx={{background:'#fffbe6', minHeight:'100vh', pt:2, px:2}}>
        <Box sx={{maxWidth:1400, mx:'auto', background:'#fffbe6'}}>
          <Typography variant="h4" fontWeight={700} mb={3} color="#2c2c2c" textAlign="center">Thêm chi tiết sản phẩm</Typography>
          <Box sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            gap: 6,
            alignItems: 'stretch',
            justifyContent: 'flex-start',
            mb: 2,
            pl: { xs: 0, md: 2 }
          }}>
            {/* Cột trái: Thông tin sản phẩm cha */}
            <Paper sx={{
              flex: '0 0 380px',
              minWidth: 320,
              maxWidth: 400,
              p: 4,
              borderRadius: 4,
              boxShadow: 3,
              bgcolor: '#fff',
              mb: { xs: 3, md: 0 },
              alignSelf: 'stretch',
              minHeight: 520,
              pt: 2
            }} elevation={3}>
              <Box sx={{display:'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent:'flex-end', mb:2, gap:{ xs:1.5, md:1 }, width: '100%'}}>
                <Button
                    variant="contained"
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: 10,
                      minWidth: 120,
                      maxWidth: '100%',
                      height: 44,
                      background: addMode === 'new' ? '#b59d3a' : '#fff',
                      color: addMode === 'new' ? '#fff' : '#b59d3a',
                      border: `2px solid #b59d3a`,
                      boxShadow: 'none',
                      marginRight: 0,
                      marginBottom: 10,
                      transition: 'all 0.2s',
                      whiteSpace: 'normal',
                      padding: '0 18px',
                      textAlign: 'center',
                      overflowWrap: 'break-word',
                    }}
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
                  TẠO MỚI SẢN PHẨM
                </Button>
                <Button
                    variant="contained"
                    style={{
                      fontWeight: 600,
                      fontSize: 13,
                      borderRadius: 10,
                      minWidth: 120,
                      maxWidth: '100%',
                      height: 44,
                      background: addMode === 'select' ? '#b59d3a' : '#fff',
                      color: addMode === 'select' ? '#fff' : '#b59d3a',
                      border: `2px solid #b59d3a`,
                      boxShadow: 'none',
                      transition: 'all 0.2s',
                      whiteSpace: 'normal',
                      padding: '0 18px',
                      textAlign: 'center',
                      overflowWrap: 'break-word',
                    }}
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
                      }
                    }}
                >
                  CHỌN SẢN PHẨM CÓ SẴN
                </Button>
              </Box>
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
              <TextField label="Mã sản phẩm" fullWidth size="small" sx={{mb:2}} value={addMaSanPham}
                         onChange={e => {
                           setMaSanPhamError('');
                           setAddMaSanPham(e.target.value);
                           checkMaSanPhamTrung(e.target.value);
                         }}
                         InputProps={{ readOnly: addMode === 'select' }}
                         error={!!maSanPhamError}
                         helperText={maSanPhamError}
              />
              <TextField label="Tên sản phẩm" fullWidth size="small" sx={{mb:2}} value={addTenSanPham} onChange={e => { setTenSanPhamError(''); setAddTenSanPham(e.target.value); }} InputProps={{ readOnly: addMode === 'select' }} error={!!tenSanPhamError} helperText={tenSanPhamError} />
              <TextField label="Mô tả" fullWidth size="small" multiline minRows={3} sx={{mb:2}} value={addMoTa} onChange={e=>setAddMoTa(e.target.value)} InputProps={{ readOnly: addMode === 'select' }} />
              {/* Danh mục */}
              <FormControl fullWidth size="small" sx={{mb:2}} error={!!danhMucError}>
                <InputLabel>Danh mục</InputLabel>
                <Box sx={{display:'flex', alignItems:'center'}}>
                  <Select
                      value={addIdDanhMuc}
                      label="Danh mục"
                      onChange={e => {
                        const value = String(e.target.value);
                        setAddIdDanhMuc(value);
                        if (value !== '') setDanhMucError('');
                      }}
                      renderValue={selected => selected ? (danhMucs.find(dm => String(dm.idDanhMuc) === selected)?.tenDanhMuc || 'Danh mục') : 'Danh mục'}
                      sx={{flex:1}}
                  >
                    <MenuItem value="">---</MenuItem>
                    {danhMucs.map(dm => (
                        <MenuItem key={dm.idDanhMuc} value={String(dm.idDanhMuc)}>{dm.tenDanhMuc}</MenuItem>
                    ))}
                  </Select>
                  <IconButton size="small" sx={{ml:1}} onClick={()=>handleOpenAddDialog('danhmuc')}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                {danhMucError && <Typography color="error" fontSize={13} mt={0.5}>{danhMucError}</Typography>}
              </FormControl>
              {/* Thương hiệu */}
              <FormControl fullWidth size="small" sx={{mb:2}} error={!!thuongHieuError}>
                <InputLabel>Thương hiệu</InputLabel>
                <Box sx={{display:'flex', alignItems:'center'}}>
                  <Select
                      value={addIdThuongHieu}
                      label="Thương hiệu"
                      onChange={e => {
                        const value = String(e.target.value);
                        setAddIdThuongHieu(value);
                        if (value !== '') setThuongHieuError('');
                      }}
                      renderValue={selected => selected ? (thuongHieus.find(th => String(th.idThuongHieu) === selected)?.tenThuongHieu || 'Thương hiệu') : 'Thương hiệu'}
                      sx={{flex:1}}
                  >
                    <MenuItem value="">---</MenuItem>
                    {thuongHieus.map(th => (
                        <MenuItem key={th.idThuongHieu} value={String(th.idThuongHieu)}>{th.tenThuongHieu}</MenuItem>
                    ))}
                  </Select>
                  <IconButton size="small" sx={{ml:1}} onClick={()=>handleOpenAddDialog('thuonghieu')}>
                    <AddIcon fontSize="small" />
                  </IconButton>
                </Box>
                {thuongHieuError && <Typography color="error" fontSize={13} mt={0.5}>{thuongHieuError}</Typography>}
              </FormControl>
              <FormControl fullWidth size="small" sx={{mb:2}} error={!!trangThaiError}>
                <InputLabel>Trạng thái</InputLabel>
                <Select
                    value={addTrangThai}
                    label="Trạng thái"
                    onChange={e => {
                      const value = String(e.target.value);
                      setAddTrangThai(value);
                      if (value !== '') setTrangThaiError('');
                    }}
                    renderValue={selected => selected ? selected : 'Trạng thái'}
                >
                  <MenuItem value="">---</MenuItem>
                  <MenuItem value="Đang bán">Đang bán</MenuItem>
                  <MenuItem value="Ngừng bán">Ngừng bán</MenuItem>
                </Select>
                {trangThaiError && <Typography color="error" fontSize={13} mt={0.5}>{trangThaiError}</Typography>}
              </FormControl>
              {addMode === 'new' && (
                  <Button
                      variant="contained"
                      style={{
                        background: '#b59d3a',
                        color: '#fff',
                        fontWeight: 700,
                        fontSize: 16,
                        borderRadius: 10,
                        height: 44,
                        boxShadow: '0 2px 8px #b59d3a22',
                        padding: '0 24px',
                        textAlign: 'center',
                        whiteSpace: 'nowrap',
                        marginTop: 0,
                      }}
                      fullWidth
                      onClick={handleCreateProduct}
                  >
                    + Thêm sản phẩm
                  </Button>
              )}
            </Paper>
            {/* Cột phải: Chọn màu/kích cỡ và bảng biến thể */}
            <Paper sx={{
              flex: 1,
              minWidth: 500,
              maxWidth: 1200,
              p: 4,
              borderRadius: 4,
              boxShadow: 3,
              bgcolor: '#fff',
              alignSelf: 'stretch',
              minHeight: 520,
              pt: 2
            }} elevation={3}>
              {/* Đặt nút Thêm thuộc tính chung cùng hàng với select màu sắc và kích cỡ */}
              <Box sx={{mb:3, display:'flex', gap:2, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-start'}}>
                {/* Màu sắc */}
                <FormControl size="small" sx={{minWidth:180}} error={!!mauSacError}>
                  <Box sx={{display:'flex', alignItems:'center'}}>
                    <Select
                        multiple
                        displayEmpty
                        value={addMultiMauSac}
                        onChange={e=>setAddMultiMauSac(typeof e.target.value==='string'?e.target.value.split(','):e.target.value as string[])}
                        renderValue={selected => selected.length ? mauSacs.filter(ms => selected.includes(String(ms.idMauSac))).map(ms=>ms.mauSac).join(', ') : 'Chọn màu sắc'}
                        sx={{flex:1}}
                    >
                      {mauSacs.map(ms=>(<MenuItem key={ms.idMauSac} value={String(ms.idMauSac)}>{ms.mauSac}</MenuItem>))}
                    </Select>
                    <IconButton size="small" sx={{ml:1}} onClick={()=>handleOpenAddDialog('mausac')}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                  {mauSacError && <Typography color="error" fontSize={13} mt={0.5}>{mauSacError}</Typography>}
                </FormControl>
                {/* Kích cỡ */}
                <FormControl size="small" sx={{minWidth:180}} error={!!kichCoError}>
                  <Box sx={{display:'flex', alignItems:'center'}}>
                    <Select
                        multiple
                        displayEmpty
                        value={addMultiKichCo}
                        onChange={e=>setAddMultiKichCo(typeof e.target.value==='string'?e.target.value.split(','):e.target.value as string[])}
                        renderValue={selected => selected.length ? kichCos.filter(kc => selected.includes(String(kc.idKichCo))).map(kc=>kc.kichCo).join(', ') : 'Chọn kích cỡ'}
                        sx={{flex:1}}
                    >
                      {kichCos.map(kc=>(<MenuItem key={kc.idKichCo} value={String(kc.idKichCo)}>{kc.kichCo}</MenuItem>))}
                    </Select>
                    <IconButton size="small" sx={{ml:1}} onClick={()=>handleOpenAddDialog('kichco')}><AddIcon fontSize="small" /></IconButton>
                  </Box>
                  {kichCoError && <Typography color="error" fontSize={13} mt={0.5}>{kichCoError}</Typography>}
                </FormControl>
                {/* Nút Thêm thuộc tính chung */}
                <Button
                    variant="contained"
                    sx={{
                      background: '#b59d3a',
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 15,
                      borderRadius: 2,
                      px: 2.5,
                      py: 1,
                      boxShadow: '0 2px 8px #b59d3a22',
                      '&:hover': { background: '#a88c2a' },
                      textTransform: 'none',
                      minWidth: 0,
                      ml: 2
                    }}
                    onClick={() => {
                      setCommonSoLuong('');
                      setCommonGia('');
                      setCommonError('');
                      setOpenCommonAttrModal(true);
                    }}
                >
                  Thêm thuộc tính chung
                </Button>
              </Box>
              {variantError && <Typography color="error" sx={{mb:1}}>{variantError}</Typography>}
              {/* Bảng nhập từng biến thể */}
              {showVariants && (
                  <TableContainer component={Paper} sx={{ mt: 0, maxHeight: 400, overflow: 'auto' }}>
                    <Table stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 90 }}>Màu sắc</TableCell>
                          <TableCell sx={{ whiteSpace: 'nowrap', minWidth: 90 }}>Kích cỡ</TableCell>
                          <TableCell>Số lượng</TableCell>
                          <TableCell>Giá</TableCell>
                          <TableCell>Ảnh</TableCell>
                          <TableCell align="center" sx={{ width: 48 }}></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {variants.length === 0 ? (
                                <TableRow>
                                  <TableCell colSpan={6} align="center" style={{ color: '#888', fontStyle: 'italic' }}>
                                    Hãy chọn màu sắc và kích cỡ để tạo biến thể
                                  </TableCell>
                                </TableRow>
                            ) :
                            variants.map((v, idx) => (
                                <React.Fragment key={v.idMauSac + '-' + v.idKichCo}>
                                  <TableRow>
                                    <TableCell>{mauSacs.find(ms => String(ms.idMauSac) === v.idMauSac)?.mauSac || v.idMauSac}</TableCell>
                                    <TableCell>{kichCos.find(kc => String(kc.idKichCo) === v.idKichCo)?.kichCo || v.idKichCo}</TableCell>
                                    <TableCell>
                                      <TextField
                                          value={v.soLuong}
                                          onChange={e => {
                                            const newVariants = [...variants];
                                            newVariants[idx].soLuong = e.target.value;
                                            setVariants(newVariants);
                                            setVariantErrors(prev => ({...prev, [v.idMauSac + '-' + v.idKichCo]: ''}));
                                          }}
                                          type="number"
                                          size="small"
                                          label={undefined}
                                          placeholder=""
                                          error={showVariantErrors && (!v.soLuong || isNaN(Number(v.soLuong)) || Number(v.soLuong) <= 0)}
                                          helperText={
                                            showVariantErrors && (!v.soLuong || isNaN(Number(v.soLuong))) ? 'Chưa nhập số lượng'
                                                : (showVariantErrors && Number(v.soLuong) <= 0 ? 'Số lượng phải > 0' : '')
                                          }
                                          inputProps={{
                                            min: 1,
                                            step: 1,
                                          }}
                                          sx={numberInputNoSpinnerSx}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <TextField
                                          value={v.gia}
                                          onChange={e => {
                                            const newVariants = [...variants];
                                            newVariants[idx].gia = e.target.value;
                                            setVariants(newVariants);
                                            setVariantErrors(prev => ({...prev, [v.idMauSac + '-' + v.idKichCo]: ''}));
                                          }}
                                          type="number"
                                          size="small"
                                          label={undefined}
                                          placeholder=""
                                          error={showVariantErrors && (!v.gia || isNaN(Number(v.gia)) || Number(v.gia) <= 0)}
                                          helperText={
                                            showVariantErrors && (!v.gia || isNaN(Number(v.gia))) ? 'Chưa nhập giá'
                                                : (showVariantErrors && Number(v.gia) <= 0 ? 'Giá phải > 0' : '')
                                          }
                                          inputProps={{
                                            min: 1,
                                            step: 1,
                                          }}
                                          sx={numberInputNoSpinnerSx}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <input
                                          type="file"
                                          accept="image/*"
                                          style={{ color: 'transparent', width: 110 }}
                                          onChange={e => {
                                            const file = e.target.files?.[0] || null;
                                            const newVariants = [...variants];
                                            newVariants[idx].hinhAnh = file;
                                            newVariants[idx].previewImg = file ? URL.createObjectURL(file) : '';
                                            setVariants(newVariants);
                                            setVariantErrors(prev => ({...prev, [v.idMauSac + '-' + v.idKichCo]: ''}));
                                          }}
                                      />
                                      {v.previewImg && <img src={v.previewImg} alt="preview" style={{ width: 40, height: 40, borderRadius: 4, objectFit: 'cover', marginTop: 4 }} />}
                                      {showVariantErrors && !v.hinhAnh && <Typography color="error" fontSize={13} mt={0.5}>Chọn ảnh</Typography>}
                                    </TableCell>
                                    <TableCell align="center">
                                      <IconButton size="small" onClick={() => {
                                        const newVariants = variants.filter((_, i) => i !== idx);
                                        setVariants(newVariants);
                                      }}>
                                        <FaTimes style={{ color: '#888' }} />
                                      </IconButton>
                                    </TableCell>
                                  </TableRow>
                                </React.Fragment>
                            ))
                        }
                      </TableBody>
                    </Table>
                  </TableContainer>
              )}
            </Paper>
          </Box>
          {/* Nút Hủy/Thêm luôn hiển thị */}
          <Box sx={{display:'flex', justifyContent:'flex-end', mt:2, gap:2, maxWidth:1120, mx:'auto'}}>
            <Button
                variant="outlined"
                size="medium"
                startIcon={<FaTimes style={{fontSize:18, color:'#888'}} />}
                sx={{
                  fontWeight: 600,
                  px: 3,
                  py: 0.5,
                  fontSize: 15,
                  borderRadius: 3,
                  minWidth: 110,
                  height: 44,
                  color: '#666',
                  borderColor: '#bbb',
                  borderWidth: 2,
                  background: '#fff',
                  '&:hover': { borderColor: '#888', background: '#f5f5f5' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
                onClick={() => router.push('/ChiTietSanPham')}
            >
              Hủy
            </Button>
            <Button
                variant="contained"
                size="medium"
                startIcon={<FaPlus style={{fontSize:18, marginRight:4}} />}
                sx={{
                  fontWeight: 700,
                  px: 3,
                  py: 0.5,
                  fontSize: 16,
                  borderRadius: 3,
                  minWidth: 150,
                  height: 44,
                  background: '#b59d3a',
                  color: '#fff',
                  boxShadow: '0 2px 8px #b59d3a22',
                  '&:hover': { background: '#a88c2a' },
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1.5
                }}
                onClick={handleAddAll}
            >
              Thêm
            </Button>
          </Box>
          {/* Banner thông báo lớn */}
          <CustomBannerAlert open={snackbar.open} message={snackbar.message} severity={snackbar.severity} onClose={()=>setSnackbar({...snackbar, open:false})} />
        </Box>
        {/* Dialog thêm mới */}
        <Dialog open={openAddDialog.open} onClose={handleCloseAddDialog}>
          <DialogTitle>Thêm mới {openAddDialog.type === 'danhmuc' ? 'danh mục' : openAddDialog.type === 'thuonghieu' ? 'thương hiệu' : openAddDialog.type === 'mausac' ? 'màu sắc' : 'kích cỡ'}</DialogTitle>
          <DialogContent>
            <TextField
                autoFocus
                fullWidth
                label=""
                value={newValue}
                onChange={e=>setNewValue(e.target.value)}
                error={!!addError}
                helperText={addError}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#bdbdbd',
                    },
                  },
                  '& label.Mui-focused': {
                    color: '#757575',
                  },
                }}
            />
          </DialogContent>
          <DialogActions>
            <Button
                onClick={handleCloseAddDialog}
                sx={{ color: '#888', fontWeight: 600 }}
            >
              Hủy
            </Button>
            <Button
                onClick={handleAddNew}
                disabled={addLoading}
                variant="contained"
                sx={{ background: '#b59d3a', color: '#fff', fontWeight: 700, '&:hover': { background: '#a88c2a' } }}
            >
              Thêm
            </Button>
          </DialogActions>
        </Dialog>
        {/* Modal nhập thuộc tính chung */}
        <Dialog open={openCommonAttrModal} onClose={() => setOpenCommonAttrModal(false)}>
          <DialogTitle>Nhập số lượng và giá cho tất cả biến thể</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
              <TextField
                  label="Số lượng"
                  type="number"
                  value={commonSoLuong}
                  onChange={e => setCommonSoLuong(e.target.value)}
                  inputProps={{ min: 1 }}
                  sx={numberInputNoSpinnerSx}
              />
              <TextField
                  label="Giá"
                  type="number"
                  value={commonGia}
                  onChange={e => setCommonGia(e.target.value)}
                  inputProps={{ min: 1 }}
                  sx={numberInputNoSpinnerSx}
              />
              {commonError && <Typography color="error">{commonError}</Typography>}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
                onClick={() => setOpenCommonAttrModal(false)}
                sx={{ color: '#888', fontWeight: 600 }}
            >
              Hủy
            </Button>
            <Button
                variant="contained"
                sx={{ background: '#b59d3a', color: '#fff', fontWeight: 700, '&:hover': { background: '#a88c2a' } }}
                onClick={() => {
                  if (!commonSoLuong || isNaN(Number(commonSoLuong)) || Number(commonSoLuong) <= 0) {
                    setCommonError('Số lượng phải > 0');
                    return;
                  }
                  if (!commonGia || isNaN(Number(commonGia)) || Number(commonGia) <= 0) {
                    setCommonError('Giá phải > 0');
                    return;
                  }
                  // Cập nhật cho tất cả biến thể
                  const newVariants = variants.map(v => ({
                    ...v,
                    soLuong: commonSoLuong,
                    gia: commonGia
                  }));
                  setVariants(newVariants);
                  setOpenCommonAttrModal(false);
                }}
            >
              Thêm
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
}