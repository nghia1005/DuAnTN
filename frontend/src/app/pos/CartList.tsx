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
      borderRadius: 12,
      boxShadow: '0 2px 12px #e3e3e3',
      padding: 16,
      margin: '16px 0',
      maxWidth: 700,
      marginLeft: 'auto',
      marginRight: 'auto',
    }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed' }}>
        <thead>
          <tr style={{ background: '#f5f7fa', color: '#1976d2', fontWeight: 700 }}>
            <th style={{ padding: 10, textAlign: 'left', minWidth: 120, maxWidth: 180 }}>Sản phẩm</th>
            <th style={{ padding: 10, textAlign: 'left', minWidth: 60 }}>Mã</th>
            <th style={{ padding: 10, textAlign: 'left', minWidth: 90 }}>Danh mục</th>
            <th style={{ padding: 10, textAlign: 'left', minWidth: 90 }}>Thương hiệu</th>
            <th style={{ padding: 10, textAlign: 'left', minWidth: 70 }}>Màu sắc</th>
            <th style={{ padding: 10, textAlign: 'left', minWidth: 70 }}>Kích thước</th>
            <th style={{ padding: 10, textAlign: 'right', minWidth: 90 }}>Đơn giá</th>
            <th style={{ padding: 10, textAlign: 'center', minWidth: 70 }}>Số lượng</th>
            <th style={{ padding: 10, textAlign: 'right', minWidth: 100 }}>Thành tiền</th>
            <th style={{ padding: 10, width: 40 }}></th>
          </tr>
        </thead>
        <tbody>
          {cart.map((item, idx) => {
            const prod = products.find(p => p.id === item.idChiTietSanPham) as any || {};
            return (
              <tr key={item.idChiTietSanPham + '-' + idx} style={{ borderBottom: '1px solid #f0f0f0', transition: 'background 0.2s', cursor: 'pointer', height: 48 }}>
                <td style={{ padding: 8, textAlign: 'left', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 180 }}>{item.tenSanPham}</td>
                <td style={{ padding: 8, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.maSanPham || prod.maSanPham || ''}</td>
                <td style={{ padding: 8, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.tenDanhMuc || prod.tenDanhMuc || ''}</td>
                <td style={{ padding: 8, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.tenThuongHieu || prod.tenThuongHieu || ''}</td>
                <td style={{ padding: 8, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.tenMauSac || prod.tenMauSac || ''}</td>
                <td style={{ padding: 8, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.tenKichCo || prod.tenKichCo || ''}</td>
                <td style={{ padding: 8, textAlign: 'right', color: '#1976d2', fontWeight: 700 }}>{(item.gia || 0).toLocaleString()}đ</td>
                <td style={{ padding: 8, textAlign: 'center' }}>
                  <input
                    type="number"
                    min={1}
                    {...(prod.soLuong !== undefined ? { max: prod.soLuong } : {})}
                    value={inputValues[item.idChiTietSanPham] ?? item.qty}
                    style={{ width: 48, height: 32, fontSize: 16, borderRadius: 6, border: '1.5px solid #bdbdbd', textAlign: 'center', outline: 'none', boxShadow: '0 1px 4px #eee', transition: 'border 0.2s', background: '#fafbfc' }}
                    onChange={e => {
                      const raw = e.target.value;
                      setInputValues(prev => ({ ...prev, [item.idChiTietSanPham]: raw }));
                      if (raw === '') return;
                      let num = Number(raw);
                      if (isNaN(num) || num < 1) num = 1;
                      if (num > (prod.soLuong || Infinity)) {
                        num = prod.soLuong || Infinity;
                        toast.error('Số lượng vượt quá tồn kho!');
                      }
                      if (onQtyChange && num >= 1 && num <= (prod.soLuong || Infinity)) {
                        onQtyChange(item.idChiTietSanPham, num);
                      }
                    }}
                    onBlur={() => {
                      const value = inputValues[item.idChiTietSanPham];
                      if (value === '' || isNaN(Number(value)) || Number(value) < 1) {
                        setInputValues(prev => {
                          const newState = { ...prev };
                          delete newState[item.idChiTietSanPham];
                          return newState;
                        });
                      }
                    }}
                  />
                </td>
                <td style={{ padding: 8, textAlign: 'right', fontWeight: 700, color: '#388e3c' }}>{((item.gia || 0) * (item.qty || 0)).toLocaleString()}đ</td>
                <td style={{ padding: 8, textAlign: 'center' }}>
                  <button
                    onClick={() => onRemoveAction(item.idChiTietSanPham)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#e57373',
                      fontSize: 20,
                      cursor: 'pointer',
                      borderRadius: 6,
                      padding: 4,
                      transition: 'background 0.2s',
                    }}
                    title="Xóa khỏi giỏ hàng"
                    onMouseOver={e => (e.currentTarget.style.background = '#fbe9e7')}
                    onMouseOut={e => (e.currentTarget.style.background = 'none')}
                  >🗑️</button>
                </td>
              </tr>
            );
          })}
          {cart.length === 0 && (
            <tr>
              <td colSpan={10} style={{ textAlign: 'center', padding: 32, color: '#aaa', fontSize: 18 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🛒</div>
                Giỏ hàng của bạn đang trống!
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
} 