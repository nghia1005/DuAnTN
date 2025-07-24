"use client";
import React from "react";
import { Box, Typography, Paper, List, ListItem, ListItemIcon, ListItemText, Link } from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

export default function HomePage() {
  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#fdf7e2', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', pt: 6, pb: 2 }}>
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
  );
}
