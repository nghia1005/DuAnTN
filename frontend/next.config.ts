import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/api/customers',
        destination: 'http://localhost:8080/api/customers', // Địa chỉ API backend thực tế
      },
      {
        source: '/api/vouchers',
        destination: 'http://localhost:8080/api/voucher',
      },
      {
        source: '/api/products',
        destination: 'http://localhost:8080/chi-tiet-san-pham/hien-thi',
      },
      {
        source: '/api/chi-tiet-san-pham/:path*',
        destination: 'http://localhost:8080/chi-tiet-san-pham/:path*',
      },
    ];
  },
};

export default nextConfig;