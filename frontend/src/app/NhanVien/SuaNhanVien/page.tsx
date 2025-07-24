"use client";
import React, { useEffect, useState } from "react";
import AdminLayout from "../../../component/Admin-Layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale } from "react-datepicker";
import { vi } from "date-fns/locale";
import { FaSave, FaArrowLeft, FaEdit, FaTimes } from "react-icons/fa";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

registerLocale("vi", vi);

export default function SuaNhanVienPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const id = searchParams.get("id");
    const [editForm, setEditForm] = useState({
        maNhanVien: "",
        tenNhanVien: "",
        email: "",
        soDienThoai: "",
        gioiTinh: "Nam",
        ngaySinh: "",
        diaChi: "",
        trangThai: "Hoạt động"
    });
    const [editLoading, setEditLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [successToast, setSuccessToast] = useState("");
    const [errorToast, setErrorToast] = useState("");
    const [errors, setErrors] = useState<{[key: string]: string}>({});
    const [addressData, setAddressData] = useState<any[]>([]);
    const [selectedProvince, setSelectedProvince] = useState<any>(null);
    const [selectedDistrict, setSelectedDistrict] = useState<any>(null);
    const [selectedWard, setSelectedWard] = useState<any>(null);
    const [ngoNgach, setNgoNgach] = useState("");

    useEffect(() => {
        fetch('/vn-address.json')
            .then(res => res.json())
            .then(data => {
                const arr = Array.isArray(data.results) ? data.results : [];
                setAddressData(arr);
            })
            .catch(() => setAddressData([]));
    }, []);

    // Validation functions
    const validatePhone = (phone: string): boolean => {
        const phoneRegex = /^0\d{9}$/;
        return phoneRegex.test(phone);
    };

    const validateAge = (birthDate: string): boolean => {
        if (!birthDate) return false;
        const today = new Date();
        const birth = new Date(birthDate);
        const age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            return age - 1 >= 15;
        }
        return age >= 15;
    };

    const validateForm = (): boolean => {
        const newErrors: {[key: string]: string} = {};
        
        if (!editForm.tenNhanVien.trim()) {
            newErrors.tenNhanVien = "Tên nhân viên không được để trống";
        }
        
        if (!editForm.email.trim()) {
            newErrors.email = "Email không được để trống";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(editForm.email)) {
            newErrors.email = "Email không hợp lệ";
        }
        
        if (!editForm.soDienThoai.trim()) {
            newErrors.soDienThoai = "Số điện thoại không được để trống";
        } else if (!validatePhone(editForm.soDienThoai)) {
            newErrors.soDienThoai = "Số điện thoại phải bắt đầu bằng 0 và có 10 chữ số";
        }
        
        if (!editForm.ngaySinh) {
            newErrors.ngaySinh = "Ngày sinh không được để trống";
        } else if (!validateAge(editForm.ngaySinh)) {
            newErrors.ngaySinh = "Nhân viên phải từ 15 tuổi trở lên";
        }
        
        if (!editForm.diaChi.trim()) {
            newErrors.diaChi = "Địa chỉ không được để trống";
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    useEffect(() => {
        if (!id) return;
        setFetching(true);
        fetch(`http://localhost:8080/nhan-vien/chi-tiet/${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.data) {
                    setEditForm({
                        ...data.data,
                        gioiTinh: data.data.gioiTinh === true || data.data.gioiTinh === "Nam" ? "Nam" : "Nữ",
                        ngaySinh: data.data.ngaySinh || ""
                    });
                    // Tách địa chỉ thành các phần
                    const diaChi = data.data.diaChi || "";
                    // Tách ngõ/ngách nếu có
                    let ngo = "";
                    let diaChiNoNgo = diaChi;
                    if (diaChi.includes(",")) {
                        const parts = diaChi.split(",");
                        if (parts.length > 3) {
                            ngo = parts[0].trim();
                            diaChiNoNgo = parts.slice(1).join(",").trim();
                        }
                    }
                    setNgoNgach(ngo);
                    // Tìm tỉnh, quận, xã
                    let foundProvince = null, foundDistrict = null, foundWard = null;
                    addressData.forEach((province: any) => {
                        if (diaChiNoNgo.includes(province.province_name)) {
                            foundProvince = province;
                            province.districts.forEach((district: any) => {
                                if (diaChiNoNgo.includes(district.district_name)) {
                                    foundDistrict = district;
                                    district.wards.forEach((ward: any) => {
                                        if (diaChiNoNgo.includes(ward.ward_name)) {
                                            foundWard = ward;
                                        }
                                    });
                                }
                            });
                        }
                    });
                    setSelectedProvince(foundProvince);
                    setSelectedDistrict(foundDistrict);
                    setSelectedWard(foundWard);
                }
                setFetching(false);
            })
            .catch(() => setFetching(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [id, addressData.length]);

    const handleEditNhanVien = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            setErrorToast("Vui lòng kiểm tra lại thông tin nhập vào");
            return;
        }
        
        setEditLoading(true);
        setErrorToast("");
        try {
            // Ghép địa chỉ lại
            const diaChiDayDu = `${ngoNgach ? ngoNgach + ', ' : ''}${selectedWard?.ward_name || ''}, ${selectedDistrict?.district_name || ''}, ${selectedProvince?.province_name || ''}`.replace(/^, |, ,/g, '').replace(/, $/, '');
            const res = await fetch(`http://localhost:8080/nhan-vien/sua/${id}`, {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    ...editForm,
                    gioiTinh: editForm.gioiTinh === "Nam",
                    diaChi: diaChiDayDu
                })
            });
            const data = await res.json();
            if (data.success) {
                setSuccessToast("Cập nhật nhân viên thành công!");
                setTimeout(() => {
                    router.push("/NhanVien/HienThi?page=1");
                }, 400);
            } else {
                if (data.message && data.message.toLowerCase().includes('mã nhân viên')) {
                    setErrors(prev => ({ ...prev, maNhanVien: data.message }));
                } else {
                    setErrorToast(data.message || "Có lỗi xảy ra khi cập nhật nhân viên");
                }
            }
        } catch (err) {
            console.error("Không thể kết nối server");
            setErrorToast("Không thể kết nối đến server");
        }
        setEditLoading(false);
    };

    const handleCancel = () => {
        router.push("/NhanVien/HienThi");
    };

    if (fetching) return <div style={{ textAlign: "center", padding: 40 }}>Đang tải dữ liệu nhân viên...</div>;

    // Lấy danh sách tỉnh/thành
    const provinces = addressData;
    // Lấy danh sách quận/huyện theo tỉnh đã chọn
    const districts = selectedProvince ? selectedProvince.districts : [];
    // Lấy danh sách xã/phường theo quận/huyện đã chọn
    const wards = selectedDistrict ? selectedDistrict.wards : [];

    return (
        <AdminLayout activeMenu="employees" pageTitle="Quản lý nhân viên" onMenuChangeAction={() => {}}>
            <div style={{
                maxWidth: 1100,
                margin: "40px auto",
                background: "#fff",
                borderRadius: 16,
                boxShadow: "0 4px 24px #0002",
                padding: 32
            }}>
                <h2 style={{ textAlign: "center", color: "black", fontWeight: 700, fontSize: 28, marginBottom: 24 }}>
                    Sửa thông tin nhân viên
                </h2>
                <form onSubmit={handleEditNhanVien}>
                    {/* Hàng 1: Tên nhân viên | Email */}
                    <div style={{ display: 'flex', gap: 32, marginBottom: 18 }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label>Họ và tên *</label>
                            <input required placeholder="Nhập họ tên" value={editForm.tenNhanVien} onChange={e => setEditForm(f => ({ ...f, tenNhanVien: e.target.value }))} style={{ width: "100%", padding: '12px 16px', borderRadius: 7, border: errors.tenNhanVien ? "1.5px solid #e74c3c" : "1.5px solid #b59d3a55", background: '#fff', color: '#222' }} />
                            {errors.tenNhanVien && <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 2 }}>{errors.tenNhanVien}</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label>Email *</label>
                            <input required type="email" placeholder="Nhập email" value={editForm.email} onChange={e => setEditForm(f => ({ ...f, email: e.target.value }))} style={{ width: "100%", padding: '12px 16px', borderRadius: 7, border: errors.email ? "1.5px solid #e74c3c" : "1.5px solid #b59d3a55", background: '#fff', color: '#222' }} />
                            {errors.email && <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 2 }}>{errors.email}</div>}
                        </div>
                    </div>
                    {/* Hàng 2: Số điện thoại | Giới tính */}
                    <div style={{ display: 'flex', gap: 32, marginBottom: 18 }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label>Số điện thoại *</label>
                            <input required placeholder="Số điện thoại (VD: 0123456789)" value={editForm.soDienThoai} onChange={e => setEditForm(f => ({ ...f, soDienThoai: e.target.value }))} style={{ width: "100%", padding: '12px 16px', borderRadius: 7, border: errors.soDienThoai ? "1.5px solid #e74c3c" : "1.5px solid #b59d3a55", background: '#fff', color: '#222' }} />
                            {errors.soDienThoai && <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 2 }}>{errors.soDienThoai}</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label>Giới tính *</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 32, height: 48 }}>
                                <label className="custom-radio" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                                    <input type="radio" name="gender" value="Nam" checked={editForm.gioiTinh === "Nam"} onChange={() => setEditForm(f => ({ ...f, gioiTinh: "Nam" }))} />
                                    <span className="checkmark"></span> Nam
                                </label>
                                <label className="custom-radio" style={{ display: 'flex', alignItems: 'center', gap: 6, position: 'relative' }}>
                                    <input type="radio" name="gender" value="Nữ" checked={editForm.gioiTinh === "Nữ"} onChange={() => setEditForm(f => ({ ...f, gioiTinh: "Nữ" }))} />
                                    <span className="checkmark"></span> Nữ
                                </label>
                            </div>
                        </div>
                    </div>
                    {/* Hàng 3: Ngày sinh | Tỉnh thành | Quận huyện */}
                    <div style={{ display: 'flex', gap: 32, marginBottom: 18 }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <label>Ngày sinh *</label>
                            <DatePicker
                                selected={editForm.ngaySinh ? new Date(editForm.ngaySinh) : null}
                                onChange={date => setEditForm(f => ({
                                    ...f,
                                    ngaySinh: date
                                        ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                                        : ""
                                }))}
                                dateFormat="dd/MM/yyyy"
                                placeholderText="Chọn ngày sinh"
                                className={`custom-datepicker-input large ${errors.ngaySinh ? 'error' : ''}`}
                                required
                                showMonthDropdown
                                showYearDropdown
                                scrollableYearDropdown
                                yearDropdownItemNumber={new Date().getFullYear() - 1970 + 1}
                                minDate={new Date(1970, 0, 1)}
                                maxDate={new Date()}
                                wrapperClassName="custom-datepicker-wrapper"
                                locale="vi"
                            />
                            {errors.ngaySinh && <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 2 }}>{errors.ngaySinh}</div>}
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label>Tỉnh thành *</label>
                                <select value={selectedProvince?.province_id || ''} onChange={e => {
                                    const p = provinces.find((p: any) => p.province_id === e.target.value);
                                    setSelectedProvince(p);
                                    setSelectedDistrict(null);
                                    setSelectedWard(null);
                                }} style={{ width: '100%', padding: '12px 16px', borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} required disabled={provinces.length === 0}>
                                    <option value="">{provinces.length === 0 ? 'Đang tải...' : 'Chọn tỉnh/thành'}</option>
                                    {provinces.map((p: any) => (
                                        <option key={String(p.province_id)} value={p.province_id}>{p.province_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label>Quận, huyện *</label>
                                <select value={selectedDistrict?.district_id || ''} onChange={e => {
                                    const d = districts.find((d: any) => d.district_id === e.target.value);
                                    setSelectedDistrict(d);
                                    setSelectedWard(null);
                                }} style={{ width: '100%', padding: '12px 16px', borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} required disabled={!selectedProvince || districts.length === 0}>
                                    <option value="">{districts.length === 0 ? 'Chọn tỉnh/thành trước' : 'Chọn quận/huyện'}</option>
                                    {districts.map((d: any) => (
                                        <option key={String(d.district_id)} value={d.district_id}>{d.district_name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>
                    {/* Hàng 4: (trái trống) | Xã | Ngõ */}
                    <div style={{ display: 'flex', gap: 32, marginBottom: 18 }}>
                        <div style={{ flex: 1, minWidth: 0 }} />
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', gap: 12 }}>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label>Xã *</label>
                                <select value={selectedWard?.ward_id || ''} onChange={e => {
                                    const w = wards.find((w: any) => w.ward_id === e.target.value);
                                    setSelectedWard(w);
                                }} style={{ width: '100%', padding: '12px 16px', borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} required disabled={!selectedDistrict || wards.length === 0}>
                                    <option value="">{wards.length === 0 ? 'Chọn quận/huyện trước' : 'Chọn phường/xã'}</option>
                                    {wards.map((w: any) => (
                                        <option key={String(w.ward_id)} value={w.ward_id}>{w.ward_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                                <label>Ngõ</label>
                                <input placeholder="Nhập ngõ/ngách" value={ngoNgach} onChange={e => setNgoNgach(e.target.value)} style={{ width: '100%', padding: '12px 16px', borderRadius: 7, border: '1.5px solid #b59d3a55', background: '#fff', color: '#222' }} />
                                {errors.diaChi && <div style={{ color: '#e74c3c', fontSize: 12, marginTop: 2 }}>{errors.diaChi}</div>}
                            </div>
                        </div>
                    </div>
                    {/* Hàng 5: Nút hủy | Nút lưu */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 18 }}>
                        <button type="button" onClick={handleCancel} style={{ background: "#fff", color: "#888", border: "1.5px solid #bbb", borderRadius: 7, padding: "10px 22px", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                            <FaTimes style={{ fontSize: 18, color: "#888" }} /> Hủy
                        </button>
                        <button type="submit" disabled={editLoading} style={{ background: "#b59d3a", color: "#fff", border: "none", borderRadius: 7, padding: "10px 22px", fontWeight: 600, fontSize: 16, display: "flex", alignItems: "center", gap: 6, cursor: editLoading ? "not-allowed" : "pointer" }}>
                            <FaSave style={{ fontSize: 16 }} /> {editLoading ? "Đang lưu..." : "Lưu"}
                        </button>
                    </div>
                </form>
                {successToast && (
                    <div style={{ position: 'fixed', top: 30, right: 30, zIndex: 2000, background: '#2ecc40', color: '#fff', padding: '14px 28px', borderRadius: 8, fontWeight: 600, fontSize: 16, boxShadow: '0 2px 12px #0002', minWidth: 220, textAlign: 'center' }}>
                        {successToast}
                    </div>
                )}
            </div>
        </AdminLayout>
    );
}
