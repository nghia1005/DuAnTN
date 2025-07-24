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
// XÓA: import html2pdf from 'html2pdf.js';
import AdminLayout from '../../component/Admin-Layout';

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

// Định nghĩa type cho sản phẩm chi tiết phù hợp với CartList và ProductSelector
interface ProductDetail {
  idChiTietSanPham: number;
  maSanPham: string;
  tenSanPham: string;
  tenThuongHieu: string;
  tenDanhMuc: string;
  tenMauSac: string;
  tenKichCo: string;
  gia: number;
  soLuong: number;
}

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
  const [draftOrders, setDraftOrders] = useState<any[]>([]);
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

  // Hàm tạo hóa đơn mới (đưa lên trước phần render)
  const createNewOrder = () => {
    // Lấy user từ localStorage nếu có
    let user = null;
    if (typeof window !== 'undefined') {
      try {
        user = JSON.parse(localStorage.getItem('user'));
      } catch {}
    }
    // Nếu user là khách hàng, tìm trong danh sách customers
    let defaultCustomer = null;
    if (user && user.vaiTro === 'KHACH_HANG' && customers.length > 0) {
      defaultCustomer = customers.find(c => c.idKhachHang === user.idKhachHang);
    }
    // Nếu có địa chỉ mặc định thì lấy
    let defaultAddress = null;
    if (defaultCustomer && defaultCustomer.danhSachDiaChi && defaultCustomer.danhSachDiaChi.length > 0) {
      defaultAddress = defaultCustomer.danhSachDiaChi.find(addr => addr.macDinh === 'Có') || defaultCustomer.danhSachDiaChi[0];
    }
    const newOrder = {
      id: uuidv4(),
      cart: [],
      selectedProduct: null,
      selectedVoucher: null,
      isShipping: false, // Cho phép bật/tắt giao hàng
      selectedCustomer: defaultCustomer || null,
      selectedAddress: defaultAddress || null,
      shippingInfo: {
        name: defaultCustomer?.tenKhachHang || '',
        phone: defaultCustomer?.soDienThoai || '',
        city: defaultAddress?.thanhPho || '',
        district: defaultAddress?.quanHuyen || '',
        ward: defaultAddress?.xaPhuong || '',
        address: defaultAddress?.ngoNgach || '',
        note: defaultAddress?.ghiChu || '',
      },
      appliedVoucher: null,
      printInvoice: true,
      paymentMethod: null,
      productQty: 1,
    };
    setDraftOrders([...draftOrders, newOrder]);
    setActiveOrderId(newOrder.id);
  };

  // Helper lấy hóa đơn đang active
  const activeOrder = draftOrders.find(o => o.id === activeOrderId);

  // Helper tính toán giảm giá
  const calculateDiscount = (voucher: Voucher | null, total: number): number => {
    if (!voucher) return 0;
    
    if (voucher.kieuGiamGia === 'PHAN_TRAM') {
      const discountAmount = (total * voucher.phanTramGiamGia) / 100;
      return voucher.giaTriToiDa > 0 ? 
        Math.min(discountAmount, voucher.giaTriToiDa) : 
        discountAmount;
    } else {
      return voucher.giaTriToiDa;
    }
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
      setDraftOrders(prev => [...prev, newDraftOrder]);
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
        shippingInfo: {
          ...activeOrder.shippingInfo,
          city: activeOrder.selectedAddress.thanhPho || "",
          district: activeOrder.selectedAddress.quanHuyen || "",
          ward: activeOrder.selectedAddress.xaPhuong || "",
          address: activeOrder.selectedAddress.ngoNgach || "",
          note: activeOrder.selectedAddress.ghiChu || ""
        },
        shippingFee: fee
      });
    }
    // eslint-disable-next-line
  }, [activeOrder?.selectedAddress]);

  // Hàm chuyển đổi hóa đơn
  const switchOrder = (id: string) => setActiveOrderId(id);

  // Hàm xóa hóa đơn nháp
  const removeOrder = (id: string) => {
    const idx = draftOrders.findIndex(o => o.id === id);
    const newOrders = draftOrders.filter(o => o.id !== id);
    setDraftOrders(newOrders);
    if (activeOrderId === id && newOrders.length > 0) {
      setActiveOrderId(newOrders[Math.max(0, idx - 1)].id);
    }
  };

  // Hàm cập nhật trường trong hóa đơn nháp đang active
  const updateActiveOrder = (patch: Partial<any>) => {
    setDraftOrders(prev =>
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
    updateActiveOrder({ selectedCustomer: customer });
  };

  // Hàm chọn địa chỉ giao hàng
  const handleSelectAddress = (address: DiaChiDTO | null) => {
    if (address) {
      const fee = calculateShippingFee(address);
      updateActiveOrder({
        selectedAddress: address,
        shippingFee: fee,
        shippingInfo: {
          ...activeOrder.shippingInfo,
          name: activeOrder.selectedCustomer?.tenKhachHang || "",
          phone: activeOrder.selectedCustomer?.soDienThoai || "",
          city: address.thanhPho,
          district: address.quanHuyen,
          ward: address.xaPhuong,
          address: address.ngoNgach,
          note: address.ghiChu || ""
        }
      });
    } else {
      updateActiveOrder({ selectedAddress: null, shippingFee: 0 });
    }
  };

  // Sửa hàm handleSelectVoucher để nhận object voucher thay vì mã
  const handleSelectVoucher = (voucher: Voucher | null) => {
    if (!voucher) {
      updateActiveOrder({
        appliedVoucher: null,
        selectedVoucher: null
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
    if (voucher.trangThai?.toLowerCase() !== 'hoạt động') {
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
      selectedVoucher: voucher.maPhieuGiamGia
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
      // Tính toán tổng tiền
      const total = activeOrder.cart.reduce((sum: number, item: CartItem) => sum + item.gia * item.qty, 0);
      const discount = calculateDiscount(activeOrder.appliedVoucher, total);
      const shippingFee = activeOrder.shippingFee || 0;
      const finalTotal = total - discount + shippingFee;

      // Lấy thông tin nhân viên đăng nhập từ localStorage
      const user = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('user') || '{}') : {};
      const idNhanVien = user.idNhanVien || 1; // fallback nếu chưa đăng nhập
      const tenNhanVien = user.tenNhanVien || '';

      // Tạo hóa đơn
      const orderData = {
        idKhachHang: activeOrder.selectedCustomer?.idKhachHang || null,
        idNhanVien: idNhanVien,
        idPhieuGiamGia: activeOrder.appliedVoucher?.idPhieuGiamGia || null,
        loaiDon: 'Tại cửa hàng', // Luôn là tại cửa hàng dù có giao hàng
        tongTien: total,
        thanhTien: finalTotal,
        phiShip: shippingFee,
        tenNguoiNhan: activeOrder.isShipping ? activeOrder.shippingInfo.name : null,
        soDienThoai: activeOrder.isShipping ? activeOrder.shippingInfo.phone : null,
        email: activeOrder.isShipping ? activeOrder.selectedCustomer?.email : null,
        diaChiNhanHang: activeOrder.isShipping
          ? `${activeOrder.shippingInfo.address}, ${activeOrder.shippingInfo.ward}, ${activeOrder.shippingInfo.district}, ${activeOrder.shippingInfo.city}`
          : null,
        ghiChu: activeOrder.shippingInfo.note || '',
        trangThai: 'Chờ đóng gói',
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
          trangThai: 'Chờ đóng gói'
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
      setDraftOrders(prev => prev.filter(o => o.id !== activeOrderId));
      if (draftOrders.length > 1) {
        setActiveOrderId(draftOrders[0].id);
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
        },
        maHoaDon: maHoaDon
      });

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

      // Tạo hóa đơn với trạng thái 'Chờ xác nhận'
      const orderData = {
        idKhachHang: activeOrder.selectedCustomer?.idKhachHang || null,
        idNhanVien: idNhanVien,
        idPhieuGiamGia: activeOrder.appliedVoucher?.idPhieuGiamGia || null,
        loaiDon: 'Tại cửa hàng',
        tongTien: total,
        thanhTien: finalTotal,
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
      setDraftOrders(prev => prev.filter(o => o.id !== activeOrderId));
      if (draftOrders.length > 1) {
        setActiveOrderId(draftOrders[0].id);
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
        updateActiveOrder({ selectedCustomer: customerData });
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

  useEffect(() => {
    // Lắng nghe sự kiện chọn địa chỉ để tự động fill form giao hàng
    const handler = (e: any) => {
      const address = e.detail;
      if (address && activeOrder) {
        updateActiveOrder({
          shippingInfo: {
            ...activeOrder.shippingInfo,
            city: address.thanhPho || '',
            district: address.quanHuyen || '',
            ward: address.xaPhuong || '',
            address: address.ngoNgach || '',
            note: address.ghiChu || ''
          }
        });
      }
    };
    window.addEventListener('auto-fill-shipping-info', handler);
    return () => window.removeEventListener('auto-fill-shipping-info', handler);
  }, [activeOrder]);

  return (
    <div>
      {/* Toàn bộ giao diện POS */}
      <div style={{ maxWidth: 1200, margin: '30px auto', border: '1px solid #ccc', borderRadius: 8, padding: 24, background: '#fff' }}>
            {draftOrders.length === 0 ? (
          <div style={{ minHeight: 400, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <button style={{ borderRadius: '50%', width: 60, height: 60, fontSize: 32, border: '2px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={createNewOrder}>+</button>
            <div style={{ marginLeft: 24, fontSize: 20, color: '#1976d2', fontWeight: 600 }}>Tạo hóa đơn mới</div>
          </div>
            ) : (
              <>
            {/* Tabs hóa đơn và nút Thêm QR */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 8 }}>
                {draftOrders.map((order: any, i: number) => (
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
                    Hóa đơn {i + 1}
                    <span style={{ marginLeft: 8, color: '#e57373', cursor: 'pointer' }} onClick={e => { e.stopPropagation(); handleDeleteOrder(order.id); }}>×</span>
                    {/* Nút đẩy xuống chờ xác nhận chỉ cho hóa đơn đang active */}
                    {order.id === activeOrderId && (
                      <button
                        style={{ marginLeft: 12, background: '#ff9800', color: '#fff', border: 'none', borderRadius: 6, padding: '2px 10px', fontWeight: 600, cursor: 'pointer', fontSize: 13 }}
                        onClick={e => { e.stopPropagation(); handlePushToPending(); }}
                        disabled={loading}
                      >
                        Đẩy xuống chờ xác nhận
                      </button>
                    )}
                  </div>
                ))}
                <button style={{ borderRadius: '50%', width: 40, height: 40, fontSize: 24, border: '1.5px solid #1976d2', background: '#fff', color: '#1976d2', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} onClick={createNewOrder}>+</button>
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
                cart={activeOrder.cart}
                products={productDetails.map(p => ({ id: p.idChiTietSanPham, soLuong: p.soLuong }))}
                onRemoveAction={removeFromCart}
                onQtyChange={(id, qty) => {
                  const prod = productDetails.find(p => p.idChiTietSanPham === id);
                  const cartItem = activeOrder.cart.find((item: CartItem) => item.idChiTietSanPham === id);
                  if (!prod || !cartItem) return;
                  let validQty = qty;
                  if (qty > prod.soLuong + cartItem.qty) {
                    validQty = prod.soLuong + cartItem.qty;
                    toast.error('Số lượng vượt quá tồn kho!');
                  }
                  // Cập nhật tồn kho: trả lại số cũ, trừ đi số mới
                  setProductDetails(prev => prev.map(p =>
                    p.idChiTietSanPham === id
                      ? { ...p, soLuong: p.soLuong + cartItem.qty - validQty }
                      : p
                  ));
                  updateActiveOrder({
                    cart: activeOrder.cart.map((item: CartItem) =>
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
                    <div style={{ display: 'flex', gap: 10, marginBottom: 12 }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Tỉnh/Thành phố</label>
                        <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.city ?? ''} placeholder="Tỉnh/Thành phố"
                          onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, city: e.target.value } })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Quận/Huyện</label>
                        <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.district ?? ''} placeholder="Quận/Huyện"
                          onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, district: e.target.value } })} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Phường/Xã</label>
                        <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.ward ?? ''} placeholder="Phường/Xã"
                          onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, ward: e.target.value } })} />
                      </div>
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <label style={{ fontWeight: 600, marginBottom: 4, display: 'block' }}>Địa chỉ cụ thể</label>
                      <input style={{ width: '100%', padding: 10, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={activeOrder?.shippingInfo?.address ?? ''} placeholder="Địa chỉ cụ thể"
                        onChange={e => updateActiveOrder({ shippingInfo: { ...activeOrder.shippingInfo, address: e.target.value } })} />
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
                      {vouchers.filter(v => v.soLuong > 0 && v.trangThai?.toLowerCase() === 'hoạt động').map(v => (
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
                    onClick={handleDone}
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
            maxWidth: 800,
            maxHeight: '90vh',
            overflow: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h2>Hóa đơn {lastOrderForPrint.maHoaDon}</h2>
                <button
                onClick={() => setLastOrderForPrint(null)}
                style={{ background: 'none', border: 'none', fontSize: 24, cursor: 'pointer' }}
                >
                ×
                </button>
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
          <div style={{ background: '#fff', borderRadius: 14, padding: 32, minWidth: 350, maxWidth: 420, boxShadow: '0 4px 32px rgba(0,0,0,0.18)' }}>
            <h3 style={{ marginBottom: 22, fontWeight: 700, fontSize: 22, textAlign: 'center' }}>Tạo địa chỉ mới</h3>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Họ tên</label>
              <input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.name} onChange={e => setNewAddress({ ...newAddress, name: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Số điện thoại</label>
              <input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.phone} onChange={e => setNewAddress({ ...newAddress, phone: e.target.value })} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Tỉnh/Thành phố</label>
                <input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.city} onChange={e => setNewAddress({ ...newAddress, city: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Quận/Huyện</label>
                <input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.district} onChange={e => setNewAddress({ ...newAddress, district: e.target.value })} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Phường/Xã</label>
                <input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.ward} onChange={e => setNewAddress({ ...newAddress, ward: e.target.value })} />
              </div>
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Địa chỉ cụ thể</label>
              <input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.address} onChange={e => setNewAddress({ ...newAddress, address: e.target.value })} />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ fontWeight: 600, marginBottom: 6, display: 'block' }}>Ghi chú</label>
              <input style={{ width: '100%', padding: 12, borderRadius: 8, border: '1.5px solid #bdbdbd', fontSize: 15 }} value={newAddress.note} onChange={e => setNewAddress({ ...newAddress, note: e.target.value })} />
            </div>
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
              <input type="checkbox" checked={newAddress.macDinh} onChange={e => setNewAddress({ ...newAddress, macDinh: e.target.checked })} style={{ width: 18, height: 18, accentColor: '#1976d2', borderRadius: 4, marginRight: 4 }} />
              <label style={{ fontWeight: 600, userSelect: 'none' }}>Đặt làm mặc định</label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button style={{ flex: 1, background: '#1976d2', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s' }}
                      onClick={() => {
                  if (!activeOrder?.selectedCustomer) return;
                  // Thêm địa chỉ mới vào danh sách địa chỉ của khách hàng (state)
                  const diaChiMoi = {
                    idDiaChi: Date.now(),
                    idKhachHang: activeOrder.selectedCustomer.idKhachHang,
                    thanhPho: newAddress.city,
                    quanHuyen: newAddress.district,
                    xaPhuong: newAddress.ward,
                    ngoNgach: newAddress.address,
                    ghiChu: newAddress.note,
                    macDinh: newAddress.macDinh ? 'Có' : 'Không',
                  };
                  const updatedCustomer = {
                    ...activeOrder.selectedCustomer,
                    danhSachDiaChi: [
                      ...(activeOrder.selectedCustomer.danhSachDiaChi || []).map((addr: DiaChiDTO) => newAddress.macDinh ? { ...addr, macDinh: 'Không' } : addr),
                      diaChiMoi
                    ]
                  };
                  updateActiveOrder({ selectedCustomer: updatedCustomer });
                  setShowCreateAddressModal(false);
                  setNewAddress({ name: '', phone: '', city: '', district: '', ward: '', address: '', note: '', macDinh: false });
                      }}
              >Lưu</button>
              <button style={{ flex: 1, background: '#e57373', color: '#fff', border: 'none', borderRadius: 8, padding: '13px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', transition: 'background 0.2s' }}
                onClick={() => setShowCreateAddressModal(false)}
              >Hủy</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function POSPageWrapper() {
  const [activeMenu, setActiveMenu] = React.useState('pos');
  return (
    <AdminLayout activeMenu="pos" onMenuChangeAction={setActiveMenu} pageTitle="Bán hàng tại quầy">
      <POSPageInner />
    </AdminLayout>
  );
}