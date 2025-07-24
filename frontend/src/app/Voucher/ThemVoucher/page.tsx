"use client";
import React, { useState, useEffect } from 'react';
import AdminLayout from '../../../component/Admin-Layout';
import { useRouter } from 'next/navigation';
import { FaTimes, FaPlus } from 'react-icons/fa';
import MuiDateTimeInput from '../../../component/MuiDateTimeInput';

const apiUrl = 'http://localhost:8080/api/voucher';

type FormType = {
  maPhieuGiamGia: string;
  tenPhieuGiamGia: string;
  kieuGiamGia: string;
  giaTriToiThieu: string;
  giaTriToiDa: string;
  phanTramGiamGia: string;
  soLuong: string;
  ngayBatDau: string;
  ngayKetThuc: string;
  moTa: string;
};

type FormErrorsType = Partial<Record<keyof FormType, string>>;

const ThemVoucherPage = () => {
  const router = useRouter();
  const [form, setForm] = useState<FormType>({
    maPhieuGiamGia: '',
    tenPhieuGiamGia: '',
    kieuGiamGia: '',
    giaTriToiThieu: '',
    giaTriToiDa: '',
    phanTramGiamGia: '',
    soLuong: '',
    ngayBatDau: '',
    ngayKetThuc: '',
    moTa: '',
  });
  const [formErrors, setFormErrors] = useState<FormErrorsType>({});
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Toast tự động ẩn
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(''), 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };
  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const validateForm = () => {
    const errors: FormErrorsType = {};
    if (!form.maPhieuGiamGia || !form.maPhieuGiamGia.trim()) errors.maPhieuGiamGia = 'Mã không được để trống';
    else if (!/^[a-zA-Z0-9]+$/.test(form.maPhieuGiamGia)) errors.maPhieuGiamGia = 'Mã chỉ được chứa chữ và số, không có ký tự đặc biệt';
    if (!form.tenPhieuGiamGia || !form.tenPhieuGiamGia.trim()) errors.tenPhieuGiamGia = 'Tên không được để trống';
    else if (form.tenPhieuGiamGia.length > 100) errors.tenPhieuGiamGia = 'Tên không quá 100 ký tự';
    if (!form.kieuGiamGia) errors.kieuGiamGia = 'Vui lòng chọn kiểu';
    if (!form.soLuong || isNaN(Number(form.soLuong)) || Number(form.soLuong) < 1) errors.soLuong = 'Số lượng phải lớn hơn 0';
    if (!form.giaTriToiThieu || isNaN(Number(form.giaTriToiThieu)) || Number(form.giaTriToiThieu) < 0) errors.giaTriToiThieu = 'Giá trị tối thiểu phải >= 0';
    if (form.kieuGiamGia === 'PERCENT') {
      if (form.giaTriToiDa === '' || form.giaTriToiDa === null || form.giaTriToiDa === undefined) errors.giaTriToiDa = 'Giá trị giảm tối đa không được để trống';
      else if (isNaN(Number(form.giaTriToiDa))) errors.giaTriToiDa = 'Giá trị giảm tối đa phải là số';
      else if (Number(form.giaTriToiDa) <= 0) errors.giaTriToiDa = 'Giá trị giảm tối đa phải lớn hơn 0';
    } else if (form.kieuGiamGia === 'FREE_SHIP') {
      if (form.giaTriToiDa === '' || form.giaTriToiDa === null || form.giaTriToiDa === undefined) errors.giaTriToiDa = 'Giá trị tối đa không được để trống';
      else if (isNaN(Number(form.giaTriToiDa))) errors.giaTriToiDa = 'Giá trị tối đa phải là số';
      else if (Number(form.giaTriToiDa) !== 0) errors.giaTriToiDa = 'Giá trị tối đa phải = 0';
      if (form.phanTramGiamGia === '' || form.phanTramGiamGia === null || form.phanTramGiamGia === undefined) errors.phanTramGiamGia = 'Phần trăm giảm không được để trống';
      else if (isNaN(Number(form.phanTramGiamGia))) errors.phanTramGiamGia = 'Phần trăm giảm phải là số';
      else if (Number(form.phanTramGiamGia) !== 0) errors.phanTramGiamGia = 'Phần trăm giảm phải = 0';
    } else if (form.kieuGiamGia === 'FIXED') {
      if (form.phanTramGiamGia === '' || form.phanTramGiamGia === null || form.phanTramGiamGia === undefined) errors.phanTramGiamGia = 'Phần trăm giảm không được để trống';
      else if (isNaN(Number(form.phanTramGiamGia))) errors.phanTramGiamGia = 'Phần trăm giảm phải là số';
      else if (Number(form.phanTramGiamGia) !== 0) errors.phanTramGiamGia = 'Phần trăm giảm phải = 0';
      if (form.giaTriToiDa === '' || form.giaTriToiDa === null || form.giaTriToiDa === undefined) errors.giaTriToiDa = 'Giá trị tối đa không được để trống';
      else if (isNaN(Number(form.giaTriToiDa)) || Number(form.giaTriToiDa) < 0) errors.giaTriToiDa = 'Giá trị tối đa phải >= 0';
    } else {
      if (form.giaTriToiDa === '' || form.giaTriToiDa === null || form.giaTriToiDa === undefined) errors.giaTriToiDa = 'Giá trị tối đa không được để trống';
      else if (isNaN(Number(form.giaTriToiDa)) || Number(form.giaTriToiDa) < 0) errors.giaTriToiDa = 'Giá trị tối đa phải >= 0';
    }
    if (!form.phanTramGiamGia || isNaN(Number(form.phanTramGiamGia)) || Number(form.phanTramGiamGia) < 0) errors.phanTramGiamGia = 'Phần trăm giảm phải >= 0';
    if (!form.ngayBatDau) errors.ngayBatDau = 'Vui lòng chọn ngày bắt đầu';
    else if (new Date(form.ngayBatDau) < new Date(new Date().toISOString().slice(0,10))) errors.ngayBatDau = 'Ngày bắt đầu không được nhỏ hơn hôm nay';
    if (!form.ngayKetThuc) errors.ngayKetThuc = 'Vui lòng chọn ngày kết thúc';
    if (form.ngayBatDau && form.ngayKetThuc && form.ngayBatDau > form.ngayKetThuc) errors.ngayKetThuc = 'Ngày kết thúc phải sau ngày bắt đầu';
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    const errors = validateForm();
    setFormErrors(errors);
    if (Object.keys(errors).length > 0) {
      setSaving(false);
      return;
    }
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        let backendError = 'Lỗi khi lưu phiếu giảm giá';
        try {
          const data = await res.json();
          if (data && typeof data === 'object' && data.message) {
            setFormErrors(prev => ({ ...prev, maPhieuGiamGia: data.message }));
            setSaving(false);
            return;
          }
        } catch {}
        setFormErrors(prev => ({ ...prev, maPhieuGiamGia: backendError }));
        setSaving(false);
        return;
      }
      setSuccess('Thêm phiếu giảm giá thành công');
      setTimeout(() => {
        router.push('/Voucher/HienThi');
      }, 800);
    } catch (e) {
      setError('Lỗi khi lưu phiếu giảm giá');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.push('/Voucher/HienThi');
  };

  return (
    <AdminLayout activeMenu="promotions" onMenuChangeAction={() => {}} pageTitle="Khuyến mãi">
      <div style={{ padding: 24, fontFamily: 'Segoe UI, Arial, sans-serif', background: '#fcf8e8', minHeight: '100vh' }}>
        <h1 style={{ color: '#222', fontWeight: 600, marginBottom: 24 }}>Thêm phiếu giảm giá</h1>
        {/* Toast thông báo góc phải */}
        {success && (
          <div style={{
            position: 'fixed',
            top: 30,
            right: 30,
            zIndex: 2000,
            background: '#2ecc40',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            boxShadow: '0 2px 12px #0002',
            minWidth: 220,
            textAlign: 'center'
          }}>
            {success}
          </div>
        )}
        {error && (
          <div style={{
            position: 'fixed',
            top: 30,
            right: 30,
            zIndex: 2000,
            background: '#e74c3c',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 8,
            fontWeight: 600,
            fontSize: 16,
            boxShadow: '0 2px 12px #0002',
            minWidth: 220,
            textAlign: 'center'
          }}>
            {error}
          </div>
        )}
        <div style={{
          background: '#fff',
          borderRadius: 16,
          boxShadow: '0 4px 24px #b59d3a22',
          padding: 32,
          maxWidth: 1400,
          margin: '0 auto',
          marginBottom: 32,
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Mã giảm giá:<br />
                    <input name="maPhieuGiamGia" value={form.maPhieuGiamGia} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.maPhieuGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.maPhieuGiamGia}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Tên giảm giá:<br />
                    <input name="tenPhieuGiamGia" value={form.tenPhieuGiamGia} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.tenPhieuGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.tenPhieuGiamGia}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Kiểu giảm giá:<br />
                    <select
                      name="kieuGiamGia"
                      value={form.kieuGiamGia}
                      onChange={handleSelectChange}
                      required
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }}
                    >
                      <option value="">-- Chọn kiểu --</option>
                      <option value="PERCENT">Phần trăm</option>
                      <option value="FIXED">Giảm trực tiếp</option>
                      <option value="FREE_SHIP">Free ship</option>
                    </select>
                  </label>
                  {formErrors.kieuGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.kieuGiamGia}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Giá trị tối thiểu của đơn hàng: <br />
                    <input name="giaTriToiThieu" type="number" value={form.giaTriToiThieu} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.giaTriToiThieu && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.giaTriToiThieu}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Giá trị giảm tối đa của đơn hàng: <br />
                    <input name="giaTriToiDa" type="number" value={form.giaTriToiDa} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.giaTriToiDa && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.giaTriToiDa}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Phần trăm giảm:<br />
                    <input name="phanTramGiamGia" type="number" value={form.phanTramGiamGia} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.phanTramGiamGia && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.phanTramGiamGia}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 18 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Số lượng:<br />
                    <input name="soLuong" type="number" value={form.soLuong} onChange={handleInputChange} required style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4 }} />
                  </label>
                  {formErrors.soLuong && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.soLuong}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Ngày bắt đầu:<br />
                    <MuiDateTimeInput
                      value={form.ngayBatDau ? new Date(form.ngayBatDau) : null}
                      onChange={date => setForm(prev => ({ ...prev, ngayBatDau: date ? date.toISOString() : '' }))}
                    />
                  </label>
                  {formErrors.ngayBatDau && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.ngayBatDau}</div>}
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600 }}>Ngày kết thúc:<br />
                    <MuiDateTimeInput
                      value={form.ngayKetThuc ? new Date(form.ngayKetThuc) : null}
                      onChange={date => setForm(prev => ({ ...prev, ngayKetThuc: date ? date.toISOString() : '' }))}
                      minDateTime={form.ngayBatDau ? new Date(form.ngayBatDau) : undefined}
                    />
                  </label>
                  {formErrors.ngayKetThuc && <div style={{ color: 'red', fontSize: 13 }}>{formErrors.ngayKetThuc}</div>}
                </div>
              </div>
              {/* Dòng riêng cho mô tả */}
              <div style={{ marginTop: 18 }}>
                <label style={{ fontWeight: 600 }}>Mô tả:<br />
                  <textarea name="moTa" value={form.moTa} onChange={handleInputChange} style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #ccc', marginTop: 4, minHeight: 38 }} />
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 24, justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: '#fff',
                  color: '#888',
                  border: '2px solid #bbb',
                  borderRadius: 8,
                  padding: '10px 14px',
                  fontWeight: 600,
                  fontSize: 15,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  marginRight: 0,
                  cursor: 'pointer'
                }}
              >
                <FaTimes style={{ fontSize: 16, color: '#888' }} />
                Hủy
              </button>
              <button
                type="submit"
                style={{
                  background: '#b59d3a',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 8,
                  padding: '10px 16px',
                  fontWeight: 700,
                  fontSize: 15,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                  boxShadow: '0 2px 8px #b59d3a22',
                  cursor: 'pointer'
                }}
              >
                <FaPlus style={{ fontSize: 16, color: '#fff' }} />
                Thêm phiếu giảm giá
              </button>
            </div>
          </form>
        </div>
      </div>
    </AdminLayout>
  );
};

export default ThemVoucherPage; 