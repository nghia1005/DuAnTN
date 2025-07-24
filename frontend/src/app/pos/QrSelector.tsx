import React, { useState, useEffect } from "react";
import Box from "@mui/material/Box";
import Paper from "@mui/material/Paper";
import Button from "@mui/material/Button";

// Danh sách mã QR mẫu, bạn có thể sửa/thêm tùy ý
const qrOptions = [
  {
    id: "acb",
    name: "ACB - Nguyễn Văn Nghĩa",
    account: "SỐ TÀI KHOẢN",
    bank: "ACB",
    qrImage: "/qr/acb.jpg",
  },
  {
    id: "vcb",
    name: "Vietcombank - Nguyễn Văn A",
    account: "0123456789",
    bank: "Vietcombank",
    qrImage: "/qr/acb.jpg",
  },
];

interface QrSelectorProps {
  amount: number; // Số tiền cần thanh toán
  onSelect?: (qr: typeof qrOptions[0]) => void;
  showOnlySelect?: boolean;
  triggerNode?: React.ReactNode; // Cho phép custom nút bấm
  autoOpen?: boolean;
}

const QrSelector: React.FC<QrSelectorProps> = ({ amount, onSelect, showOnlySelect, triggerNode, autoOpen = false }) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedQR, setSelectedQR] = useState<typeof qrOptions[0] | null>(null);

  useEffect(() => {
    if (autoOpen) setShowModal(true);
  }, [autoOpen]);

  const handleSelect = (qr: typeof qrOptions[0]) => {
    setSelectedQR(qr);
    setShowModal(false);
    onSelect && onSelect(qr);
  };

  return (
    <div style={{ display: 'inline' }}>
      {triggerNode ? (
        <span onClick={() => setShowModal(true)}>{triggerNode}</span>
      ) : (
        <Button variant="contained" size="small" onClick={() => setShowModal(true)}>
          QR
        </Button>
      )}
      {showModal && (
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}>
          <Paper sx={{
            background: '#fff',
            padding: 3,
            borderRadius: 2,
            minWidth: 300,
            maxWidth: 400,
            boxShadow: 6,
          }}>
            <h3 style={{ marginTop: 0 }}>Chọn mã QR</h3>
            <Button onClick={() => setShowModal(false)} variant="outlined" size="small" sx={{ mb: 2 }}>Đóng</Button>
            <Box sx={{ display: "flex", gap: 2 }}>
              {qrOptions.map((qr) => (
                <Box
                  key={qr.id}
                  sx={{
                    cursor: "pointer",
                    border: "1px solid #ccc",
                    padding: 1,
                    borderRadius: 1,
                    '&:hover': { borderColor: '#1976d2', boxShadow: 2 },
                    textAlign: 'center',
                  }}
                  onClick={() => handleSelect(qr)}
                >
                  <img src={qr.qrImage} alt={qr.name} width={100} style={{ borderRadius: 8, marginBottom: 8 }} />
                  <div style={{ fontWeight: 600 }}>{qr.name}</div>
                  <div style={{ fontSize: 14 }}>
                    {qr.account} ({qr.bank})
                  </div>
                </Box>
              ))}
            </Box>
          </Paper>
        </Box>
      )}

      {/* Nếu không phải chỉ chọn thì hiển thị QR lớn */}
      {!showOnlySelect && selectedQR && (
        <Box sx={{ background: '#f5f5f5', borderRadius: 1.5, p: 2, mt: 2, fontSize: 16 }}>
          <div style={{ fontWeight: 700 }}>
            {selectedQR.bank} - {selectedQR.name}
          </div>
          <div>
            STK: <b>{selectedQR.account}</b> ({selectedQR.bank})
          </div>
          <div>
            Số tiền: <b>{amount.toLocaleString()}đ</b>
          </div>
          <div>
            Nội dung: Chuyển tiền thanh toán QR CODE
          </div>
          <img src={selectedQR.qrImage} alt={selectedQR.name} width={160} style={{ marginTop: 12, borderRadius: 8, border: '1px solid #ccc' }} />
        </Box>
      )}
    </div>
  );
};

export default QrSelector; 