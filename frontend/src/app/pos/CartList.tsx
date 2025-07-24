'use client';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export type CartItem = {
  idChiTietSanPham: number;
  tenSanPham: string;
  maSanPham?: string;
  tenDanhMuc?: string;
  tenThuongHieu?: string;
  tenMauSac?: string;
  tenKichCo?: string;
  gia: number;
  qty: number;
  soLuong?: number; // tồn kho, optional
  // ... các trường khác nếu cần
};

interface Props {
  cart: CartItem[];
  products: { id: number; soLuong: number }[];
  onRemoveAction: (id: number) => void;
  onQtyChange?: (id: number, qty: number) => void;
}

export default function CartList({ cart, products, onRemoveAction, onQtyChange }: Props) {
  // State tạm cho input số lượng
  const [inputValues, setInputValues] = useState<{ [id: number]: string }>({});

  const handleInputChange = (id: number, value: string) => {
    setInputValues(prev => ({ ...prev, [id]: value }));
  };

  const handleInputBlur = (item: CartItem) => {
    const value = inputValues[item.idChiTietSanPham] ?? item.qty.toString();
    const num = Number(value);
    const prod = products.find(p => p.id === item.idChiTietSanPham);
    const maxQty = prod && typeof prod.soLuong === 'number' ? prod.soLuong : undefined;

    if (isNaN(num) || num < 1) {
      onRemoveAction(item.idChiTietSanPham);
    } else if (num > (maxQty || Infinity)) {
      // Nếu vượt quá tồn kho, cập nhật lại input và giỏ hàng về tồn kho
      setInputValues(prev => ({
        ...prev,
        [item.idChiTietSanPham]: String(maxQty || Infinity)
      }));
      onQtyChange && onQtyChange(item.idChiTietSanPham, maxQty || Infinity);
      toast.error('Số lượng vượt quá tồn kho!');
    } else {
      onQtyChange && onQtyChange(item.idChiTietSanPham, num);
      setInputValues(prev => {
        const newState = { ...prev };
        delete newState[item.idChiTietSanPham];
        return newState;
      });
    }
  };

  return (
    <div style={{
      background: '#fff',
      borderRadius: 16,
      boxShadow: '0 4px 24px #e3e3e3',
      padding: 24,
      maxWidth: 800,
      margin: '24px auto',
    }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', borderRadius: 12, overflow: 'hidden', boxShadow: '0 2px 8px #f0f0f0' }}>
        <thead>
          <tr style={{ background: '#f8fafc', color: '#1976d2', fontWeight: 800, fontSize: 17, letterSpacing: 1 }}>
            <th style={{ padding: 14, textAlign: 'center', minWidth: 40, maxWidth: 50, borderTopLeftRadius: 12 }}>STT</th>
            <th style={{ padding: 14, textAlign: 'left', minWidth: 180, maxWidth: 300 }}>TÊN HÀNG</th>
            <th style={{ padding: 14, textAlign: 'center', minWidth: 70 }}>Số Lượng</th>
            <th style={{ padding: 14, textAlign: 'right', minWidth: 90 }}>Đơn Giá</th>
            <th style={{ padding: 14, textAlign: 'right', minWidth: 100, borderTopRightRadius: 12 }}>Thành Tiền</th>
            <th style={{ padding: 14, textAlign: 'center', minWidth: 60 }}>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => {
            const prod = products.find(p => p.id === item.idChiTietSanPham) as any || {};
            const detailInfo = [
              item.maSanPham || prod.maSanPham,
              item.tenThuongHieu || prod.tenThuongHieu,
              item.tenMauSac || prod.tenMauSac ? `Màu ${item.tenMauSac || prod.tenMauSac}` : undefined,
              item.tenKichCo || prod.tenKichCo ? `Kích cỡ ${item.tenKichCo || prod.tenKichCo}` : undefined
            ].filter(Boolean).join(', ');
            return (
              <tr key={item.idChiTietSanPham + '-' + idx} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s', cursor: 'pointer', height: 56 }}
                onMouseOver={e => (e.currentTarget.style.background = '#f6faff')}
                onMouseOut={e => (e.currentTarget.style.background = 'none')}
              >
                <td style={{ padding: 12, textAlign: 'center', fontWeight: 600, fontSize: 16 }}>{idx + 1}</td>
                <td style={{ padding: 12, textAlign: 'left', fontWeight: 500, maxWidth: 300 }}>
                  <div style={{ fontWeight: 'bold', fontSize: 17 }}>{item.tenSanPham}</div>
                  <div style={{ fontSize: 14, color: '#888', whiteSpace: 'normal', marginTop: 2 }}>{detailInfo}</div>
                </td>
                <td style={{ padding: 12, textAlign: 'center', fontSize: 16 }}>{item.qty}</td>
                <td style={{ padding: 12, textAlign: 'right', color: '#1976d2', fontWeight: 700, fontSize: 16 }}>{(item.gia || 0).toLocaleString()}đ</td>
                <td style={{ padding: 12, textAlign: 'right', fontWeight: 700, color: '#388e3c', fontSize: 16 }}>{((item.gia || 0) * (item.qty || 0)).toLocaleString()}đ</td>
                <td style={{ padding: 12, textAlign: 'center' }}>
                  <button
                    style={{ background: '#e74c3c', color: '#fff', border: 'none', borderRadius: 6, padding: '6px 12px', fontWeight: 700, fontSize: 18, cursor: 'pointer' }}
                    title="Xóa sản phẩm khỏi giỏ hàng"
                    onClick={() => onRemoveAction(item.idChiTietSanPham)}
                  >🗑️</button>
                </td>
              </tr>
            );
          })}
          {cart.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: 48, color: '#bbb', fontSize: 22, borderRadius: 12 }}>
                <div style={{ fontSize: 60, marginBottom: 12 }}>🛒</div>
                Giỏ hàng của bạn đang trống!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 