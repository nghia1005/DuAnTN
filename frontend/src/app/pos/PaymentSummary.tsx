'use client';
import React from 'react';
import { CartItem } from './CartList';
import { Voucher } from './VoucherSelector';
import QrSelector from './QrSelector';

interface Props {
  cart: CartItem[];
  voucher: Voucher | null;
  shipping: number;
  paymentMethod?: string;
  selectedQR?: any;
  onSelectQR?: (qr: any) => void;
}

export default function PaymentSummary({ cart, voucher, shipping, paymentMethod, selectedQR, onSelectQR }: Props) {
  const total = cart.reduce((sum, item) => sum + item.gia * item.qty, 0);
  
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
  
  const discount = calculateDiscount(voucher, total);
  const final = total - discount + Number(shipping || 0);

  return (
    <div style={{ margin: '16px 0', background: '#f5f5f5', padding: 16, borderRadius: 4 }}>
      <div>Tổng tiền: <b>{(total || 0).toLocaleString()}đ</b></div>
      <div>Giảm giá: <b>-{(discount || 0).toLocaleString()}đ</b></div>
      <div>Phí ship: <b>{(Number(shipping) || 0).toLocaleString()}đ</b></div>
      <div style={{ fontSize: 18, marginTop: 8 }}>Thanh toán: <b>{(final || 0).toLocaleString()}đ</b></div>
    </div>
  );
} 