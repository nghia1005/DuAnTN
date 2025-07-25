'use client';
import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import { v4 as uuidv4 } from "uuid";
import CartList, { CartItem } from "./CartList";
import ProductSelector from "./ProductSelector";
import CustomerSelector from "./CustomerSelector";
import VoucherSelector, { Voucher } from "./VoucherSelector";
import QrSelector from "./QrSelector";
import PaymentSummary from "./PaymentSummary";
import InvoicePreview from "./InvoicePreview";

import AdminLayout from '../../component/Admin-Layout';
import { ProductDetail } from './types';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import AddressSelector from './AddressSelector';

// Types
type Product = { id: number; name: string; price: number; soLuong: number; };

interface DiaChiDTO {
  idDiaChi: number;
  idKhachHang: number;
  thanhPho: string;
  quanHuyen: string;
  xaPhuong: string;
  ngoNgach: string;
  ghiChu: string;
  macDinh: string;
}

interface KhachHangDTO {
  idKhachHang: number;
  maKhachHang: string;
  tenKhachHang: string;
  ngaySinh: string;
  gioiTinh: boolean;
  soDienThoai: string;
  email: string;
  trangThai: string;
  gioiTinhText: string;
  emailXacThucText: string;
  trangThaiText: string;
  soDiaChi: number;
  danhSachDiaChi: DiaChiDTO[];
}

// Xóa interface ProductDetail trong file này

type QRBankOption = {
  id: string;
  name: string;
  account: string;
  bank: string;
  qrImage: string;
};

