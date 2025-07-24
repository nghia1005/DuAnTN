"use client";
import React, {useEffect, useState} from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Checkbox from "@mui/material/Checkbox";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormGroup from "@mui/material/FormGroup";
import Divider from "@mui/material/Divider";
import Button from "@mui/material/Button";
import {useRouter} from "next/navigation";
import SearchIcon from '@mui/icons-material/Search';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {Paper, List, ListItem, ListItemIcon, ListItemText} from '@mui/material';
import Link from '@mui/material/Link';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import MenuItem from '@mui/material/MenuItem';
import Select from '@mui/material/Select';
import InputLabel from '@mui/material/InputLabel';
import FormControl from '@mui/material/FormControl';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import {SelectChangeEvent} from '@mui/material/Select';
import Badge from '@mui/material/Badge';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormLabel from '@mui/material/FormLabel';
import QrSelector from "../pos/QrSelector";
import LogoutIcon from '@mui/icons-material/Logout';

interface ProductVariant {
    idChiTietSanPham: number;
    idSanPham: number;
    maSanPham: string;
    tenSanPham: string;
    tenThuongHieu: string;
    tenDanhMuc: string;
    duongDanHinhAnh?: string;
    moTa?: string;
    trangThai?: string;
    idMauSac?: number;
    tenMauSac?: string;
    idKichCo?: number;
    tenKichCo?: string;
    gia: number;
    soLuong?: number;
    idDanhMuc?: number; // Thêm dòng này để fix lỗi linter
}

interface Brand { idThuongHieu: number; tenThuongHieu: string; }
interface Color { idMauSac: number; mauSac: string; }
interface Size { idKichCo: number; kichCo: string; }
interface Category { idDanhMuc: number; tenDanhMuc: string; }