function POSPageInner() {
  // State
  const [products, setProducts] = useState<Product[]>([]);
  const [vouchers, setVouchers] = useState<Voucher[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [activeOrderId, setActiveOrderId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{id: string}|null>(null);
  const [showProductSelector, setShowProductSelector] = useState(false);
  const [showVoucherSelector, setShowVoucherSelector] = useState(false);
  const [productDetails, setProductDetails] = useState<ProductDetail[]>([]);
  const [customers, setCustomers] = useState<KhachHangDTO[]>([]);
  const [selectedQR, setSelectedQR] = useState<QRBankOption | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [lastOrderForPrint, setLastOrderForPrint] = useState<{order: any, maHoaDon: string} | null>(null);
  const invoiceRef = useRef<HTMLDivElement>(null);
  const [orderForExport, setOrderForExport] = useState<any | null>(null);
  const [showCreateAddressModal, setShowCreateAddressModal] = useState(false);
  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    city: '',
    district: '',
    ward: '',
    address: '',
    note: '',
    macDinh: false
  });
  // State để điều khiển modal chọn QR
  const [showQRSelector, setShowQRSelector] = useState(false);
  // Thêm ref mới cho xuất PDF ngoài giao diện chính
  const invoiceExportRef = useRef<HTMLDivElement>(null);
  const [pendingOrder, setPendingOrder] = useState<any | null>(null);
  // 1. Thêm state cho hóa đơn chờ
  const [showPendingOrders, setShowPendingOrders] = useState(false);
  // 1. Thêm state orderCounter
  const [orderCounter, setOrderCounter] = useState(1);
  const [addressSuccessMessage, setAddressSuccessMessage] = useState<string | null>(null);
  const [shippingStatus, setShippingStatus] = useState('');
  // Thêm state cho trạng thái giao hàng của activeOrder
  const [shippingStatusPOS, setShippingStatusPOS] = useState('');
  const [addressData, setAddressData] = useState<any>(null);
  useEffect(() => {
    fetch('/vn-address.json')
      .then(res => res.json())
      .then(data => setAddressData(data));
  }, []);

  function getProvinceNameByIdOrName(val: string) {
    if (!addressData) return val;
    const province = (addressData.results || []).find((p: any) => p.province_id === val || p.code === val || p.province_name === val || p.name === val);
    return province?.province_name || province?.name || val;
  }
  function getDistrictNameByIdOrName(provinceIdOrName: string, val: string) {
    if (!addressData) return val;
    const province = (addressData.results || []).find((p: any) => p.province_id === provinceIdOrName || p.code === provinceIdOrName || p.province_name === provinceIdOrName || p.name === provinceIdOrName);
    const district = province?.districts?.find((d: any) => d.district_id === val || d.code === val || d.district_name === val || d.name === val);
    return district?.district_name || district?.name || val;
  }
  function getWardNameByIdOrName(provinceIdOrName: string, districtIdOrName: string, val: string) {
    if (!addressData) return val;
    const province = (addressData.results || []).find((p: any) => p.province_id === provinceIdOrName || p.code === provinceIdOrName || p.province_name === provinceIdOrName || p.name === provinceIdOrName);
    const district = province?.districts?.find((d: any) => d.district_id === districtIdOrName || d.code === districtIdOrName || d.district_name === districtIdOrName || d.name === districtIdOrName);
    const ward = district?.wards?.find((w: any) => w.ward_id === val || w.code === val || w.ward_name === val || w.name === val);
    return ward?.ward_name || ward?.name || val;
  }

  // Hàm tạo hóa đơn mới (đưa lên trước phần render)
  const createNewOrder = () => {
    const newOrder = {
      id: uuidv4(),
      orderNumber: orderCounter,
      status: 'draft',
      cart: [],
      selectedProduct: null,
      selectedVoucher: null,
      isShipping: false, // Cho phép bật/tắt giao hàng
      selectedCustomer: null,
      selectedAddress: null,
      shippingInfo: {
        name: "",
        phone: "",
        city: "",
        district: "",
        ward: "",
        address: "",
        note: "",
      },
      appliedVoucher: null,
      printInvoice: true,
      paymentMethod: null,
      productQty: 1,
    };
    setOrders([...orders, newOrder]);
    setActiveOrderId(newOrder.id);
    setOrderCounter(orderCounter + 1);
  };

  // Helper lấy hóa đơn đang active
  const activeOrder = orders.find(o => o.id === activeOrderId);

  // Helper tính toán giảm giá
  const calculateDiscount = (voucher: Voucher | null, total: number): number => {
    if (!voucher) return 0;
    if (voucher.kieuGiamGia === 'PERCENT') {
      const discountAmount = (total * voucher.phanTramGiamGia) / 100;
      return voucher.giaTriToiDa > 0 ? 
        Math.min(discountAmount, voucher.giaTriToiDa) : 
        discountAmount;
    } else if (voucher.kieuGiamGia === 'FIXED') {
      return voucher.giaTriToiDa;
    }
    return 0;
  };

  // Log cart để debug số lượng
  if (activeOrder) {
    console.log('DEBUG: CartList cart =', activeOrder.cart);
  }

  useEffect(() => {
    // Lấy chi tiết sản phẩm
    fetch("/api/chi-tiet-san-pham/hien-thi")
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => setProductDetails(data))
      .catch(() => {
        setProductDetails([]);
      });
    // Lấy sản phẩm
    fetch("/api/products")
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        setProducts(data);
        if (data.length > 0 && activeOrder?.selectedProduct === null) {
          updateActiveOrder({ selectedProduct: data[0].id });
        }
      })
      .catch(err => {
        toast.error("Không lấy được dữ liệu sản phẩm!");
        setProducts([]);
      });
    // Lấy voucher
    fetch("http://localhost:8080/api/voucher")
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        setVouchers(data);
        if (data.length > 0 && activeOrder?.selectedVoucher === null) {
          updateActiveOrder({ selectedVoucher: data[0].maPhieuGiamGia });
        }
      })
      .catch(err => {
        toast.error("Không lấy được dữ liệu voucher!");
        setVouchers([]);
      });
    // Lấy danh sách khách hàng
    fetch("http://localhost:8080/khach-hang/hien-thi")
      .then(async res => {
        if (!res.ok) throw new Error(await res.text());
        return res.json();
      })
      .then(data => {
        setCustomers(data);
        // Sau khi setCustomers, kiểm tra localStorage
        const pendingOrderStr = localStorage.getItem('pendingOrderToPOS');
        if (pendingOrderStr) {
          setPendingOrder(JSON.parse(pendingOrderStr));
          localStorage.removeItem('pendingOrderToPOS');
        }
      })
      .catch(err => {
        console.error("Không lấy được dữ liệu khách hàng:", err);
        setCustomers([]);
      });
  }, []);

  // Khi customers và pendingOrder đã có, tạo hóa đơn nháp từ pendingOrder
  useEffect(() => {
    if (pendingOrder && customers.length > 0 && productDetails.length > 0 && vouchers.length > 0) {
      const newDraftOrder = {
        id: uuidv4(),
        cart: (pendingOrder.chiTiet || []).map((item: any) => {
          const prod: ProductDetail | undefined = productDetails.find(p => p.idChiTietSanPham === item.idChiTietSanPham);
          return {
            idChiTietSanPham: item.idChiTietSanPham,
            maSanPham: prod?.maSanPham || item.maSanPham,
            tenSanPham: prod?.tenSanPham || item.tenSanPham,
            tenThuongHieu: prod?.tenThuongHieu || item.tenThuongHieu,
            tenDanhMuc: prod?.tenDanhMuc || item.tenDanhMuc,
            tenMauSac: prod?.tenMauSac || item.tenMauSac,
            tenKichCo: prod?.tenKichCo || item.tenKichCo,
            gia: prod?.gia || item.donGia || item.gia,
            qty: item.soLuong || item.qty,
            soLuong: prod?.soLuong || item.soLuong || item.qty,
          };
        }),
        selectedProduct: null,
        selectedVoucher: pendingOrder.idPhieuGiamGia || null,
        isShipping: !!pendingOrder.diaChiNhanHang,
        selectedCustomer: customers.find(c => c.idKhachHang === pendingOrder.idKhachHang) || null,
        selectedAddress: null,
        shippingInfo: {
          name: pendingOrder.tenNguoiNhan || '',
          phone: pendingOrder.soDienThoai || '',
          city: '',
          district: '',
          ward: '',
          address: pendingOrder.diaChiNhanHang || '',
          note: pendingOrder.ghiChu || '',
        },
        appliedVoucher: (pendingOrder.idPhieuGiamGia && vouchers.find(v => v.idPhieuGiamGia === pendingOrder.idPhieuGiamGia)) || null,
        printInvoice: true,
        paymentMethod: null,
        productQty: 1,
      };
      setOrders(prev => [...prev, newDraftOrder]);
      setActiveOrderId(newDraftOrder.id);
      setPendingOrder(null);
    }
  }, [pendingOrder, customers, productDetails, vouchers]);

  useEffect(() => {
    console.log("selectedQR hiện tại:", selectedQR);
  }, [selectedQR]);

  function calculateShippingFee(address: DiaChiDTO): number {
    const fullAddress = `${address.ngoNgach}, ${address.xaPhuong}, ${address.quanHuyen}, ${address.thanhPho}`.toLowerCase();
    if (fullAddress.includes('hà nội')) return 30000;
    if (fullAddress.includes('hcm') || fullAddress.includes('hồ chí minh')) return 0;
    return 35000;
  }

  useEffect(() => {
    if (activeOrder && activeOrder.selectedAddress) {
      const fee = calculateShippingFee(activeOrder.selectedAddress);
      updateActiveOrder({
        shippingFee: fee
      });
    }
    // eslint-disable-next-line
  }, [activeOrder?.selectedAddress]);

  // Hàm chuyển đổi hóa đơn
  const switchOrder = (id: string) => setActiveOrderId(id);

  // Hàm xóa hóa đơn nháp
  const removeOrder = (id: string) => {
    const idx = orders.findIndex(o => o.id === id);
    const newOrders = orders.filter(o => o.id !== id);
    setOrders(newOrders);
    if (activeOrderId === id && newOrders.length > 0) {
      setActiveOrderId(newOrders[Math.max(0, idx - 1)].id);
    }
  };

  // Hàm cập nhật trường trong hóa đơn nháp đang active
  const updateActiveOrder = (patch: Partial<any>) => {
    setOrders(prev =>
      prev.map(o => o.id === activeOrderId ? { ...o, ...patch } : o)
    );
  };

  // Hàm thêm sản phẩm vào giỏ
  const addToCart = (product: ProductDetail, qty: number) => {
    if (!product) return;
    if (qty < 1) {
      toast.error('Số lượng sản phẩm phải lớn hơn 0!');
      return;
    }
    const exist = activeOrder.cart.find((item: CartItem) => item.idChiTietSanPham === product.idChiTietSanPham);
    const currentQty = exist ? exist.qty : 0;
    if (currentQty + qty > product.soLuong) {
      toast.error('Tổng số lượng vượt quá tồn kho!');
      return;
    }
    let newCart;
    if (exist) {
      newCart = activeOrder.cart.map((i: CartItem) =>
        i.idChiTietSanPham === product.idChiTietSanPham
          ? { ...i, qty: i.qty + qty, soLuong: product.soLuong }
          : i
      );
    } else {
      newCart = [...activeOrder.cart, { ...product, qty, soLuong: product.soLuong }];
    }
    // Trừ tồn kho
    setProductDetails(prev => prev.map(p =>
      p.idChiTietSanPham === product.idChiTietSanPham
        ? { ...p, soLuong: p.soLuong - qty }
        : p
    ));
    updateActiveOrder({ cart: newCart });
  };

  // Hàm xóa sản phẩm khỏi giỏ
  const removeFromCart = (id: number) => {
    const item = activeOrder.cart.find((item: CartItem) => item.idChiTietSanPham === id);
    if (item) {
      setProductDetails(prev => prev.map(p =>
        p.idChiTietSanPham === id
          ? { ...p, soLuong: p.soLuong + item.qty }
          : p
      ));
    }
    updateActiveOrder({ cart: activeOrder && activeOrder.cart.filter((item: CartItem) => item.idChiTietSanPham !== id) });
  };
  

  // Hàm chọn khách hàng
  const handleSelectCustomer = (customer: KhachHangDTO | null) => {
    if (!customer) {
      updateActiveOrder({ selectedCustomer: null, selectedAddress: null, shippingFee: 0 });
      return;
    }
    // Tìm địa chỉ mặc định hoặc địa chỉ đầu tiên
    const defaultAddr = customer.danhSachDiaChi?.find((addr: any) => addr.macDinh === 'Có') || customer.danhSachDiaChi?.[0] || null;
    updateActiveOrder({
      selectedCustomer: customer,
      selectedAddress: defaultAddr,
    });
    if (defaultAddr) {
      // Gọi luôn handleSelectAddress để cập nhật shippingInfo đầy đủ
      setTimeout(() => handleSelectAddress(defaultAddr), 0);
    }
  };

  // Hàm chọn địa chỉ giao hàng
  const normalize = (str: string) => (str || '').toLowerCase().trim();
  const handleSelectAddress = (address: DiaChiDTO | null) => {
    if (address && addressData) {
      // Map tên sang id/code, normalize tên
      const province = (addressData.results || []).find((p: any) => normalize(p.province_name) === normalize(address.thanhPho) || normalize(p.name) === normalize(address.thanhPho));
      const cityId = province?.province_id?.toString() || province?.code?.toString() || '';
      const district = province?.districts?.find((d: any) => normalize(d.district_name) === normalize(address.quanHuyen) || normalize(d.name) === normalize(address.quanHuyen));
      const districtId = district?.district_id?.toString() || district?.code?.toString() || '';
      const ward = district?.wards?.find((w: any) => normalize(w.ward_name) === normalize(address.xaPhuong) || normalize(w.name) === normalize(address.xaPhuong));
      const wardId = ward?.ward_id?.toString() || ward?.code?.toString() || '';
      console.log('Chọn địa chỉ:', address);
      console.log('Map tên sang id:', { cityId, districtId, wardId });
      updateActiveOrder({
        selectedAddress: address,
        shippingInfo: {
          ...activeOrder.shippingInfo,
          name: activeOrder.selectedCustomer?.tenKhachHang || "",
          phone: activeOrder.selectedCustomer?.soDienThoai || "",
          city: cityId,
          district: districtId,
          ward: wardId,
          address: address.ngoNgach,
          note: address.ghiChu || ""
        }
      });
    } else {
      updateActiveOrder({ selectedAddress: null });
    }
  };

  // Sửa hàm handleSelectVoucher để nhận object voucher thay vì mã
  const handleSelectVoucher = (voucher: Voucher | null) => {
    if (!voucher) {
      updateActiveOrder({
        appliedVoucher: null,
        selectedVoucher: null,
        idPhieuGiamGia: null
      });
      return;
    }
    // Kiểm tra điều kiện áp dụng
    const now = new Date();
    const start = new Date(voucher.ngayBatDau);
    const end = new Date(voucher.ngayKetThuc);
    if (now < start || now > end) {
      toast.error("Voucher chưa đến ngày áp dụng hoặc đã hết hạn!");
      return;
    }
    if (voucher.soLuong <= 0) {
      toast.error("Voucher đã hết lượt sử dụng!");
      return;
    }
    if (voucher.trangThai !== 'Đang diễn ra') {
      toast.error("Voucher không còn hoạt động!");
      return;
    }
    // Kiểm tra giá trị tối thiểu đơn hàng nếu cần
    const total = activeOrder?.cart?.reduce((sum: number, item: CartItem) => sum + item.gia * item.qty, 0) || 0;
    if (total < voucher.giaTriToiThieu) {
      toast.error(`Đơn hàng phải từ ${voucher.giaTriToiThieu.toLocaleString()}đ mới được áp dụng voucher này!`);
      return;
    }
    updateActiveOrder({
      appliedVoucher: voucher,
      selectedVoucher: voucher.maPhieuGiamGia,
      idPhieuGiamGia: voucher.idPhieuGiamGia
    });
  };

  // Hàm hoàn thành hóa đơn
  const handleDone = async () => {
    if (!activeOrder) return;
    if (activeOrder.cart.length === 0) {
      toast.error("Giỏ hàng trống!");
      return;
    }
    if (!activeOrder.paymentMethod) {
      toast.error("Vui lòng chọn phương thức thanh toán!");
      return;
    }
    if (activeOrder.isShipping && !activeOrder.selectedCustomer) {
      toast.error("Vui lòng chọn khách hàng cho đơn giao hàng!");
      return;
    }
    setLoading(true);
    try {
      // Tính toán tổng tiền sản phẩm gốc (không trừ giảm giá)
      const total = activeOrder.cart.reduce((sum: number, item: CartItem) => sum + item.gia * item.qty, 0);
      const discount = calculateDiscount(activeOrder.appliedVoucher, total);
      const shippingFee = activeOrder.shippingFee || 0;
      const finalTotal = total - discount + shippingFee;

      // Lấy thông tin nhân viên đăng nhập từ localStorage
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const idNhanVien = user.idNhanVien || 1; // fallback nếu chưa đăng nhập
      const tenNhanVien = user.tenNhanVien || '';

      // Trước khi tạo orderData, đảm bảo shippingInfo luôn đầy đủ
      let shippingInfo = activeOrder.shippingInfo;
      if (
        activeOrder.isShipping &&
        activeOrder.selectedAddress &&
        (
          !shippingInfo.address ||
          !shippingInfo.city ||
          !shippingInfo.district ||
          !shippingInfo.ward
        )
      ) {
        shippingInfo = {
          ...shippingInfo,
          name: activeOrder.selectedCustomer?.tenKhachHang || "",
          phone: activeOrder.selectedCustomer?.soDienThoai || "",
          city: activeOrder.selectedAddress.thanhPho,
          district: activeOrder.selectedAddress.quanHuyen,
          ward: activeOrder.selectedAddress.xaPhuong,
          address: activeOrder.selectedAddress.ngoNgach,
          note: activeOrder.selectedAddress.ghiChu || ""
        };
      }

      // Tạo hóa đơn
      const orderData = {
        idKhachHang: activeOrder.selectedCustomer?.idKhachHang || null,
        idNhanVien: idNhanVien,
        idPhieuGiamGia: activeOrder.idPhieuGiamGia || (activeOrder.appliedVoucher ? activeOrder.appliedVoucher.idPhieuGiamGia : null),
        kieuGiamGia: activeOrder.appliedVoucher?.kieuGiamGia, // thêm dòng này nếu backend cần
        loaiDon: 'Tại cửa hàng', // Luôn là tại cửa hàng dù có giao hàng
        tongTien: total, // <-- Đảm bảo là tổng tiền gốc, không trừ giảm giá
        phiShip: shippingFee,
        tenNguoiNhan: activeOrder.isShipping ? shippingInfo.name : null,
        soDienThoai: activeOrder.isShipping ? shippingInfo.phone : null,
        email: activeOrder.isShipping ? activeOrder.selectedCustomer?.email : null,
        diaChiNhanHang: activeOrder.isShipping
          ? `${shippingInfo.address}, ${shippingInfo.ward}, ${shippingInfo.district}, ${shippingInfo.city}`
          : null,
        ghiChu: shippingInfo.note || '',
        trangThai: 'Đã xác nhận', // Luôn là Đã xác nhận khi tạo từ POS
        chiTiet: activeOrder.cart.map((item: CartItem) => ({
          idChiTietSanPham: item.idChiTietSanPham,
          soLuong: item.qty,
          donGia: item.gia,
          thanhTien: item.gia * item.qty
        })),
        thanhToan: {
          soTienThanhToan: finalTotal,
          phuongThucThanhToan: activeOrder.paymentMethod,
          ghiChu: '',
          trangThai: 'Đã xác nhận'
        }
      };

      const response = await fetch('http://localhost:8080/api/hoadon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Lỗi tạo hóa đơn');
      }

      const result = await response.json();
      const maHoaDon = result.data?.maHoaDon || result.maHoaDon || "---";
      // Xóa hóa đơn nháp
      setOrders(prev => prev.filter(o => o.id !== activeOrderId));
      if (orders.length > 1) {
        setActiveOrderId(orders[0].id);
      } else {
        setActiveOrderId("");
      }

      // Hiển thị thông báo thành công
      toast.success(`Hóa đơn ${maHoaDon} đã được tạo thành công!`);

      // Lưu thông tin để in
      setLastOrderForPrint({
        order: {
          ...activeOrder,
          ...result,
          chiTiet: activeOrder.cart.map((item: CartItem) => {
            const prod = productDetails.find(p => p.idChiTietSanPham === item.idChiTietSanPham);
            return {
              ...item,
              tenSanPham: prod?.tenSanPham || '',
              tenThuongHieu: prod?.tenThuongHieu || '',
              tenDanhMuc: prod?.tenDanhMuc || '',
              tenMauSac: prod?.tenMauSac || '',
              tenKichCo: prod?.tenKichCo || '',
              maSanPham: prod?.maSanPham || '',
              gia: prod?.gia || item.gia,
            };
          }),
          shippingInfo: activeOrder.shippingInfo,
          appliedVoucher: activeOrder.appliedVoucher,
          selectedQR: activeOrder.selectedQR,
          shippingFee: activeOrder.shippingFee,
          idNhanVien: idNhanVien,
          tenNhanVien: tenNhanVien,
          idKhachHang: activeOrder.selectedCustomer?.idKhachHang || '',
          tenKhachHang: activeOrder.selectedCustomer?.tenKhachHang || '',
          soDienThoaiKhachHang: activeOrder.selectedCustomer?.soDienThoai || '',
          ngayTao: new Date().toISOString(),
          giamGia: discount,
          thanhTien: finalTotal,
        },
        maHoaDon: maHoaDon
      });
      // Tự động mở hóa đơn toàn màn hình
      localStorage.setItem('lastOrderForPrint', JSON.stringify({
        order: {
          ...activeOrder,
          ...result,
          chiTiet: activeOrder.cart.map((item: CartItem) => {
            const prod = productDetails.find(p => p.idChiTietSanPham === item.idChiTietSanPham);
            return {
              ...item,
              tenSanPham: prod?.tenSanPham || '',
              tenThuongHieu: prod?.tenThuongHieu || '',
              tenDanhMuc: prod?.tenDanhMuc || '',
              tenMauSac: prod?.tenMauSac || '',
              tenKichCo: prod?.tenKichCo || '',
              maSanPham: prod?.maSanPham || '',
              gia: prod?.gia || item.gia,
            };
          }),
          shippingInfo: activeOrder.shippingInfo,
          appliedVoucher: activeOrder.appliedVoucher,
          selectedQR: activeOrder.selectedQR,
          shippingFee: activeOrder.shippingFee,
          idNhanVien: idNhanVien,
          tenNhanVien: tenNhanVien,
          idKhachHang: activeOrder.selectedCustomer?.idKhachHang || '',
          tenKhachHang: activeOrder.selectedCustomer?.tenKhachHang || '',
          soDienThoaiKhachHang: activeOrder.selectedCustomer?.soDienThoai || '',
          ngayTao: new Date().toISOString(),
          giamGia: discount,
          thanhTien: finalTotal,
        },
        maHoaDon: maHoaDon
      }));
      window.open('/XuatHoaDon', '_blank');
      setLastOrderForPrint(null);

      setDone(true);
    } catch (error) {
      console.error('Lỗi tạo hóa đơn:', error);
      toast.error('Có lỗi xảy ra khi tạo hóa đơn!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm đẩy hóa đơn nháp xuống chờ xác nhận
  const handlePushToPending = async () => {
    if (!activeOrder) return;
    if (activeOrder.cart.length === 0) {
      toast.error("Giỏ hàng trống!");
      return;
    }
    setLoading(true);
    try {
      // Tính toán tổng tiền
      const total = activeOrder.cart.reduce((sum: number, item: CartItem) => sum + item.gia * item.qty, 0);
      const discount = calculateDiscount(activeOrder.appliedVoucher, total);
      const shippingFee = activeOrder.shippingFee || 0;
      const finalTotal = total - discount + shippingFee;

      // Lấy thông tin nhân viên đăng nhập từ localStorage
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const idNhanVien = user.idNhanVien || 1; // fallback nếu chưa đăng nhập
      const tenNhanVien = user.tenNhanVien || '';

      // Trước khi tạo orderData:
      let kieuGiamGiaBackend = activeOrder.appliedVoucher?.kieuGiamGia;

      // Tạo hóa đơn với trạng thái 'Chờ xác nhận'
      const orderData = {
        idKhachHang: activeOrder.selectedCustomer?.idKhachHang || null,
        idNhanVien: idNhanVien,
        idPhieuGiamGia: activeOrder.idPhieuGiamGia || (activeOrder.appliedVoucher ? activeOrder.appliedVoucher.idPhieuGiamGia : null),
        kieuGiamGia: kieuGiamGiaBackend, // thêm dòng này nếu backend cần
        loaiDon: 'Tại cửa hàng',
        tongTien: total,
        phiShip: shippingFee,
        tenNguoiNhan: activeOrder.isShipping ? activeOrder.shippingInfo.name : null,
        soDienThoai: activeOrder.isShipping ? activeOrder.shippingInfo.phone : null,
        email: activeOrder.isShipping ? activeOrder.selectedCustomer?.email : null,
        diaChiNhanHang: activeOrder.isShipping
          ? `${activeOrder.shippingInfo.address}, ${activeOrder.shippingInfo.ward}, ${activeOrder.shippingInfo.district}, ${activeOrder.shippingInfo.city}`
          : null,
        ghiChu: activeOrder.shippingInfo.note || '',
        trangThai: 'Chờ xác nhận',
        chiTiet: activeOrder.cart.map((item: CartItem) => ({
          idChiTietSanPham: item.idChiTietSanPham,
          soLuong: item.qty,
          donGia: item.gia,
          thanhTien: item.gia * item.qty
        })),
        thanhToan: {
          soTienThanhToan: finalTotal,
          phuongThucThanhToan: activeOrder.paymentMethod,
          ghiChu: '',
          trangThai: 'Chờ xác nhận'
        }
      };

      const response = await fetch('http://localhost:8080/api/hoadon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderData)
      });

      if (!response.ok) {
        throw new Error('Lỗi tạo hóa đơn');
      }

      const result = await response.json();
      const maHoaDon = result.data?.maHoaDon || result.maHoaDon || "---";
      // Xóa hóa đơn nháp
      setOrders(prev => prev.filter(o => o.id !== activeOrderId));
      if (orders.length > 1) {
        setActiveOrderId(orders[0].id);
      } else {
        setActiveOrderId("");
      }
      toast.success(`Hóa đơn ${maHoaDon} đã được đẩy xuống chờ xác nhận!`);
    } catch (error) {
      console.error('Lỗi đẩy hóa đơn:', error);
      toast.error('Có lỗi xảy ra khi đẩy hóa đơn!');
    } finally {
      setLoading(false);
    }
  };

  // Hàm xóa hóa đơn
  const handleDeleteOrder = (id: string) => {
    setShowDeleteConfirm({ id });
  };

  const confirmDeleteOrder = () => {
    if (showDeleteConfirm) {
      removeOrder(showDeleteConfirm.id);
    setShowDeleteConfirm(null);
    }
  };

  const cancelDeleteOrder = () => setShowDeleteConfirm(null);

  const reloadSelectedCustomerAddresses = async (customerId: number) => {
    try {
      const response = await fetch(`http://localhost:8080/khach-hang/chi-tiet/${customerId}`);
      if (response.ok) {
        const customerData = await response.json();
        // Lấy địa chỉ mặc định hoặc địa chỉ cuối cùng (mới nhất)
        const defaultAddr = customerData.danhSachDiaChi?.find((addr: any) => addr.macDinh === 'Có')
          || customerData.danhSachDiaChi?.[customerData.danhSachDiaChi.length - 1]
          || null;
        updateActiveOrder({ selectedCustomer: customerData, selectedAddress: defaultAddr });
        // Đồng bộ shippingInfo nếu có địa chỉ
        if (defaultAddr && addressData) {
          // Map tên sang id/code
          const province = (addressData.results || []).find((p: any) => p.province_name === defaultAddr.thanhPho || p.name === defaultAddr.thanhPho);
          const cityId = province?.province_id || province?.code || '';
          const district = province?.districts?.find((d: any) => d.district_name === defaultAddr.quanHuyen || d.name === defaultAddr.quanHuyen);
          const districtId = district?.district_id || district?.code || '';
          const ward = district?.wards?.find((w: any) => w.ward_name === defaultAddr.xaPhuong || w.name === defaultAddr.xaPhuong);
          const wardId = ward?.ward_id || ward?.code || '';
          updateActiveOrder({
            selectedCustomer: customerData,
            selectedAddress: defaultAddr,
            shippingInfo: {
              ...activeOrder.shippingInfo,
              name: customerData.tenKhachHang || '',
              phone: customerData.soDienThoai || '',
              city: cityId,
              district: districtId,
              ward: wardId,
              address: defaultAddr.ngoNgach,
              note: defaultAddr.ghiChu || ''
            }
          });
        }
      }
    } catch (error) {
      console.error('Lỗi khi tải lại thông tin khách hàng:', error);
    }
  };

  const handleCreateAddress = async () => {
    if (!activeOrder?.selectedCustomer) {
      toast.error('Vui lòng chọn khách hàng trước!');
      return;
    }
    // Logic tạo địa chỉ mới
    toast.info('Tính năng tạo địa chỉ mới đang được phát triển');
  };

  const handleDeleteAddress = async (idDiaChi: number) => {
    try {
      const response = await fetch(`http://localhost:8080/dia-chi/xoa/${idDiaChi}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        toast.success('Xóa địa chỉ thành công!');
        await reloadSelectedCustomerAddresses(activeOrder.selectedCustomer.idKhachHang);
      } else {
        toast.error('Lỗi khi xóa địa chỉ!');
      }
    } catch (error) {
      toast.error('Lỗi khi xóa địa chỉ!');
      }
  };

  const handleRemoveCustomer = () => {
    updateActiveOrder({ selectedCustomer: null, selectedAddress: null, shippingFee: 0 });
  };

  // 2. Thêm hàm đưa hóa đơn vào chờ
  const moveToPendingOrders = () => {
    if (!activeOrder) return;
    setOrders(prev => prev.map(o => o.id === activeOrder.id ? { ...o, status: 'pending' } : o));
    toast.success("Đã đưa hóa đơn vào danh sách chờ!");
    setTimeout(() => {
      const drafts = orders.filter(o => o.status === 'draft' && o.id !== activeOrder.id);
      if (drafts.length > 0) setActiveOrderId(drafts[0].id);
      else createNewOrder();
    }, 0);
  };

  // 3. Thêm hàm lấy lại hóa đơn chờ
  const restorePendingOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'draft' } : o));
    setActiveOrderId(orderId);
    toast.success("Đã lấy hóa đơn từ danh sách chờ!");
  };

  // Helper lấy danh sách hóa đơn không trùng id giữa hai mảng
  function getUniqueOrders(primary: any[], secondary: any[]): any[] {
    return primary.filter((order: any) => !secondary.some((o: any) => o.id === order.id));
  }

  // 1. Thêm state cho modal xác nhận hoàn thành
  const [showDoneConfirm, setShowDoneConfirm] = useState(false);

  return (
    <div>
      {/* Toàn bộ giao diện POS */}
      <div style={{ maxWidth: 1200, margin: '30px auto', border: '1px solid #ccc', borderRadius: 8, padding: 24, background: '#fff' }}>
        {orders.length === 0 ? (
          <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button style={{ borderRadius: '50%', width: 60, height: 60, fontSize: 32, border: '2px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={createNewOrder}>+</button>
            <div style={{ marginLeft: 24, fontSize: 20, color: '#1976d2', fontWeight: 600 }}>Tạo hóa đơn mới</div>
          </div>
        ) : (
          <>
            {/* Tabs hóa đơn và nút Thêm QR */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {orders.filter((order: any) => order.status === 'draft').map((order: any) => (
                  <div key={order.id} style={{
                    padding: '6px 16px',
                    borderRadius: 6,
                    background: order.id === activeOrderId ? '#1976d2' : '#f5f5f5',
                    color: order.id === activeOrderId ? '#fff' : '#1976d2',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    border: '1.5px solid #1976d2',
                    fontWeight: 500,
                    marginRight: 2
                  }} onClick={() => setActiveOrderId(order.id)}>
                    Hóa đơn {order.orderNumber}
                    <span style={{ marginLeft: 8, color: '#e57373', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); handleDeleteOrder(order.id); }}>×</span>
                  </div>
                ))}
                <button style={{ borderRadius: '50%', width: 60, height: 60, fontSize: 32, border: '2px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={createNewOrder}>+</button>
                {activeOrder && (
                  <button style={{ borderRadius: '50%', width: 60, height: 60, fontSize: 24, border: '2px solid #ff9800', background: '#fffbe6', color: '#ff9800', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={moveToPendingOrders} title="Đưa hóa đơn này vào chờ">
                    ⏸
                  </button>
                )}
                {/* Nút xem hóa đơn chờ */}
                <div style={{ position: 'relative' }}>
                  <button style={{ borderRadius: '50%', width: 40, height: 40, fontSize: 18, border: '1.5px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Xem hóa đơn chờ" onClick={() => setShowPendingOrders(true)}>
                    🕒
                  </button>
                  {/* Modal danh sách hóa đơn chờ */}
                  {showPendingOrders && (
                    <div style={{ position: 'absolute', top: 50, left: 0, background: '#fff', border: '1px solid #ccc', borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.15)', zIndex: 100, minWidth: 220 }}>
                      <div style={{ padding: 8, fontWeight: 600, borderBottom: '1px solid #eee' }}>Hóa đơn chờ</div>
                      {orders.filter((order: any) => order.status === 'pending').map((order: any) => (
                        <div key={order.id} style={{ padding: 10, borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <span>Hóa đơn chờ {order.orderNumber}</span>
                          <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '2px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }} onClick={() => { restorePendingOrder(order.id); setShowPendingOrders(false); }}>Lấy lại</button>
                        </div>
                      ))}
                      <div style={{ padding: 8, textAlign: 'right' }}>
                        <button style={{ background: '#eee', color: '#333', border: 'none', borderRadius: 4, padding: '2px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }} onClick={() => setShowPendingOrders(false)}>Đóng</button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div style={{ flex: 1 }} />
            </div>
            {/* Nút chọn sản phẩm và bảng giỏ hàng */}
            <div style={{ marginBottom: 24 }}>
              <button style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '10px 24px', fontWeight: 700, fontSize: 16, marginBottom: 12 }}
                onClick={() => setShowProductSelector(true)}>
                + Chọn sản phẩm
              </button>
              <div style={{ marginTop: 12, border: '1.5px solid #222', borderRadius: 4, padding: 12 }}>
                <div style={{ fontWeight: 500, marginBottom: 8 }}>Giỏ hàng</div>
                {activeOrder && (
              <CartList
                cart={activeOrder?.cart || []}
                products={productDetails.map(p => ({ id: p.idChiTietSanPham, soLuong: p.soLuong }))}
                onRemoveAction={removeFromCart}
                onQtyChange={(id, qty) => {
                  const prod = productDetails.find(p => p.idChiTietSanPham === id);
                  const cartItem = activeOrder?.cart?.find((item: CartItem) => item.idChiTietSanPham === id);
                  if (!prod || !cartItem) return;
                  let validQty = qty;
                  if (qty > prod.soLuong + cartItem.qty) {
                    validQty = prod.soLuong + cartItem.qty;
                    toast.error('Số lượng vượt quá tồn kho!');
                  }
                  setProductDetails(prev => prev.map(p =>
                    p.idChiTietSanPham === id
                      ? { ...p, soLuong: p.soLuong + cartItem.qty - validQty }
                      : p
                  ));
                  updateActiveOrder({
                    cart: (activeOrder?.cart || []).map((item: CartItem) =>
                      item.idChiTietSanPham === id ? { ...item, qty: validQty } : item
                    )
                  });
                }}
              />
                )}
        </div>
                        </div>
            {/* Hai cột giao hàng và thanh toán */}
            <div style={{ display: 'flex', gap: 24 }}>
              {/* Cột trái: Thông tin giao hàng */}
              <div style={{ flex: 1, border: '2px dashed #90caf9', borderRadius: 14, padding: 24, minWidth: 380, background: '#fafdff', marginBottom: 16 }}>
                {/* Checkbox giao hàng */}
                <div style={{ marginBottom: 16 }}>
                  <label style={{ fontWeight: 600, fontSize: 16 }}>
                    <input
                      type="checkbox"
                      checked={!!activeOrder?.isShipping}
                      onChange={e => updateActiveOrder({ isShipping: e.target.checked })}
                      style={{ marginRight: 8, width: 18, height: 18 }}
                    />
                    Giao hàng
                  </label>
                </div>
                {/* Chỉ hiển thị form địa chỉ khi isShipping === true */}
                {activeOrder?.isShipping && (
                  <>
                    {activeOrder?.selectedCustomer && (
                      <div style={{
                        background: '#e3f2fd',
                        border: '1.5px solid #1976d2',
                        borderRadius: 10,
                        padding: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        marginBottom: 16
                      }}>
                        <div style={{ flex: 1 }}>
                          <span style={{ fontWeight: 700, color: '#1976d2', fontSize: 16 }}>
                            {activeOrder.selectedCustomer.tenKhachHang} ({activeOrder.selectedCustomer.maKhachHang})
                          </span>
                          <div style={{ fontSize: 13, color: '#333' }}>
                            {activeOrder.selectedCustomer.soDienThoai} • {activeOrder.selectedCustomer.email}
                          </div>
                        </div>
                        <button onClick={handleRemoveCustomer} style={{
                          background: '#ffcdd2',
                          color: '#c62828',
                          border: 'none',
                          borderRadius: 6,
                          fontWeight: 700,
                          fontSize: 18,
                          width: 32,
                          height: 32,
                          cursor: 'pointer',
                          transition: 'background 0.2s'
                        }}>×</button>
                      </div>
                    )}
                    {/* Địa chỉ giao hàng */}
                    {activeOrder?.selectedAddress && (
                      <div style={{
                        background: '#e3f2fd',
                        borderRadius: 8,
                        padding: 12,
                        marginBottom: 12,
                        border: '1px solid #90caf9'
                      }}>
                        <div style={{ fontWeight: 600, color: '#1976d2', marginBottom: 4 }}>
                          <span role="img" aria-label="location">📍</span> {activeOrder.selectedAddress.ngoNgach}
                        </div>
                        <div style={{ color: '#333', fontSize: 14 }}>
                          <span role="img" aria-label="city">🏡</span> {activeOrder.selectedAddress.quanHuyen}, {activeOrder.selectedAddress.thanhPho}
                        </div>
                        <div style={{ color: '#666', fontSize: 13 }}>
                          <span role="img" aria-label="note">📝</span> Ghi chú: {activeOrder.selectedAddress.ghiChu}
                        </div>
                      </div>
                    )}
                    {/* Form nhập địa chỉ giao hàng */}
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Họ tên</label>
                        <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.name ?? ''} placeholder="Họ tên"
                          onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, name: e.target.value } })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Số điện thoại</label>
                        <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.phone ?? ''} placeholder="Số điện thoại"
                          onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, phone: e.target.value } })} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      {(() => { console.log('shippingInfo:', activeOrder?.shippingInfo); return null; })()}
                      <AddressSelector
                        key={
                          (activeOrder?.shippingInfo?.city || '') +
                          '-' +
                          (activeOrder?.shippingInfo?.district || '') +
                          '-' +
                          (activeOrder?.shippingInfo?.ward || '')
                        }
                        value={{
                          city: activeOrder?.shippingInfo?.city || '',
                          district: activeOrder?.shippingInfo?.district || '',
                          ward: activeOrder?.shippingInfo?.ward || '',
                        }}
                        onChange={(val) => {
                          console.log('AddressSelector onChange:', val);
                          updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, ...val } })
                        }}
                      />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Địa chỉ cụ thể</label>
                      <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.address ?? ''} placeholder="Địa chỉ cụ thể"
                        onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, address: e.target.value } })} />
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Trạng thái giao hàng</label>
                      <select
                        style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15, marginBottom: 8 }}
                        value={shippingStatusPOS}
                        onChange={e => {
                          setShippingStatusPOS(e.target.value);
                          if (e.target.value === 'Giao giờ hành chính') updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, note: 'Giao giờ hành chính (8h-17h)' } });
                          else if (e.target.value === 'Giao ngoài giờ') updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, note: 'Giao ngoài giờ hành chính' } });
                          else if (e.target.value === 'Giao nhanh') updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, note: 'Giao nhanh trong ngày' } });
                          else updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, note: '' } });
                        }}
                      >
                        <option value="">Chọn trạng thái giao hàng</option>
                        <option value="Giao giờ hành chính">Giao giờ hành chính</option>
                        <option value="Giao ngoài giờ">Giao ngoài giờ</option>
                        <option value="Giao nhanh">Giao nhanh</option>
                        <option value="Khác">Khác...</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Ghi chú cho người vận chuyển</label>
                      <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.note ?? ''} placeholder="Ghi chú cho người vận chuyển"
                        onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, note: e.target.value } })} />
                    </div>
                    <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                      <button style={{ flex: 1, background: '#43a047', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                        onClick={() => {
                          if (!activeOrder?.selectedCustomer) return;
                          const defaultAddr = activeOrder.selectedCustomer.danhSachDiaChi?.find((addr: DiaChiDTO) => addr.macDinh === 'Có') || activeOrder.selectedCustomer.danhSachDiaChi?.[0];
                          updateActiveOrder({
                            shippingInfo: {
                              ...activeOrder.shippingInfo,
                              name: activeOrder.selectedCustomer.tenKhachHang || '',
                              phone: activeOrder.selectedCustomer.soDienThoai || '',
                              city: defaultAddr?.thanhPho || '',
                              district: defaultAddr?.quanHuyen || '',
                              ward: defaultAddr?.xaPhuong || '',
                              address: defaultAddr?.ngoNgach || '',
                              note: defaultAddr?.ghiChu || ''
                            }
                          });
                        }}
                      >
                        <span style={{ fontSize: 20 }}>🟩</span> Tự động điền thông tin khách hàng
                      </button>
                      <button style={{ flex: 1, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '12px 0', fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, cursor: 'pointer', transition: 'background 0.2s' }}
                        onClick={() => {
                          setNewAddress({
                            name: activeOrder?.selectedCustomer?.tenKhachHang || '',
                            phone: activeOrder?.selectedCustomer?.soDienThoai || '',
                            city: '',
                            district: '',
                            ward: '',
                            address: '',
                            note: '',
                            macDinh: false
                          });
                          setShowCreateAddressModal(true);
                        }}
                      >
                        <span style={{ fontSize: 20 }}>➕</span> Tạo địa chỉ mới
                      </button>
                    </div>
                    {/* Danh sách địa chỉ */}
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontWeight: 600, marginBottom: 4 }}>Danh sách địa chỉ:</div>
                      <div style={{ fontSize: 15, color: '#333' }}>
                        {activeOrder?.selectedCustomer?.danhSachDiaChi?.map((addr: DiaChiDTO, idx: number) => (
                          <div key={addr.idDiaChi} style={{ marginBottom: 4, padding: '4px 0', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span role="img" aria-label="location">📍</span> {addr.ngoNgach}, {addr.xaPhuong}, {addr.quanHuyen}, {addr.thanhPho} {addr.macDinh === 'Có' && <b>(Mặc định)</b>}
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Cột phải: Thông tin thanh toán */}
              <div style={{ flex: 1, border: '2px dashed #b3d4fc', borderRadius: 8, padding: 16, minWidth: 380 }}>
                {/* Chọn khách hàng */}
                <div style={{ marginBottom: 16 }}>
              <CustomerSelector
                    selectedCustomer={activeOrder?.selectedCustomer}
                onCustomerSelectAction={handleSelectCustomer}
                onAddressSelectAction={handleSelectAddress}
                    selectedAddress={activeOrder?.selectedAddress}
                    isShipping={activeOrder?.isShipping}
                  />
                  {/* Combobox chọn phiếu giảm giá */}
                  <div style={{ marginTop: 8 }}>
                    <label style={{ fontWeight: 600 }}>Chọn phiếu giảm giá:</label>
                    <select
                      style={{ width: '100%', padding: 8, borderRadius: 6, border: '1px solid #bbb', marginTop: 4 }}
                      value={activeOrder?.appliedVoucher?.maPhieuGiamGia || ''}
                      onChange={e => {
                        const code = e.target.value;
                        const voucher = vouchers.find(v => v.maPhieuGiamGia === code) || null;
                        handleSelectVoucher(voucher);
                        // Nếu chọn voucher FREE_SHIP thì set phí ship về 0, ngược lại tính lại phí ship nếu có địa chỉ
                        if (voucher && voucher.kieuGiamGia === 'FREE_SHIP') {
                          updateActiveOrder({ shippingFee: 0 });
                        } else if (activeOrder?.selectedAddress) {
                          const fee = calculateShippingFee(activeOrder.selectedAddress);
                          updateActiveOrder({ shippingFee: fee });
                        }
                      }}
                    >
                      <option value=''>-- Không áp dụng --</option>
                      {vouchers
                        .filter(v => v.soLuong > 0 && v.trangThai === 'Đang diễn ra')
                        .sort((a, b) => {
                          // Ưu tiên giảm giá cao nhất (theo giá trị tối đa hoặc phần trăm), sau đó đến số lượng còn lại nhiều nhất
                          const aDiscount = a.kieuGiamGia === 'PERCENT' ? (a.phanTramGiamGia * 1000000 + a.giaTriToiDa) : a.giaTriToiDa;
                          const bDiscount = b.kieuGiamGia === 'PERCENT' ? (b.phanTramGiamGia * 1000000 + b.giaTriToiDa) : b.giaTriToiDa;
                          if (bDiscount !== aDiscount) return bDiscount - aDiscount;
                          return b.soLuong - a.soLuong;
                        })
                        .map(v => (
                          <option key={v.maPhieuGiamGia} value={v.maPhieuGiamGia}>
                            {v.tenPhieuGiamGia} ({v.maPhieuGiamGia})
                          </option>
                        ))}
                    </select>
                  </div>
                </div>
                {/* Địa chỉ giao hàng chỉ hiện khi đã chọn khách hàng và có địa chỉ */}
                
                {/* Nếu đã chọn khách hàng nhưng không có địa chỉ thì báo */}
                {activeOrder?.selectedCustomer && (!activeOrder.selectedCustomer.danhSachDiaChi || activeOrder.selectedCustomer.danhSachDiaChi.length === 0) && (
                  <div style={{ color: '#e57373', marginBottom: 8 }}>Khách hàng chưa có địa chỉ giao hàng.</div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <label style={{ fontWeight: 600 }}>Giao hàng:</label>
                  <input type="checkbox" checked={!!activeOrder?.isShipping} style={{ width: 20, height: 20 }}
                    onChange={e => updateActiveOrder({ isShipping: e.target.checked })} />
                  <span style={{ marginLeft: 8, color: '#1976d2', fontWeight: 600 }}></span>
                </div>
                <PaymentSummary
                  cart={activeOrder.cart}
                  voucher={activeOrder.appliedVoucher}
                  shipping={activeOrder.shippingFee || 0}
                  originalShipping={activeOrder.originalShippingFee || 0}
                  paymentMethod={activeOrder.paymentMethod}
                  selectedQR={activeOrder.selectedQR}
                  onSelectQR={qr => updateActiveOrder({ selectedQR: qr })}
                />
                <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
                  <button
                    style={{
                      flex: 1,
                      background: activeOrder.paymentMethod === 'TIEN_MAT' ? '#1976d2' : '#fff',
                      color: activeOrder.paymentMethod === 'TIEN_MAT' ? '#fff' : '#1976d2',
                      border: '1.5px solid #1976d2',
                      borderRadius: 4,
                      padding: '10px 0',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => updateActiveOrder({ paymentMethod: 'TIEN_MAT' })}
                  >
                    Tiền mặt
                  </button>
                  <button
                    style={{
                      flex: 1,
                      background: activeOrder.paymentMethod === 'QR' ? '#1976d2' : '#fff',
                      color: activeOrder.paymentMethod === 'QR' ? '#fff' : '#1976d2',
                      border: '1.5px solid #1976d2',
                      borderRadius: 4,
                      padding: '10px 0',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                    onClick={() => updateActiveOrder({ paymentMethod: 'QR' })}
                  >
                    QR
                  </button>
                  {/* Nút chọn QR chỉ hiện khi đã chọn phương thức QR */}
                  {activeOrder.paymentMethod === 'QR' && (
                    <button
                      style={{ background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '8px 16px', fontWeight: 600 }}
                      onClick={() => setShowQRSelector(true)}
                    >
                      Chọn mã QR
                    </button>
                  )}
                </div>
                {activeOrder.paymentMethod === 'QR' && activeOrder.selectedQR && (
  <div style={{ background: '#e3f2fd', borderRadius: 10, padding: 12, margin: '16px 0', display: 'flex', alignItems: 'flex-start', gap: 16 }}>
    <div>
      <img src={activeOrder.selectedQR.qrImage} alt={activeOrder.selectedQR.name} style={{ width: 120, borderRadius: 4, background: '#fff' }} />
    </div>
    <div style={{ fontSize: 16 }}>
      <div style={{ fontWeight: 700, marginBottom: 4 }}>
        Đã chọn QR: {activeOrder.selectedQR.bank} - {activeOrder.selectedQR.name} ({activeOrder.selectedQR.bank})
      </div>
      <div>STK: <b>{activeOrder.selectedQR.account}</b> ({activeOrder.selectedQR.bank})</div>
      <div>Số tiền: <b>{(activeOrder.cart.reduce((sum: number, item: CartItem) => sum + item.gia * item.qty, 0) - (activeOrder.appliedVoucher?.giaTriToiDa || 0) + (activeOrder.shippingFee || 0)).toLocaleString()}đ</b></div>
      <div>Nội dung: Chuyển tiền thanh toán QR CODE</div>
    </div>
  </div>
)}
                {/* Nút xác nhận hoàn thành và xuất PDF ngoài giao diện chính */}
                <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
                  <button
                    onClick={() => setShowDoneConfirm(true)}
                    style={{ flex: 1, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 4, padding: '12px 0', fontWeight: 600 }}
                  >
                    Xác nhận hoàn thành
                  </button>
                  <button
                    onClick={async () => {
                      console.log('invoiceExportRef.current:', invoiceExportRef.current);
                      if (invoiceExportRef.current) {
                        const html2pdf = (await import('html2pdf.js')).default;
                        html2pdf().from(invoiceExportRef.current).save('hoa-don.pdf');
                      }
                    }}
                    style={{ flex: 1, background: '#bfa22f', color: '#fff', border: 'none', borderRadius: 4, padding: '12px 0', fontWeight: 600 }}
                  >
                    Xuất hóa đơn PDF
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modal chọn sản phẩm */}
      {showProductSelector && (
        <ProductSelector
          products={productDetails}
          onSelectAction={(product, qty) => {
            addToCart(product, qty);
            setShowProductSelector(false);
          }}
          onCloseAction={() => setShowProductSelector(false)}
        />
      )}

      {/* Modal xác nhận xóa */}
      {showDeleteConfirm && (
                <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 400,
            textAlign: 'center'
                }}>
            <h3>Xác nhận xóa</h3>
            <p>Bạn có chắc chắn muốn xóa hóa đơn này?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={confirmDeleteOrder} style={{ padding: '8px 16px', background: '#dc3545', color: 'white', border: 'none', borderRadius: 4 }}>Xóa</button>
              <button onClick={cancelDeleteOrder} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4 }}>Hủy</button>
                  </div>
                  </div>
                  </div>
      )}

      {/* Modal QR */}
      {showQRModal && selectedQR && (
                <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
                }}>
          <div style={{
            background: 'white',
            padding: 32,
            borderRadius: 12,
            textAlign: 'center',
            maxWidth: 400
          }}>
            <h2>Thanh toán QR</h2>
            <div style={{ marginBottom: 16 }}>
              <img src={selectedQR.qrImage} alt={selectedQR.name} style={{ width: 200, height: 200 }} />
                </div>
            <div style={{ marginBottom: 16 }}>
              <strong>{selectedQR.name}</strong><br />
              {selectedQR.account} ({selectedQR.bank})
              </div>
            <div style={{ marginBottom: 16, fontSize: 18, fontWeight: 'bold' }}>
              Số tiền: {(activeOrder?.cart?.reduce((sum: number, item: CartItem) => sum + item.gia * item.qty, 0) || 0).toLocaleString()}đ
            </div>
                <button
              onClick={() => setShowQRModal(false)}
              style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}
            >
              Đóng
            </button>
              </div>
        </div>
      )}

      {/* Modal chọn QR */}
      {showQRSelector && (
        <QrSelector
          amount={activeOrder.cart.reduce((sum: number, item: CartItem) => sum + item.gia * item.qty, 0) - (activeOrder.appliedVoucher?.giaTriToiDa || 0) + (activeOrder.shippingFee || 0)}
          onSelect={qr => {
            setSelectedQR(qr);
            updateActiveOrder({ selectedQR: qr });
            setShowQRSelector(false);
          }}
          showOnlySelect={true}
          autoOpen={true}
        />
      )}

      {/* Modal in hóa đơn */}
      {lastOrderForPrint && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            width: 'auto',
            minWidth: 820,
            boxSizing: 'border-box',
            overflow: 'visible',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            </div>
            <div ref={invoiceRef}>
              <InvoicePreview order={lastOrderForPrint.order} maHoaDon={lastOrderForPrint.maHoaDon} />
            </div>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
                <button
                  onClick={() => {
                  // Logic in hóa đơn
                  window.print();
                }}
                style={{ padding: '8px 16px', background: '#007bff', color: 'white', border: 'none', borderRadius: 4 }}
              >
                🖨️ In hóa đơn
              </button>
              <button
                onClick={async () => {
                  console.log('invoiceRef.current:', invoiceRef.current);
                  if (invoiceRef.current) {
                    const html2pdf = (await import('html2pdf.js')).default;
                    html2pdf().from(invoiceRef.current).save('hoa-don.pdf');
                  }
                }}
                style={{ padding: '8px 16px', background: '#43a047', color: 'white', border: 'none', borderRadius: 4 }}
              >
                📄 Xuất hóa đơn PDF
              </button>
              <button
                onClick={() => {
                  if (lastOrderForPrint) {
                    localStorage.setItem('lastOrderForPrint', JSON.stringify(lastOrderForPrint));
                    window.open('/XuatHoaDon', '_blank');
                  }
                }}
                style={{ padding: '8px 16px', background: '#ff9800', color: 'white', border: 'none', borderRadius: 4 }}
              >
                Mở hóa đơn toàn màn hình
              </button>
              <button 
                onClick={() => setLastOrderForPrint(null)}
                style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4 }}
                >
                Đóng
                </button>
              </div>
                </div>
            </div>
      )}

      {showCreateAddressModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <div style={{ background: '#fff', borderRadius: 20, padding: 40, minWidth: 500, maxWidth: 600, boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ marginBottom: 32, fontWeight: 700, fontSize: 26, textAlign: 'center', letterSpacing: 0.5 }}>Tạo địa chỉ mới</h3>
            <form style={{ display: 'flex', flexDirection: 'column', gap: 22 }} onSubmit={e => { e.preventDefault(); }}>
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', fontSize: 16 }}>Họ tên</label>
                  <input style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', fontSize: 16 }} value={newAddress.name} onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', fontSize: 16 }}>Số điện thoại</label>
                  <input style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', fontSize: 16 }} value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
                </div>
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', fontSize: 16 }}>Địa chỉ</label>
                <AddressSelector
                  value={{
                    city: newAddress.city,
                    district: newAddress.district,
                    ward: newAddress.ward,
                  }}
                  onChange={(val) => setNewAddress({ ...newAddress, ...val })}
                />
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', fontSize: 16 }}>Địa chỉ cụ thể</label>
                <input style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.address} onChange={e => setNewAddress({ ...newAddress, address: e.target.value })} />
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', fontSize: 16 }}>Trạng thái giao hàng</label>
                <select
                  style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', fontSize: 15, marginBottom: 10 }}
                  value={shippingStatus}
                  onChange={e => {
                    setShippingStatus(e.target.value);
                    if (e.target.value === 'Giao giờ hành chính') setNewAddress({ ...newAddress, note: 'Giao giờ hành chính (8h-17h)' });
                    else if (e.target.value === 'Giao ngoài giờ') setNewAddress({ ...newAddress, note: 'Giao ngoài giờ hành chính' });
                    else if (e.target.value === 'Giao nhanh') setNewAddress({ ...newAddress, note: 'Giao nhanh trong ngày' });
                    else setNewAddress({ ...newAddress, note: '' });
                  }}
                >
                  <option value="">Chọn trạng thái giao hàng</option>
                  <option value="Giao giờ hành chính">Giao giờ hành chính</option>
                  <option value="Giao ngoài giờ">Giao ngoài giờ</option>
                  <option value="Giao nhanh">Giao nhanh</option>
                  <option value="Khác">Khác...</option>
                </select>
              </div>
              <div>
                <label style={{ fontWeight: 600, marginBottom: 8, display: 'block', fontSize: 16 }}>Ghi chú</label>
                <input style={{ width: '100%', padding: 14, borderRadius: 10, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.note} onChange={e => setNewAddress({ ...newAddress, note: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
                <input type="checkbox" checked={newAddress.macDinh} onChange={e => setNewAddress({ ...newAddress, macDinh: e.target.checked })} style={{ width: 20, height: 20, accentColor: '#1976d2', borderRadius: 4, marginRight: 8 }} />
                <label style={{ fontWeight: 600, userSelect: 'none', fontSize: 16 }}>Đặt làm mặc định</label>
              </div>
              <div style={{ display: 'flex', gap: 22, marginTop: 18 }}>
                <button type="button" style={{ flex: 1, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 10, padding: '15px 0', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={async () => {
                    if (!activeOrder?.selectedCustomer) return;
                    const diaChiMoi = {
                      thanhPho: getProvinceNameByIdOrName(newAddress.city),
                      quanHuyen: getDistrictNameByIdOrName(newAddress.city, newAddress.district),
                      xaPhuong: getWardNameByIdOrName(newAddress.city, newAddress.district, newAddress.ward),
                      ngoNgach: newAddress.address,
                      ghiChu: newAddress.note,
                      macDinh: newAddress.macDinh ? 'Có' : 'Không',
                    };
                    try {
                      const response = await fetch(`http://localhost:8080/khach-hang/${activeOrder.selectedCustomer.idKhachHang}/dia-chi`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(diaChiMoi),
                      });
                      if (response.ok) {
                        await reloadSelectedCustomerAddresses(activeOrder.selectedCustomer.idKhachHang);
                        setShowCreateAddressModal(false);
                        setNewAddress({ name: '', phone: '', city: '', district: '', ward: '', address: '', note: '', macDinh: false });
                        setAddressSuccessMessage('Tạo địa chỉ mới thành công!');
                        setTimeout(() => setAddressSuccessMessage(null), 2500);
                      } else {
                        alert('Lưu địa chỉ thất bại!');
                      }
                    } catch (error) {
                      alert('Có lỗi khi lưu địa chỉ!');
                    }
                  }}
                >
                  Lưu
                </button>
                <button type="button" style={{ flex: 1, background: '#e57373', color: '#fff', border: 'none', borderRadius: 10, padding: '15px 0', fontWeight: 700, fontSize: 18, cursor: 'pointer', transition: 'background 0.2s' }}
                  onClick={() => setShowCreateAddressModal(false)}
                >Hủy</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {addressSuccessMessage && (
        <div style={{
          position: 'fixed',
          top: 24,
          right: 24,
          background: '#4caf50',
          color: '#fff',
          padding: '14px 28px',
          borderRadius: 8,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          fontWeight: 600,
          fontSize: 16,
          zIndex: 4000
        }}>
          {addressSuccessMessage}
        </div>
      )}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      {/* Modal xác nhận hoàn thành */}
      {showDoneConfirm && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 2000
        }}>
          <div style={{
            background: 'white',
            padding: 24,
            borderRadius: 8,
            maxWidth: 400,
            textAlign: 'center'
          }}>
            <h3>Xác nhận hoàn thành</h3>
            <p>Bạn có muốn xác nhận hoàn thành không?</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
              <button onClick={() => { setShowDoneConfirm(false); handleDone(); }} style={{ padding: '8px 16px', background: '#1976d2', color: 'white', border: 'none', borderRadius: 4 }}>Xác nhận</button>
              <button onClick={() => setShowDoneConfirm(false)} style={{ padding: '8px 16px', background: '#6c757d', color: 'white', border: 'none', borderRadius: 4 }}>Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function POSPage() {
  const [activeMenu, setActiveMenu] = React.useState('pos');
  return (
    <AdminLayout activeMenu="pos" onMenuChangeAction={setActiveMenu} pageTitle="Bán hàng tại quầy">
      <POSPageInner />
    </AdminLayout>
  );
}