export default function ShopPage() {
    // State cho dữ liệu địa chỉ động
    const [addressData, setAddressData] = useState<any>({ results: [] });

    // Fetch dữ liệu địa chỉ từ public/vn-address.json
    useEffect(() => {
        fetch('/vn-address.json')
            .then(res => res.json())
            .then(data => setAddressData(data));
    }, []);

    const [products, setProducts] = useState<ProductVariant[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    const [brands, setBrands] = useState<Brand[]>([]);
    const [colors, setColors] = useState<Color[]>([]);
    const [sizes, setSizes] = useState<Size[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);

    const [selectedColors, setSelectedColors] = useState<number[]>([]);
    const [selectedSizes, setSelectedSizes] = useState<number[]>([]);
    const [selectedBrands, setSelectedBrands] = useState<string[]>([]);

    const [search, setSearch] = useState("");
    const [showWelcome, setShowWelcome] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState<ProductVariant | null>(null);
    const [modalOpen, setModalOpen] = useState(false);
    const [modalColor, setModalColor] = useState<string>("");
    const [modalSize, setModalSize] = useState<string>("");
    const [modalQuantity, setModalQuantity] = useState<number>(1);

    // 1. Thêm state cart và showCart
    const [cart, setCart] = useState<Array<{product: ProductVariant, quantity: number}>>([]);
    const [showCart, setShowCart] = useState(false);
    // State lưu index các sản phẩm được chọn trong giỏ hàng
    const [selectedCartIndexes, setSelectedCartIndexes] = useState<number[]>([]);
    // State cho giao diện đặt hàng
    const [showCheckout, setShowCheckout] = useState(false);
    const [checkoutItems, setCheckoutItems] = useState<Array<{product: ProductVariant, quantity: number}>>([]);
    // Thêm state cho QR Selector
    const [showQRSelector, setShowQRSelector] = useState(false);
    const [selectedQR, setSelectedQR] = useState<any>(null);
    // State cho trang cảm ơn
    const [showThankYou, setShowThankYou] = useState(false);
    const [lastInvoice, setLastInvoice] = useState<any>(null);

    // State cho form đặt hàng
    const [customerInfo, setCustomerInfo] = useState({
        name: '',
        email: '',
        phone: '',
        city: '',
        district: '',
        ward: '',
        address: '',
        payment: 'cod',
        voucher: '',
    });
    // Địa chỉ động từ file vn-address.json
    const provinces = addressData.results.map((p: any) => p.province_name);
    const selectedProvince = addressData.results.find((p: any) => p.province_name === customerInfo.city);
    const districts = selectedProvince ? selectedProvince.districts.map((d: any) => d.district_name) : [];
    const selectedDistrict = selectedProvince?.districts.find((d: any) => d.district_name === customerInfo.district);
    const wards = selectedDistrict ? selectedDistrict.wards.map((w: any) => w.ward_name) : [];
    // Voucher mẫu
    const vouchers = [
        { code: '', label: 'Không áp dụng' },
        { code: 'FREESHIP', label: 'FREESHIP (Miễn phí ship)' },
    ];

    // State cho danh sách địa chỉ của user
    const [userAddresses, setUserAddresses] = useState<any[]>([]);
    const [showAddressSelect, setShowAddressSelect] = useState(false);
    const [addressError, setAddressError] = useState("");

    // 1. Thêm state cho modal tra cứu
    const [showTraCuuModal, setShowTraCuuModal] = useState(false);
    const [traCuuMaDon, setTraCuuMaDon] = useState('');
    const [traCuuLoading, setTraCuuLoading] = useState(false);
    const [traCuuError, setTraCuuError] = useState('');
    const [traCuuOrder, setTraCuuOrder] = useState<any>(null);
    const [traCuuHistory, setTraCuuHistory] = useState<any[]>([]);

    // 1. Thêm state cho lỗi form khách hàng
    const [customerFormError, setCustomerFormError] = useState('');

    // Tính toán tổng tiền, giảm giá, ship, cần thanh toán
    const calcCheckout = (items: Array<{product: ProductVariant, quantity: number}>, voucher: string) => {
        const total = items.reduce((sum, item) => sum + (item.product.gia || 0) * item.quantity, 0);
        let ship = 34000;
        let discount = 0;
        if (voucher === 'FREESHIP') discount = ship;
        return {
            total,
            discount,
            ship,
            needPay: total - discount + ship
        };
    };

    // Hàm dùng chung để lưu hóa đơn vào localStorage
    const saveInvoiceToLocalStorage = (invoice: any) => {
        const invoices = JSON.parse(localStorage.getItem('online_invoices') || '[]');
        invoices.push(invoice);
        localStorage.setItem('online_invoices', JSON.stringify(invoices));
        setLastInvoice(invoice);
    };

    // Hàm tạo hóa đơn online và lưu vào localStorage
    const handleCreateInvoice = (customerInfo: any, items: any, payment: string, voucher: string, total: number, discount: number, ship: number, needPay: number) => {
        // Xác định loại khách hàng
        let customerType = 'Khách lẻ';
        try {
            let userStr = localStorage.getItem('user');
            if (!userStr || userStr === '{}' || userStr === 'null') {
                userStr = localStorage.getItem('khachHang') || '{}';
            }
            const user = JSON.parse(userStr);
            // Kiểm tra kỹ hơn
            if (
                user &&
                (
                    user.vaiTro === 'KHACH_HANG' ||
                    user.idVaiTro === 3 ||
                    (typeof user.id === 'number' && user.id > 0)
                )
            ) {
                customerType = 'Thành viên';
            }
        } catch {}
        const status = 'Chờ xác nhận'; // luôn là Chờ xác nhận
        const leftStatus = payment === 'bank' ? 'Đã xác nhận' : 'Chờ xác nhận';
        const invoice = {
            id: Date.now(),
            customer: customerInfo,
            items,
            payment,
            voucher,
            total,
            discount,
            ship,
            needPay,
            date: new Date().toLocaleString('vi-VN'),
            status,
            customerType,
            leftStatus,
        };
        saveInvoiceToLocalStorage(invoice);
    };

    // Thêm hàm validateCustomerInfo
    const validateCustomerInfo = (info: { name: string; phone: string; email: string }) => {
      // Validate tên khách hàng
      const name = info.name.trim();
      if (!name) return 'Vui lòng nhập tên khách hàng!';
      // Không ký tự đặc biệt, không số, không lặp 2 lần liên tiếp, không khoảng trắng đầu/cuối/giữa
      if (!/^([A-ZÀ-Ỹ][a-zà-ỹ]+)(\s[A-ZÀ-Ỹ][a-zà-ỹ]+)*$/.test(name)) return 'Tên khách hàng phải in hoa chữ cái đầu mỗi từ, không chứa số/ký tự đặc biệt, không có khoảng trắng thừa.';
      // Số điện thoại
      const phone = info.phone.trim();
      if (!/^\d{10}$/.test(phone)) return 'Số điện thoại phải đúng 10 số, không ký tự đặc biệt, không khoảng trắng.';
      // Email
      const email = info.email.trim();
      if (!/^[a-zA-Z0-9._%+-]+@gmail\.com$/.test(email)) return 'Email phải đúng định dạng và là @gmail.com, không khoảng trắng.';
      return '';
    };

    // Hàm xử lý thanh toán online (gửi API, trừ kho, xóa giỏ, cảm ơn)
    const handleOnlineCheckout = async () => {
        const { total, discount, ship, needPay } = calcCheckout(checkoutItems, customerInfo.voucher);
        // Xác định loại khách hàng
        let customerType = 'Khách lẻ';
        try {
            let userStr = localStorage.getItem('user');
            if (!userStr || userStr === '{}' || userStr === 'null') {
                userStr = localStorage.getItem('khachHang') || '{}';
            }
            const user = JSON.parse(userStr);
            if (
                user &&
                (
                    user.vaiTro === 'KHACH_HANG' ||
                    user.idVaiTro === 3 ||
                    (typeof user.id === 'number' && user.id > 0)
                )
            ) {
                customerType = 'Thành viên';
            }
        } catch {}
        // Tạo payload gửi lên backend
        const payload = {
            tenNguoiNhan: customerInfo.name,
            email: customerInfo.email,
            soDienThoai: customerInfo.phone,
            diaChiNhanHang: `${customerInfo.address}, ${customerInfo.ward}, ${customerInfo.district}, ${customerInfo.city}`,
            tongTien: total,
            phiShip: ship,
            thanhTien: needPay,
            trangThai: 'Chờ xác nhận', // luôn là Chờ xác nhận
            chiTiet: checkoutItems.map(item => ({
                idChiTietSanPham: item.product.idChiTietSanPham,
                soLuong: item.quantity,
                donGia: item.product.gia || 0,
                thanhTien: (item.product.gia || 0) * item.quantity
            })),
            thanhToan: {
                soTienThanhToan: needPay,
                phuongThucThanhToan: customerInfo.payment,
                ghiChu: '',
                trangThai: customerInfo.payment === 'bank' ? 'Đã xác nhận' : 'Chờ xác nhận'
            },
            customerType, // Thêm trường này để backend lưu vào hóa đơn
            leftStatus: customerInfo.payment === 'bank' ? 'Đã xác nhận' : 'Chờ xác nhận', // thêm dòng này
        };
        // Trong handleOnlineCheckout, trước khi gửi đơn, validate:
        const errorMsg = validateCustomerInfo(customerInfo);
        if (errorMsg) {
          setCustomerFormError(errorMsg);
          return;
        } else {
          setCustomerFormError('');
        }
        try {
            const res = await fetch('http://localhost:8080/api/hoadon', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                const data = await res.json();
                const maHoaDon = data?.data?.maHoaDon || data?.maHoaDon || null;
                // Lưu hóa đơn vào localStorage để hiển thị ở /invoices
                const status = 'Chờ xác nhận'; // luôn là Chờ xác nhận
                const leftStatus = customerInfo.payment === 'bank' ? 'Đã xác nhận' : 'Chờ xác nhận';
                const invoice = {
                    id: Date.now(),
                    maHoaDon, // thêm trường này
                    customer: customerInfo,
                    items: checkoutItems,
                    payment: customerInfo.payment,
                    voucher: customerInfo.voucher,
                    total,
                    discount,
                    ship,
                    needPay,
                    date: new Date().toLocaleString('vi-VN'),
                    status,
                    customerType,
                    leftStatus,
                };
                saveInvoiceToLocalStorage(invoice);
                setCart([]);
                setSelectedCartIndexes([]);
                setShowCheckout(false);
                setShowThankYou(true);
                // Chuyển hướng về trang chủ sau khi cảm ơn
                setTimeout(() => {
                    router.push('/shop');
                }, 1500);
                // Trong handleOnlineCheckout, sau khi thanh toán thành công:
                if (customerInfo.payment === 'bank') {
                    checkoutItems.forEach(item => {
                        updateProductQuantity(item.product.idChiTietSanPham, item.quantity);
                    });
                }
            } else {
                alert('Đặt hàng thất bại, vui lòng thử lại!');
            }
        } catch (err) {
            alert('Lỗi kết nối server!');
        }
    };

    // Thêm hàm xử lý đăng xuất
    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    // 2. Hàm tra cứu đơn hàng
    const handleTraCuu = async () => {
        setTraCuuError('');
        setTraCuuOrder(null);
        setTraCuuHistory([]);
        if (!traCuuMaDon.trim()) {
            setTraCuuError('Vui lòng nhập mã đơn hàng!');
            return;
        }
        setTraCuuLoading(true);
        try {
            const res = await fetch(`http://localhost:8080/api/hoadon/ma/${encodeURIComponent(traCuuMaDon.trim())}`);
            if (!res.ok) throw new Error('Không tìm thấy đơn hàng!');
            const data = await res.json();
            setTraCuuOrder(data.data || data);
            // Lấy lịch sử trạng thái đơn hàng
            const resHis = await fetch(`http://localhost:8080/lich-su-hoa-don/ma/${encodeURIComponent(traCuuMaDon.trim())}`);
            if (resHis.ok) {
                const hisData = await resHis.json();
                setTraCuuHistory(hisData.data || hisData);
            }
        } catch (err: any) {
            setTraCuuError(err.message || 'Không tìm thấy đơn hàng!');
        } finally {
            setTraCuuLoading(false);
        }
    };


    useEffect(() => {
        setLoading(true);
        fetch("http://localhost:8080/chi-tiet-san-pham/hien-thi")
            .then((res) => res.json())
            .then((data) => setProducts(data))
            .finally(() => setLoading(false));
        fetch("http://localhost:8080/thuong-hieu/hien-thi").then(res=>res.json()).then(setBrands);
        fetch("http://localhost:8080/mau-sac/hien-thi").then(res=>res.json()).then(setColors);
        fetch("http://localhost:8080/kich-co/hien-thi").then(res=>res.json()).then(setSizes);
        fetch("http://localhost:8080/danh-muc/hien-thi").then(res=>res.json()).then(setCategories);
    }, []);

    // Khi vào trang /shop, tự động lấy thông tin khách hàng đã đăng nhập nếu có
    useEffect(() => {
        const khachHang = localStorage.getItem('user') || localStorage.getItem('khachHang');
        if (khachHang) {
            const user = JSON.parse(khachHang);
            if (user.danhSachDiaChi && Array.isArray(user.danhSachDiaChi)) {
                setUserAddresses(user.danhSachDiaChi);
            } else {
                setUserAddresses([]);
            }
            setCustomerInfo((prev) => ({
                ...prev,
                name: prev.name && prev.name.trim() ? prev.name : (user.tenKhachHang || ''),
                email: prev.email && prev.email.trim() ? prev.email : (user.email || ''),
                phone: prev.phone && prev.phone.trim() ? prev.phone : (user.soDienThoai || ''),
            }));
        }
    }, []);

    const [userName, setUserName] = useState('Tài khoản');
    const [isClient, setIsClient] = useState(false);
    useEffect(() => {
        setIsClient(true);
        try {
            let userStr = localStorage.getItem('user');
            if (!userStr || userStr === '{}') {
                userStr = localStorage.getItem('khachHang') || '{}';
            }
            const user = JSON.parse(userStr);
            // Chỉ hiện tên nếu là khách hàng
            if (user && (user.vaiTro === 'KHACH_HANG' || user.idVaiTro === 3)) {
                setUserName(user.tenKhachHang || 'Khách hàng');
            } else {
                setUserName('Tài khoản');
            }
        } catch {
            setUserName('Tài khoản');
        }
    }, []);

    // Lọc sản phẩm theo filter + search + menu hãng
    const filteredProducts = products.filter(product => {
        if (product.trangThai === 'Ngừng bán') return false;
        const matchColor = selectedColors.length === 0 || colors.find(c => c.idMauSac === product.idMauSac && selectedColors.includes(c.idMauSac));
        const matchSize = selectedSizes.length === 0 || sizes.find(s => s.idKichCo === product.idKichCo && selectedSizes.includes(s.idKichCo));
        const matchBrand = selectedBrands.length === 0 || selectedBrands.includes(product.tenThuongHieu);
        const matchSearch = !search || product.tenSanPham.toLowerCase().includes(search.toLowerCase());
        return matchBrand && matchColor && matchSize && matchSearch;
    });

    // Lấy các màu và size có thể chọn cho sản phẩm đang xem
    const modalColors = selectedProduct ? colors.filter(c => c.idMauSac === selectedProduct.idMauSac || products.some(p => p.idSanPham === selectedProduct.idSanPham && p.idMauSac === c.idMauSac)) : [];
    const modalSizes = selectedProduct ? sizes.filter(s => s.idKichCo === selectedProduct.idKichCo || products.some(p => p.idSanPham === selectedProduct.idSanPham && p.idKichCo === s.idKichCo)) : [];

    // 1. Khi chọn màu sắc trong popup, đổi selectedProduct sang biến thể đúng màu
    // Thay onChange của Select màu sắc trong Dialog:
    const handleColorChange = (e: SelectChangeEvent<string>) => {
        const newColor = e.target.value;
        setModalColor(newColor);
        // Tìm biến thể cùng idSanPham, đúng màu
        const matched = products.find(
            p =>
                p.idSanPham === selectedProduct?.idSanPham &&
                p.tenMauSac === newColor
        );
        if (matched) {
            setSelectedProduct(matched);
            setModalSize(matched.tenKichCo || "");
            setModalQuantity(1);
        }
    };

    // 2. Ở danh sách sản phẩm, chỉ render mỗi màu 1 lần cho mỗi sản phẩm (theo hãng)
    const uniqueProductVariants = React.useMemo(() => {
        const seen = new Set();
        return filteredProducts.filter(p => {
            const key = `${p.idSanPham}-${p.idMauSac}`;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [filteredProducts]);

    // 2. Khi bấm 'Thêm vào giỏ', cập nhật cart và showCart
    const handleAddToCart = () => {
        if (!selectedProduct) return;
        setCart(prev => {
            const idx = prev.findIndex(item => item.product.idChiTietSanPham === selectedProduct.idChiTietSanPham);
            if (idx !== -1) {
                // Đã có, cộng dồn số lượng, không vượt quá kho
                const newCart = [...prev];
                const maxQty = selectedProduct.soLuong || 1;
                newCart[idx] = {
                    ...newCart[idx],
                    quantity: Math.min(maxQty, newCart[idx].quantity + modalQuantity)
                };
                return newCart;
            } else {
                // Thêm mới
                return [...prev, { product: selectedProduct, quantity: modalQuantity }];
            }
        });
        setModalOpen(false);
    };

    // 3. Nếu showCart=true, chỉ render giao diện giỏ hàng, ẩn filter và danh sách sản phẩm
    // Đảm bảo chỉ render nội dung khi đã ở client để tránh hydration error
    if (!isClient) return null;

    // Hàm cập nhật số lượng sản phẩm trong state products và localStorage
    const updateProductQuantity = (idChiTietSanPham: number, quantity: number) => {
      setProducts(prevProducts => prevProducts.map(p =>
        p.idChiTietSanPham === idChiTietSanPham
          ? { ...p, soLuong: (p.soLuong || 0) - quantity }
          : p
      ));
      // Nếu bạn lưu products vào localStorage, cập nhật ở đây
      const stored = localStorage.getItem('products');
      if (stored) {
        const arr = JSON.parse(stored);
        const idx = arr.findIndex((p: any) => p.idChiTietSanPham === idChiTietSanPham);
        if (idx !== -1) {
          arr[idx].soLuong = (arr[idx].soLuong || 0) - quantity;
          localStorage.setItem('products', JSON.stringify(arr));
        }
      }
    };

    return (
        <>
            {/* Nút Đăng xuất ở góc trên bên phải */}
            <Box sx={{ position: 'fixed', top: 16, right: 24, zIndex: 9999 }}>
                <Button
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLogout}
                >
                    Đăng xuất
                </Button>
            </Box>
            {/* Phần còn lại của trang */}
            <Box sx={{ background: "#f8f6ed", minHeight: "100vh", py: 0 }}>
                {/* Header */}
                <Box sx={{ width: '100%', bgcolor: '#f5e9c9', borderBottom: '1px solid #e0c97f', py: 1.5, px: 0, position: 'sticky', top: 0, zIndex: 10 }}>
                    <Box sx={{ maxWidth: 1300, mx: 'auto', display: 'flex', alignItems: 'center', gap: 2, px: 2 }}>
                        <img src="/logo.jpg" alt="logo" style={{ width: 48, height: 48, borderRadius: 12, marginRight: 12 }} />
                        <Typography variant="h5" sx={{ fontWeight: 900, color: '#b59d3a', letterSpacing: 1, mr: 4 }}>SoleKing Store</Typography>
                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', mr: 2 }}>
                            <Box sx={{ position: 'relative', width: '100%' }}>
                                <input
                                    type="text"
                                    placeholder="Tìm kiếm sản phẩm..."
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    style={{
                                        width: '100%',
                                        padding: '10px 40px 10px 16px',
                                        borderRadius: 8,
                                        border: '1.5px solid #b59d3a',
                                        fontSize: 16,
                                        outline: 'none',
                                        background: '#fffbe6',
                                        color: '#222',
                                        fontWeight: 500
                                    }}
                                />
                                <SearchIcon sx={{ position: 'absolute', right: 10, top: 8, color: '#b59d3a' }} />
                            </Box>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Button startIcon={<AccountCircleIcon />} sx={{ color: '#b59d3a', fontWeight: 700, fontSize: 16 }} onClick={() => router.push('/login')}>
                                {isClient ? userName : 'Tài khoản'}
                            </Button>
                            <Button
                                startIcon={
                                    <Badge badgeContent={cart.reduce((sum, item) => sum + item.quantity, 0)} color="error">
                                        <ShoppingCartIcon />
                                    </Badge>
                                }
                                sx={{ color: '#b59d3a', fontWeight: 700, fontSize: 16 }}
                                onClick={() => { if (!showCheckout && !showThankYou) setShowCart(true); }}
                                disabled={showCheckout || showThankYou}
                            >
                                Giỏ hàng
                            </Button>
                        </Box>
                    </Box>
                    {/* Menu hãng */}
                    <Box sx={{ maxWidth: 1300, mx: 'auto', display: 'flex', alignItems: 'center', gap: 2, px: 2, mt: 1 }}>
                        <Button
                            variant={!showWelcome ? 'contained' : 'outlined'}
                            sx={{ fontWeight: 700, borderRadius: 8, bgcolor: !showWelcome ? '#b59d3a' : '#fff', color: !showWelcome ? '#fff' : '#b59d3a', minWidth: 110 }}
                            onClick={() => { setShowWelcome(true); }}
                        >
                            Trang chủ
                        </Button>
                        <Button
                            variant={showWelcome ? 'contained' : 'outlined'}
                            sx={{ fontWeight: 700, borderRadius: 8, bgcolor: showWelcome ? '#b59d3a' : '#fff', color: showWelcome ? '#fff' : '#b59d3a', minWidth: 110 }}
                            onClick={() => { setShowWelcome(false); }}
                        >
                            Sản phẩm
                        </Button>
                        <Button
                            variant="outlined"
                            sx={{ fontWeight: 700, borderRadius: 8, color: '#b59d3a', minWidth: 110 }}
                            onClick={() => setShowTraCuuModal(true)}
                        >
                            Tra cứu
                        </Button>
                    </Box>
                </Box>
                {/* Main content */}
                {!showCart && !showCheckout && !showThankYou && (
                    <>
                        {showWelcome ? (
                            <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pt: 6, pb: 2 }}>
                                <Box sx={{ textAlign: 'center', mb: 4 }}>
                                    <img src="/logo.jpg" alt="SoleKing Store" style={{ width: 100, height: 100, borderRadius: 24, marginBottom: 16, boxShadow: '0 2px 12px #b59d3a22' }} />
                                    <Typography variant="h3" sx={{ fontWeight: 900, color: '#b59d3a', mb: 1, letterSpacing: 1 }}>
                                        Chào mừng đến với <span style={{ color: '#a88a2c' }}>SoleKing Store!</span>
                                    </Typography>
                                    <Typography variant="h6" sx={{ color: '#b59d3a', fontWeight: 500, mb: 2 }}>
                                        SoleKing Store – Nâng tầm phong cách, khẳng định chất riêng trên từng bước chân
                                    </Typography>
                                </Box>
                                <Paper elevation={0} sx={{ maxWidth: 500, mx: 'auto', mb: 4, p: 3, borderRadius: 4, bgcolor: '#fffbe6', border: '1px solid #f0e3b6' }}>
                                    <List>
                                        <ListItem>
                                            <ListItemIcon>
                                                <CheckCircleIcon sx={{ color: '#b59d3a' }} />
                                            </ListItemIcon>
                                            <ListItemText primary="Cam kết uy tín – sản phẩm chính hãng, nguồn gốc rõ ràng" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                <CheckCircleIcon sx={{ color: '#b59d3a' }} />
                                            </ListItemIcon>
                                            <ListItemText primary="Đa dạng phong cách – cập nhật xu hướng mới nhất" />
                                        </ListItem>
                                        <ListItem>
                                            <ListItemIcon>
                                                <CheckCircleIcon sx={{ color: '#b59d3a' }} />
                                            </ListItemIcon>
                                            <ListItemText primary="Chất lượng phục vụ – tận tâm, chuyên nghiệp, hỗ trợ nhanh chóng" />
                                        </ListItem>
                                    </List>
                                </Paper>
                                <Box sx={{ textAlign: 'center', color: '#a88a2c', fontSize: 18, mb: 2 }}>
                                    <div style={{ marginBottom: 8 }}>
                                        <b>Địa chỉ:</b> 123 Đường ABC, Quận Hoàn Kiếm, Hà Nội
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <b>Hotline:</b> 0123 456 789 &nbsp;|&nbsp; <b>Email:</b> contact@soleking.vn
                                    </div>
                                    <div style={{ marginBottom: 8 }}>
                                        <b>Kết nối:</b>
                                        <Link href="#" sx={{ color: '#1976d2', fontWeight: 700, mx: 1 }}>Facebook</Link>
                                        <Link href="#" sx={{ color: '#d81b60', fontWeight: 700, mx: 1 }}>Instagram</Link>
                                        <Link href="#" sx={{ color: '#0084ff', fontWeight: 700, mx: 1 }}>Zalo</Link>
                                    </div>
                                </Box>
                                <Box sx={{ width: '100%', textAlign: 'center', color: '#b59d3a', fontSize: 16, mt: 2, borderTop: '1px solid #f0e3b6', pt: 2 }}>
                                    © 2025 SoleKing Store. All rights reserved.
                                </Box>
                            </Box>
                        ) : (
                            <Box sx={{ maxWidth: 1300, mx: "auto", px: 2, display: 'flex', gap: 4, mt: 3 }}>
                                {/* Sidebar filter */}
                                <Box sx={{ width: 260, bgcolor: '#fff', borderRadius: 4, boxShadow: '0 2px 12px #b59d3a22', p: 3, height: 'fit-content', minWidth: 220 }}>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#b59d3a', mb: 2 }}>Bộ lọc</Typography>
                                    <Divider sx={{ mb: 2 }} />
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>Hãng</Typography>
                                    <FormGroup>
                                        {Array.isArray(brands) && brands.map(b => (
                                            <FormControlLabel
                                                key={b.idThuongHieu}
                                                control={<Checkbox checked={selectedBrands.includes(b.tenThuongHieu)}
                                                    onChange={e => {
                                                        setSelectedBrands(prev => e.target.checked ? [...prev, b.tenThuongHieu] : prev.filter(name => name !== b.tenThuongHieu));
                                                    }}/>}
                                                label={b.tenThuongHieu}
                                            />
                                        ))}
                                    </FormGroup>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>Màu sắc</Typography>
                                    <FormGroup>
                                        {Array.isArray(colors) && colors.map(c => (
                                            <FormControlLabel
                                                key={c.idMauSac}
                                                control={<Checkbox checked={selectedColors.includes(c.idMauSac)} onChange={e => {
                                                    setSelectedColors(prev => e.target.checked ? [...prev, c.idMauSac] : prev.filter(id => id !== c.idMauSac));
                                                }} />}
                                                label={c.mauSac}
                                            />
                                        ))}
                                    </FormGroup>
                                    <Divider sx={{ my: 2 }} />
                                    <Typography sx={{ fontWeight: 600, mb: 1 }}>Kích cỡ</Typography>
                                    <FormGroup>
                                        {Array.isArray(sizes) && sizes.map(s => (
                                            <FormControlLabel
                                                key={s.idKichCo}
                                                control={<Checkbox checked={selectedSizes.includes(s.idKichCo)} onChange={e => {
                                                    setSelectedSizes(prev => e.target.checked ? [...prev, s.idKichCo] : prev.filter(id => id !== s.idKichCo));
                                                }} />}
                                                label={s.kichCo}
                                            />
                                        ))}
                                    </FormGroup>
                                    <Divider sx={{ my: 2 }} />
                                    <Button variant="outlined" color="warning" sx={{ mt: 1, fontWeight: 600 }} onClick={() => {
                                        setSelectedColors([]); setSelectedSizes([]); setSelectedBrands([]);
                                    }}>Làm mới bộ lọc</Button>
                                </Box>
                                {/* Danh sách sản phẩm */}
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="h3" sx={{ fontWeight: 800, color: "#b59d3a", mb: 3, textAlign: "center" }}>
                                        Danh sách sản phẩm
                                    </Typography>
                                    {loading ? (
                                        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: 300 }}>
                                            <CircularProgress />
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                display: "grid",
                                                gridTemplateColumns: "repeat(3, 1fr)",
                                                gap: 4,
                                                justifyItems: "center",
                                            }}
                                        >
                                            {uniqueProductVariants.map((product) => (
                                                <Box
                                                    key={product.idChiTietSanPham}
                                                    sx={{
                                                        border: "2px solid #ffe066",
                                                        borderRadius: 4,
                                                        background: "#fff",
                                                        p: 3,
                                                        width: 320,
                                                        boxShadow: "0 2px 8px #0001",
                                                        display: "flex",
                                                        flexDirection: "column",
                                                        alignItems: "center",
                                                        mb: 3,
                                                    }}
                                                >
                                                    <Box
                                                        sx={{
                                                            background: "#fffbe6",
                                                            border: "2px solid #e6c200",
                                                            borderRadius: 2,
                                                            p: 1.5,
                                                            mb: 2,
                                                            width: 180,
                                                            height: 120,
                                                            display: "flex",
                                                            alignItems: "center",
                                                            justifyContent: "center",
                                                        }}
                                                    >
                                                        <img
                                                            src={product.duongDanHinhAnh && product.duongDanHinhAnh.trim() ?
                                                                (product.duongDanHinhAnh.startsWith('/images/')
                                                                    ? `http://localhost:8080${product.duongDanHinhAnh}`
                                                                    : product.duongDanHinhAnh.startsWith('http')
                                                                        ? product.duongDanHinhAnh
                                                                        : `http://localhost:8080/hinh-anh/view/${product.duongDanHinhAnh.replace(/^.*[\\/]/, '')}`)
                                                                : '/logo.jpg'
                                                            }
                                                            alt={product.tenSanPham}
                                                            style={{ maxWidth: "100%", maxHeight: 90, objectFit: "contain" }}
                                                        />
                                                    </Box>
                                                    <div style={{ fontWeight: 700, color: "#b48a00", fontSize: 18, marginBottom: 8, textAlign: "center" }}>
                                                        {product.tenSanPham}
                                                    </div>
                                                    <div style={{ color: "#e53935", fontWeight: 700, fontSize: 22, marginBottom: 8 }}>
                                                        {product.gia ? product.gia.toLocaleString("vi-VN") + "đ" : ""}
                                                    </div>
                                                    {/* Trên card sản phẩm, thay dòng số lượng: */}
                                                    <div style={{ color: '#666', fontWeight: 600, fontSize: 15, marginBottom: 10, textAlign: 'center' }}>
                                                        Kho: {product.soLuong ?? 0} sản phẩm
                                                    </div>
                                                    <Button
                                                        sx={{
                                                            background: "#b48a00",
                                                            color: "#fff",
                                                            fontWeight: 700,
                                                            border: "none",
                                                            borderRadius: 2,
                                                            padding: "10px 0",
                                                            width: "100%",
                                                            fontSize: 16,
                                                            cursor: "pointer",
                                                            ':hover': { background: '#a88a2c' },
                                                        }}
                                                        onClick={() => {
                                                            setSelectedProduct(product);
                                                            setModalColor(product.tenMauSac || "");
                                                            setModalSize(product.tenKichCo || "");
                                                            setModalQuantity(1);
                                                            setModalOpen(true);
                                                        }}
                                                    >
                                                        Xem sản phẩm
                                                    </Button>
                                                </Box>
                                            ))}
                                        </Box>
                                    )}
                                    {/* Popup chi tiết sản phẩm */}
                                    {modalOpen && selectedProduct && (
                                        <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
                                            <DialogTitle sx={{ fontWeight: 800, color: '#b59d3a', fontSize: 28, textAlign: 'center', pb: 0 }}>
                                                {selectedProduct.tenSanPham}
                                                <IconButton
                                                    aria-label="close"
                                                    onClick={() => setModalOpen(false)}
                                                    sx={{ position: 'absolute', right: 16, top: 16, color: '#b59d3a' }}
                                                >
                                                    <CloseIcon />
                                                </IconButton>
                                            </DialogTitle>
                                            <DialogContent sx={{ display: 'flex', gap: 4, pt: 2, pb: 3 }}>
                                                <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {selectedProduct.duongDanHinhAnh ? (
                                                        <img
                                                            src={selectedProduct.duongDanHinhAnh.trim() ?
                                                                (selectedProduct.duongDanHinhAnh.startsWith('/images/')
                                                                    ? `http://localhost:8080${selectedProduct.duongDanHinhAnh}`
                                                                    : selectedProduct.duongDanHinhAnh.startsWith('http')
                                                                        ? selectedProduct.duongDanHinhAnh
                                                                        : `http://localhost:8080/hinh-anh/view/${selectedProduct.duongDanHinhAnh.replace(/^.*[\\/]/, '')}`)
                                                                : '/logo.jpg'
                                                            }
                                                            alt={selectedProduct.tenSanPham}
                                                            style={{ maxWidth: 320, maxHeight: 240, objectFit: 'contain', border: '2px solid #ffe066', borderRadius: 12, background: '#fffbe6' }}
                                                        />
                                                    ) : (
                                                        <img src="/logo.jpg" alt="No image" style={{ maxWidth: 320, maxHeight: 240, objectFit: 'contain', border: '2px solid #ffe066', borderRadius: 12, background: '#fffbe6' }} />
                                                    )}
                                                </Box>
                                                <Box sx={{ flex: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                    <div style={{ color: "#e53935", fontWeight: 700, fontSize: 26, marginBottom: 8 }}>
                                                        {selectedProduct.gia ? selectedProduct.gia.toLocaleString("vi-VN") + "đ" : ""}
                                                    </div>
                                                    {/* 2. Trong popup, ngay dưới giá: */}
                                                    <div style={{ color: '#aaa', fontWeight: 400, fontSize: 15, marginBottom: 8 }}>
                                                        Còn {selectedProduct.soLuong ?? 0} sản phẩm trong kho
                                                    </div>
                                                    <div style={{ color: '#888', fontSize: 15, marginBottom: 8 }}>
                                                        {selectedProduct.moTa || `Mẫu giày phổ biến đến từ ${selectedProduct.tenThuongHieu || ''}`}
                                                    </div>
                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        <InputLabel>Màu sắc</InputLabel>
                                                        <Select
                                                            value={modalColor}
                                                            label="Màu sắc"
                                                            onChange={handleColorChange}
                                                        >
                                                            <MenuItem value="">-- Chọn màu --</MenuItem>
                                                            {Array.isArray(modalColors) && modalColors.map(c => (
                                                                <MenuItem key={c.idMauSac} value={c.mauSac}>{c.mauSac}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        <InputLabel>Kích cỡ</InputLabel>
                                                        <Select
                                                            value={modalSize}
                                                            label="Kích cỡ"
                                                            onChange={e => setModalSize(e.target.value as string)}
                                                        >
                                                            <MenuItem value="">-- Chọn kích cỡ --</MenuItem>
                                                            {Array.isArray(modalSizes) && modalSizes.map(s => (
                                                                <MenuItem key={s.idKichCo} value={s.kichCo}>{s.kichCo}</MenuItem>
                                                            ))}
                                                        </Select>
                                                    </FormControl>
                                                    <FormControl fullWidth sx={{ mb: 2 }}>
                                                        {/* 3. Ở input số lượng trong popup, bỏ dòng (Còn ... sản phẩm): */}
                                                        <div style={{ fontWeight: 600, color: '#b48a00', marginBottom: 4, fontSize: 16 }}>
                                                            Số lượng
                                                        </div>
                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ minWidth: 32, px: 0, fontWeight: 700, borderColor: '#b48a00', color: '#b48a00' }}
                                                                onClick={() => setModalQuantity(q => Math.max(1, q - 1))}
                                                                disabled={modalQuantity <= 1}
                                                            >
                                                                -
                                                            </Button>
                                                            <input
                                                                type="number"
                                                                min={1}
                                                                max={selectedProduct.soLuong || 1}
                                                                value={modalQuantity}
                                                                onChange={e => {
                                                                    let v = Number(e.target.value);
                                                                    if (isNaN(v)) v = 1;
                                                                    if (v < 1) v = 1;
                                                                    if (selectedProduct.soLuong && v > selectedProduct.soLuong) v = selectedProduct.soLuong;
                                                                    setModalQuantity(v);
                                                                }}
                                                                style={{ width: 60, padding: 8, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, textAlign: 'center' }}
                                                            />
                                                            <Button
                                                                variant="outlined"
                                                                size="small"
                                                                sx={{ minWidth: 32, px: 0, fontWeight: 700, borderColor: '#b48a00', color: '#b48a00' }}
                                                                onClick={() => setModalQuantity(q => selectedProduct.soLuong ? Math.min(selectedProduct.soLuong, q + 1) : q + 1)}
                                                                disabled={selectedProduct.soLuong ? modalQuantity >= selectedProduct.soLuong : false}
                                                            >
                                                                +
                                                            </Button>
                                                        </Box>
                                                    </FormControl>
                                                    <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
                                                        <Button variant="contained" sx={{ bgcolor: '#b48a00', color: '#fff', fontWeight: 700, px: 4, fontSize: 16 }} onClick={handleAddToCart}>
                                                            Thêm vào giỏ
                                                        </Button>
                                                        <Button variant="contained" sx={{ bgcolor: '#1976d2', color: '#fff', fontWeight: 700, px: 4, fontSize: 16 }}
                                                                onClick={() => {
                                                                    setCheckoutItems([{ product: selectedProduct, quantity: modalQuantity }]);
                                                                    setModalOpen(false);
                                                                    setShowCheckout(true);
                                                                }}
                                                        >
                                                            Mua ngay
                                                        </Button>
                                                        <Button variant="outlined" sx={{ color: '#b48a00', borderColor: '#b48a00', fontWeight: 700, px: 4, fontSize: 16 }} onClick={() => setModalOpen(false)}>
                                                            Đóng
                                                        </Button>
                                                    </Box>
                                                </Box>
                                            </DialogContent>
                                        </Dialog>
                                    )}
                                </Box>
                            </Box>
                        )}
                    </>
                )}
                {showCart && (
                    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4, mb: 6, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 12px #b59d3a22', p: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#b59d3a' }}>GIỎ HÀNG</Typography>
                            <Button variant="text" sx={{ color: '#b48a00', fontWeight: 700, fontSize: 22 }} onClick={() => setShowCart(false)}>ĐÓNG</Button>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                            <Box sx={{ flex: 2 }}>
                                <Box sx={{ display: 'flex', fontWeight: 700, color: '#888', mb: 2, fontSize: 17, alignItems: 'center' }}>
                                    <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                                        <Checkbox
                                            checked={selectedCartIndexes.length === cart.length && cart.length > 0}
                                            indeterminate={selectedCartIndexes.length > 0 && selectedCartIndexes.length < cart.length}
                                            onChange={e => {
                                                if (e.target.checked) setSelectedCartIndexes(cart.map((_, idx) => idx));
                                                else setSelectedCartIndexes([]);
                                            }}
                                        />
                                    </Box>
                                    <Box sx={{ flex: 3 }}>SẢN PHẨM</Box>
                                    <Box sx={{ flex: 1, textAlign: 'center' }}>SỐ LƯỢNG</Box>
                                    <Box sx={{ flex: 1, textAlign: 'right' }}>TỔNG TIỀN</Box>
                                </Box>
                                {cart.map((item, idx) => (
                                    <Box key={item.product.idChiTietSanPham} sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', py: 2 }}>
                                        <Box sx={{ width: 40, display: 'flex', justifyContent: 'center' }}>
                                            <Checkbox
                                                checked={selectedCartIndexes.includes(idx)}
                                                onChange={e => {
                                                    if (e.target.checked) setSelectedCartIndexes(prev => [...prev, idx]);
                                                    else setSelectedCartIndexes(prev => prev.filter(i => i !== idx));
                                                }}
                                            />
                                        </Box>
                                        <Box sx={{ flex: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <img src={item.product.duongDanHinhAnh && item.product.duongDanHinhAnh.trim() ?
                                                (item.product.duongDanHinhAnh.startsWith('/images/')
                                                    ? `http://localhost:8080${item.product.duongDanHinhAnh}`
                                                    : item.product.duongDanHinhAnh.startsWith('http')
                                                        ? item.product.duongDanHinhAnh
                                                        : `http://localhost:8080/hinh-anh/view/${item.product.duongDanHinhAnh.replace(/^.*[\\/]/, '')}`)
                                                : '/logo.jpg'}
                                                 alt={item.product.tenSanPham}
                                                 style={{ width: 70, height: 70, objectFit: 'contain', borderRadius: 8, border: '1px solid #eee', background: '#fafafa' }}
                                            />
                                            <Box>
                                                <div style={{ fontWeight: 700, fontSize: 17 }}>{item.product.tenSanPham}</div>
                                                <div style={{ color: '#888', fontSize: 15 }}>
                                                    [{item.product.tenKichCo} + {item.product.tenMauSac}]
                                                </div>
                                                <div style={{ color: '#b48a00', fontWeight: 600, fontSize: 14 }}>Kho: {item.product.soLuong ?? 0}</div>
                                                <div style={{ color: '#d32f2f', fontWeight: 700, fontSize: 16 }}>{item.product.gia?.toLocaleString('vi-VN')} VND</div>
                                            </Box>
                                        </Box>
                                        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                                            <Button variant="outlined" size="small" sx={{ minWidth: 28, px: 0, fontWeight: 700, borderColor: '#b48a00', color: '#b48a00' }}
                                                    onClick={() => setCart(cart => cart.map((c, i) => i === idx ? { ...c, quantity: Math.max(1, c.quantity - 1) } : c))}
                                                    disabled={item.quantity <= 1}
                                            >-</Button>
                                            <span style={{ width: 32, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>{item.quantity}</span>
                                            <Button variant="outlined" size="small" sx={{ minWidth: 28, px: 0, fontWeight: 700, borderColor: '#b48a00', color: '#b48a00' }}
                                                    onClick={() => setCart(cart => cart.map((c, i) => i === idx ? { ...c, quantity: c.product.soLuong ? Math.min(c.product.soLuong, c.quantity + 1) : c.quantity + 1 } : c))}
                                                    disabled={item.product.soLuong ? item.quantity >= item.product.soLuong : false}
                                            >+</Button>
                                        </Box>
                                        <Box sx={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#d32f2f', fontSize: 17 }}>
                                            {(item.product.gia ? item.product.gia * item.quantity : 0).toLocaleString('vi-VN')} VND
                                        </Box>
                                        <Button variant="text" color="error" sx={{ ml: 2, fontWeight: 700, fontSize: 22 }} onClick={() => {
                                            setCart(cart => cart.filter((_, i) => i !== idx));
                                            setSelectedCartIndexes(selected => selected.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
                                        }}>×</Button>
                                    </Box>
                                ))}
                                <Button variant="outlined" sx={{ mt: 3, fontWeight: 700, color: '#222', borderColor: '#b48a00' }} onClick={() => setShowCart(false)}>
                                    TIẾP TỤC MUA SẮM
                                </Button>
                            </Box>
                            <Box sx={{ flex: 1, bgcolor: '#faf8f2', borderRadius: 2, p: 3, minWidth: 260 }}>
                                <Typography variant="h6" sx={{ fontWeight: 700, color: '#b48a00', mb: 2 }}>TỔNG GIỎ HÀNG</Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1, fontSize: 16 }}>
                                    <span>Tổng tiền</span>
                                    <span style={{ color: '#d32f2f', fontWeight: 700 }}>
                    {cart.reduce((sum, item, idx) => selectedCartIndexes.includes(idx) ? sum + (item.product.gia || 0) * item.quantity : sum, 0).toLocaleString('vi-VN')} VND
                  </span>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2, fontSize: 16 }}>
                                    <span>Tiền phải trả</span>
                                    <span style={{ color: '#d32f2f', fontWeight: 700 }}>
                    {cart.reduce((sum, item, idx) => selectedCartIndexes.includes(idx) ? sum + (item.product.gia || 0) * item.quantity : sum, 0).toLocaleString('vi-VN')} VND
                  </span>
                                </Box>
                                <Button
                                    variant="contained"
                                    sx={{ width: '100%', bgcolor: '#222', color: '#fff', fontWeight: 700, fontSize: 17, mt: 2 }}
                                    disabled={selectedCartIndexes.length === 0}
                                    onClick={() => {
                                        const selectedItems = cart.filter((_, idx) => selectedCartIndexes.includes(idx));
                                        setCheckoutItems(selectedItems);
                                        setShowCart(false);
                                        setShowCheckout(true);
                                    }}
                                >
                                    THANH TOÁN
                                </Button>
                            </Box>
                        </Box>
                    </Box>
                )}
                {/* Giao diện đặt hàng */}
                {showCheckout && (
                    <Box sx={{ maxWidth: 1100, mx: 'auto', mt: 4, mb: 6, bgcolor: '#fff', borderRadius: 3, boxShadow: '0 2px 12px #b59d3a22', p: 4, display: 'flex', gap: 4 }}>
                        {/* Form khách hàng */}
                        <Box sx={{ flex: 1.2, pr: 2, display: 'flex', flexDirection: 'column', height: '100%' }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>THÔNG TIN KHÁCH HÀNG</Typography>
                            <form onSubmit={e => { e.preventDefault(); }}>
                                <Box sx={{ mb: 2 }}>
                                    <input required placeholder="Tên người nhận *" value={customerInfo.name} onChange={e => setCustomerInfo(info => ({ ...info, name: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginBottom: 12 }} />
                                    <input required type="email" placeholder="Email *" value={customerInfo.email} onChange={e => setCustomerInfo(info => ({ ...info, email: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginBottom: 12 }} />
                                    <input required placeholder="Số điện thoại *" value={customerInfo.phone} onChange={e => setCustomerInfo(info => ({ ...info, phone: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginBottom: 12 }} />
                                    {addressData.results.length === 0 ? (
                                        <div style={{ color: '#b48a00', marginBottom: 12 }}>Đang tải địa chỉ...</div>
                                    ) : (
                                        <>
                                            <select required value={customerInfo.city} onChange={e => setCustomerInfo(info => ({ ...info, city: e.target.value, district: '', ward: '' }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginBottom: 12 }}>
                                                <option value="">Tỉnh/Thành phố *</option>
                                                {Array.isArray(provinces) && provinces.map((c: string) => <option key={c} value={c}>{c}</option>)}
                                            </select>
                                            <select required value={customerInfo.district} onChange={e => setCustomerInfo(info => ({ ...info, district: e.target.value, ward: '' }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginBottom: 12 }} disabled={!customerInfo.city}>
                                                <option value="">Quận/Huyện *</option>
                                                {Array.isArray(districts) && districts.map((d: string) => <option key={d} value={d}>{d}</option>)}
                                            </select>
                                            <select required value={customerInfo.ward} onChange={e => setCustomerInfo(info => ({ ...info, ward: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginBottom: 12 }} disabled={!customerInfo.district}>
                                                <option value="">Phường/Xã *</option>
                                                {Array.isArray(wards) && wards.map((w: string) => <option key={w} value={w}>{w}</option>)}
                                            </select>
                                        </>
                                    )}
                                    <input placeholder="Địa chỉ chi tiết" value={customerInfo.address} onChange={e => setCustomerInfo(info => ({ ...info, address: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginBottom: 12 }} />
                                    <Button variant="outlined" sx={{ mb: 1 }} onClick={() => {
                                        if (userAddresses.length === 0) {
                                            setAddressError('Bạn chưa có địa chỉ');
                                            setTimeout(() => setAddressError(''), 3000);
                                            return;
                                        }
                                        setShowAddressSelect(true);
                                    }}>Chọn địa chỉ</Button>
                                    {addressError && <div style={{ color: 'red', marginBottom: 8 }}>{addressError}</div>}
                                    {/* Dialog chọn địa chỉ */}
                                    <Dialog open={showAddressSelect} onClose={() => setShowAddressSelect(false)}>
                                        <DialogTitle>Chọn địa chỉ</DialogTitle>
                                        <DialogContent>
                                            {userAddresses.map((addr, idx) => (
                                                <Button key={idx} fullWidth sx={{ mb: 1, textAlign: 'left', justifyContent: 'flex-start' }} onClick={() => {
                                                    setCustomerInfo(info => ({
                                                        ...info,
                                                        city: addr.thanhPho || '',
                                                        district: addr.quanHuyen || '',
                                                        ward: addr.xaPhuong || '',
                                                        address: addr.ngoNgach || ''
                                                    }));
                                                    setShowAddressSelect(false);
                                                }}>
                                                    {addr.thanhPho}, {addr.quanHuyen}, {addr.xaPhuong}, {addr.ngoNgach} {addr.ghiChu ? `- ${addr.ghiChu}` : ''}
                                                </Button>
                                            ))}
                                        </DialogContent>
                                    </Dialog>
                                </Box>
                                <Box sx={{ mb: 2 }}>
                                    <FormLabel>Chọn mã giảm giá</FormLabel>
                                    <select value={customerInfo.voucher} onChange={e => setCustomerInfo(info => ({ ...info, voucher: e.target.value }))} style={{ width: '100%', padding: 10, borderRadius: 6, border: '1px solid #ccc', fontSize: 16, marginTop: 6 }}>
                                        {vouchers.map(v => <option key={v.code} value={v.code}>{v.label}</option>)}
                                    </select>
                                </Box>
                            </form>
                        </Box>
                        {/* Đơn hàng */}
                        <Box sx={{ flex: 1, bgcolor: '#faf8f2', borderRadius: 2, p: 3, minWidth: 320 }}>
                            <Typography variant="h6" sx={{ fontWeight: 800, mb: 2 }}>ĐƠN ĐẶT HÀNG CỦA BẠN</Typography>
                            <Box sx={{ display: 'flex', fontWeight: 700, color: '#888', mb: 1, fontSize: 16 }}>
                                <Box sx={{ flex: 2 }}>SẢN PHẨM</Box>
                                <Box sx={{ flex: 1, textAlign: 'right' }}>TỔNG TIỀN</Box>
                            </Box>
                            {checkoutItems.map((item, idx) => (
                                <Box key={idx} sx={{ display: 'flex', alignItems: 'center', borderBottom: '1px solid #eee', py: 1 }}>
                                    <Box sx={{ flex: 2 }}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <img src={item.product.duongDanHinhAnh && item.product.duongDanHinhAnh.trim() ?
                                                (item.product.duongDanHinhAnh.startsWith('/images/')
                                                    ? `http://localhost:8080${item.product.duongDanHinhAnh}`
                                                    : item.product.duongDanHinhAnh.startsWith('http')
                                                        ? item.product.duongDanHinhAnh
                                                        : `http://localhost:8080/hinh-anh/view/${item.product.duongDanHinhAnh.replace(/^.*[\\/]/, '')}`)
                                                : '/logo.jpg'}
                                                 alt={item.product.tenSanPham}
                                                 style={{ width: 38, height: 38, objectFit: 'contain', borderRadius: 6, border: '1px solid #eee', background: '#fafafa', marginRight: 8 }}
                                            />
                                            <div>
                                                <div style={{ fontWeight: 700 }}>{item.product.tenSanPham}</div>
                                                <div style={{ color: '#888', fontSize: 14 }}>
                                                    [{item.product.tenKichCo} + {item.product.tenMauSac}]<br/>
                                                    Số lượng mua: {item.quantity}<br/>
                                                    {item.product.gia?.toLocaleString('vi-VN')} VND
                                                </div>
                                            </div>
                                        </Box>
                                    </Box>
                                    <Box sx={{ flex: 1, textAlign: 'right', fontWeight: 700, color: '#d32f2f', fontSize: 17 }}>
                                        {(item.product.gia ? item.product.gia * item.quantity : 0).toLocaleString('vi-VN')} VND
                                    </Box>
                                </Box>
                            ))}
                            {/* Tổng kết */}
                            {(() => { const { total, discount, ship, needPay } = calcCheckout(checkoutItems, customerInfo.voucher); return (
                                <>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2, fontSize: 16 }}>
                                        <span>Tổng tiền</span>
                                        <span style={{ color: '#d32f2f', fontWeight: 700 }}>{total.toLocaleString('vi-VN')} VND</span>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                                        <span>Tiền giảm</span>
                                        <span style={{ color: '#d32f2f', fontWeight: 700 }}>-{discount.toLocaleString('vi-VN')} VND</span>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: 16 }}>
                                        <span>Tiền ship</span>
                                        <span style={{ color: '#d32f2f', fontWeight: 700 }}>{ship.toLocaleString('vi-VN')} VND</span>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, fontSize: 18, fontWeight: 800 }}>
                                        <span>Tiền cần thanh toán</span>
                                        <span style={{ color: '#d32f2f', fontWeight: 800, fontSize: 20 }}>{needPay.toLocaleString('vi-VN')} VND</span>
                                    </Box>
                                    {/* Phương thức thanh toán và nút thanh toán */}
                                    <Box sx={{ mt: 3 }}>
                                        <FormLabel>Phương thức thanh toán</FormLabel>
                                        <RadioGroup row value={customerInfo.payment} onChange={e => setCustomerInfo(info => ({ ...info, payment: e.target.value }))} sx={{ mb: 2 }}>
                                            <FormControlLabel value="cod" control={<Radio />} label="Thanh toán khi nhận hàng" />
                                            <FormControlLabel value="bank" control={<Radio />} label="Chuyển khoản" />
                                        </RadioGroup>
                                    </Box>
                                    {/* QR Selector modal */}
                                    {showQRSelector && (
                                        <>
                                            {/* Chỉ hiện QrSelector khi chưa chọn QR */}
                                            {!selectedQR && (
                                                <QrSelector
                                                    amount={calcCheckout(checkoutItems, customerInfo.voucher).needPay}
                                                    autoOpen={true}
                                                    onSelect={qr => { setSelectedQR(qr); }}
                                                />
                                            )}
                                            {/* Khi đã chọn QR, chỉ hiện thông tin QR lớn */}
                                            {selectedQR && (
                                                <Box sx={{ mt: 2, mb: 2 }}>
                                                    <div style={{ background: '#f5f5f5', borderRadius: 6, padding: 12, marginTop: 12, fontSize: 16 }}>
                                                        <div style={{ fontWeight: 700 }}>
                                                            {selectedQR.bank} - {selectedQR.name}
                                                        </div>
                                                        <div>
                                                            STK: <b>{selectedQR.account}</b> ({selectedQR.bank})
                                                        </div>
                                                        <div>
                                                            Số tiền: <b>{calcCheckout(checkoutItems, customerInfo.voucher).needPay.toLocaleString()}đ</b>
                                                        </div>
                                                        <div>
                                                            Nội dung: Chuyển tiền thanh toán QR CODE
                                                        </div>
                                                        <img src={selectedQR.qrImage} alt={selectedQR.name} width={180} style={{ marginTop: 12, borderRadius: 8, border: '1px solid #ccc' }} />
                                                    </div>
                                                </Box>
                                            )}
                                        </>
                                    )}
                                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: 2, mt: 2, justifyContent: 'flex-end' }}>
                                        <Button
                                            type="button"
                                            variant="contained"
                                            sx={{ bgcolor: '#222', color: '#fff', fontWeight: 700, fontSize: 18, py: 1.5, minWidth: 160 }}
                                            onClick={() => {
                                                if (!customerInfo.name || !customerInfo.email || !customerInfo.phone || !customerInfo.city || !customerInfo.district || !customerInfo.ward) {
                                                    setCustomerFormError('Vui lòng nhập đầy đủ thông tin khách hàng!');
                                                    return;
                                                }
                                                if (customerInfo.payment === 'bank') {
                                                    if (showQRSelector) {
                                                        // Đã hiện QR, bấm lại là xác nhận đã chuyển khoản
                                                        handleOnlineCheckout();
                                                        setShowQRSelector(false);
                                                        setSelectedQR(null);
                                                        return;
                                                    }
                                                    setShowQRSelector(true); // chỉ hiện QR, không thanh toán
                                                    return;
                                                }
                                                // COD: thanh toán thật sự
                                                handleOnlineCheckout();
                                            }}
                                            disabled={!!customerFormError}
                                        >
                                            THANH TOÁN
                                        </Button>
                                    </Box>
                                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                                        <Button
                                            variant="outlined"
                                            sx={{ fontWeight: 700, color: '#b48a00', borderColor: '#b48a00', minWidth: 120 }}
                                            onClick={() => {
                                                setShowCheckout(false);
                                                setShowCart(false);
                                                setShowWelcome(true);
                                            }}
                                        >
                                            ← Quay lại
                                        </Button>
                                    </Box>
                                </>
                            )})()}
                        </Box>
                    </Box>
                )}
                {showThankYou && (
                    <Box sx={{ minHeight: '70vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pt: 6, pb: 2 }}>
                        <Box sx={{ textAlign: 'center', mb: 4, bgcolor: '#fff', borderRadius: 4, p: 4, boxShadow: 2, maxWidth: 700 }}>
                            <img src="/logo.jpg" alt="logo" style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 16, boxShadow: '0 2px 12px #b59d3a22' }} />
                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#b59d3a', mb: 1, letterSpacing: 1 }}>
                                Cảm ơn vì bạn đã đặt hàng
                            </Typography>
                            <Typography variant="h6" sx={{ color: '#888', fontWeight: 500, mb: 2 }}>
                                Đơn hàng của quý khách đã được thanh toán thành công và đang được xử lý. SoleKing Store sẽ thông báo cho quý khách khi đơn hàng được giao.
                            </Typography>
                            <Button variant="contained" sx={{ bgcolor: '#222', color: '#fff', fontWeight: 700, fontSize: 16, mt: 2 }} onClick={() => {
                                setShowThankYou(false);
                                setShowWelcome(true);
                            }}>
                                Quay lại mua hàng
                            </Button>
                        </Box>
                    </Box>
                )}
            </Box>
            {showTraCuuModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.3)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <div style={{ background: '#fff', borderRadius: 16, padding: 32, minWidth: 400, maxWidth: 600, boxShadow: '0 4px 32px #0002', position: 'relative' }}>
                        <div style={{ fontWeight: 700, fontSize: 22, marginBottom: 16, color: '#b59d3a', textAlign: 'center' }}>Tra cứu đơn hàng</div>
                        <input
                            placeholder='Nhập mã đơn hàng...'
                            value={traCuuMaDon}
                            onChange={e => setTraCuuMaDon(e.target.value)}
                            style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #b59d3a', fontSize: 16, marginBottom: 12 }}
                        />
                        <button
                            style={{ width: '100%', padding: 12, borderRadius: 8, background: '#b59d3a', color: '#fff', fontWeight: 700, fontSize: 17, border: 'none', marginBottom: 12, cursor: 'pointer' }}
                            onClick={handleTraCuu}
                            disabled={traCuuLoading}
                        >
                            {traCuuLoading ? 'Đang tra cứu...' : 'Tra cứu'}
                        </button>
                        {traCuuError && <div style={{ color: 'red', marginBottom: 10, textAlign: 'center' }}>{traCuuError}</div>}
                        {traCuuOrder && (
                            <div style={{ marginTop: 10 }}>
                                <div><b>Mã đơn hàng:</b> {traCuuOrder.maHoaDon}</div>
                                <div><b>Khách hàng:</b> {traCuuOrder.tenNguoiNhan || traCuuOrder.khachHang?.tenKhachHang || '-'}</div>
                                <div><b>Số điện thoại:</b> {traCuuOrder.soDienThoai || traCuuOrder.khachHang?.soDienThoai || '-'}</div>
                                <div><b>Địa chỉ nhận:</b> {traCuuOrder.diaChiNhanHang || '-'}</div>
                                <div><b>Trạng thái:</b> {traCuuOrder.trangThai || '-'}</div>
                                <div><b>Tổng tiền:</b> {traCuuOrder.tongTien?.toLocaleString('vi-VN') || '-'} VND</div>
                                <div><b>Ngày giao hàng:</b> {traCuuOrder.ngayGiaoHang || '-'}</div>
                                <div><b>Ghi chú:</b> {traCuuOrder.ghiChu || '-'}</div>
                                {/*<div style={{ margin: '10px 0' }}><b>Danh sách sản phẩm:</b>*/}
                                {/*    <ul style={{ margin: 0, paddingLeft: 18 }}>*/}
                                {/*        {(traCuuOrder.hoaDonChiTiets || traCuuOrder.items || []).map((ct: any, idx: number) => (*/}
                                {/*            <li key={idx}>*/}
                                {/*                {ct.tenSanPham || ct.chiTietSanPham?.tenSanPham || 'Sản phẩm'} - Số lượng: {ct.soLuong} - Giá: {ct.donGia?.toLocaleString('vi-VN') || ct.gia?.toLocaleString('vi-VN') || '-'} VND*/}
                                {/*            </li>*/}
                                {/*        ))}*/}
                                {/*    </ul>*/}
                                {/*</div>*/}
                                {traCuuHistory.length > 0 && (
                                    <div style={{ marginTop: 10 }}>
                                        <b>Lịch sử trạng thái:</b>
                                        <ul style={{ margin: 0, paddingLeft: 18 }}>
                                            {traCuuHistory.map((h, idx) => (
                                                <li key={idx}>
                                                    {h.ngayTao ? (new Date(h.ngayTao)).toLocaleString('vi-VN') + ': ' : ''}
                                                    <b>{h.trangThaiCu}</b> → <b>{h.trangThaiMoi}</b>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        )}
                        <button
                            style={{ position: 'absolute', top: 12, right: 16, background: 'none', border: 'none', fontSize: 22, color: '#b59d3a', cursor: 'pointer' }}
                            onClick={() => setShowTraCuuModal(false)}
                        >×</button>
                    </div>
                </div>
            )}
        </>
    );
} 