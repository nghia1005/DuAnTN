"use client";
import React, { useEffect, useState, useCallback } from "react";
import AdminLayout from "@/component/Admin-Layout";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { vi } from "date-fns/locale";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import dynamic from "next/dynamic";
import { addDays, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths } from "date-fns";
const RevenueBarChart = dynamic(() => import("@/component/BieuDo"), { ssr: false });

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

// Hàm format ngày dd/MM/yyyy
function formatDateStr(dateStr: string) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('vi-VN');
}

export default function ThongKeSanPhamPage() {
  const [activeMenu, setActiveMenu] = useState("statistics");
  const [activeSubMenu, setActiveSubMenu] = useState("product-statistics");
  const [stats, setStats] = useState({
    revenue: 0,
    orders: 0,
    bestSeller: { name: "", sold: 0 },
    loading: true,
    error: null as string | null,
    doanhThuNgay: 0,
    doanhThuTuan: 0,
    doanhThuThang: 0
  });
  // Thêm state cho tổng doanh thu toàn hệ thống
  const [totalRevenueAll, setTotalRevenueAll] = useState(0);
  const [totalOrdersAll, setTotalOrdersAll] = useState(0);
  // Bộ lọc ngày
  const today = new Date();
  const [from, setFrom] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [to, setTo] = useState<Date>(() => new Date());
  const [filtering, setFiltering] = useState(false);
  // Thêm state cho dữ liệu doanh thu từng ngày
  const [revenueByDay, setRevenueByDay] = useState<any[]>([]);
  // Thêm state cho sản phẩm bán chạy
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [showDateDropdown, setShowDateDropdown] = useState(false);
  const [customMode, setCustomMode] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState('theo ngày');
  const dateOptions = [
    { label: "Hôm nay", getRange: () => {
      const d = new Date();
      return [d, d];
    }},
    { label: "Hôm qua", getRange: () => {
      const d = subDays(new Date(), 1);
      return [d, d];
    }},
    { label: "Tuần này", getRange: () => {
      const now = new Date();
      return [startOfWeek(now, { weekStartsOn: 1 }), now];
    }},
    { label: "Tuần trước", getRange: () => {
      const lastWeek = subWeeks(new Date(), 1);
      return [startOfWeek(lastWeek, { weekStartsOn: 1 }), endOfWeek(lastWeek, { weekStartsOn: 1 })];
    }},
    { label: "Tháng này", getRange: () => {
      const now = new Date();
      return [startOfMonth(now), now];
    }},
    { label: "Tháng trước", getRange: () => {
      const lastMonth = subMonths(new Date(), 1);
      return [startOfMonth(lastMonth), endOfMonth(lastMonth)];
    }},
    { label: "Tùy chọn", getRange: () => [from, to] }
  ];
  const [timeUnit, setTimeUnit] = useState<'day' | 'month' | 'quarter' | 'year'>('day');
  const [fromDate, setFromDate] = useState<Date>(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)); // 3 tuần trước
  const [toDate, setToDate] = useState<Date>(new Date()); // Hôm nay
  // Xóa toàn bộ state STATUS_OPTIONS, status và dropdown lọc trạng thái
  // Trong fetchStats, bỏ truyền status vào API:
  // let apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-ngay?from=${fromDateStr}&to=${toDateStr}${status && status !== 'ALL' ? `&status=${encodeURIComponent(status)}` : ''}`;
  // if (timeUnit === 'month') {
  //   // Không fetch ở đây, đã xử lý ở fetchStatsWithGrowth
  //   return;
  // } else if (timeUnit === 'quarter') {
  //   apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-quy?from=${fromDateStr}&to=${toDateStr}${status && status !== 'ALL' ? `&status=${encodeURIComponent(status)}` : ''}`;
  // } else if (timeUnit === 'year') {
  //   apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-nam?from=${fromDateStr}&to=${toDateStr}${status && status !== 'ALL' ? `&status=${encodeURIComponent(status)}` : ''}`;
  // }
  // Biểu đồ chính chỉ dùng revenueByDay như cũ

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltering(true);
    // fetchStats().then(() => setFiltering(false)); // This line was removed as per the edit hint
  };

  const handleClearFilter = () => {
    const today = new Date();
    const defaultFrom = new Date(today.getFullYear(), today.getMonth(), 1);
    setFrom(defaultFrom);
    setTo(today);
    // fetchStats(); // This line was removed as per the edit hint
  };

  const CustomInput = React.forwardRef<HTMLInputElement, any>((props, ref) => (
    <input
      {...props}
      ref={ref}
      style={{
        padding: "8px 12px",
        borderRadius: 8,
        border: "1px solid #b59d3a",
        fontSize: 16,
        width: 150,
        background: "#fff",
        cursor: "pointer",
        textAlign: 'center'
      }}
      readOnly
    />
  ));

  // Hàm xóa lọc - reset về mặc định
  const clearFilter = () => {
    setTimeUnit('day');
    setSelectedLabel('theo ngày');
    setFromDate(new Date(Date.now() - 21 * 24 * 60 * 60 * 1000)); // 3 tuần trước
    setToDate(new Date()); // Hôm nay
    // setStatus("ALL"); // This line was removed as per the edit hint
  };

  // Tính tổng doanh thu trong khoảng lọc
  const totalRevenue = revenueByDay.reduce((sum, item) => sum + Number(item.revenue || 0), 0);
  const isOneDay = from.toDateString() === to.toDateString();
  const revenueBoxText = isOneDay
    ? `Doanh thu ngày ${formatDateStr(formatDate(from))}`
    : `Doanh thu từ ${formatDateStr(formatDate(from))} đến ${formatDateStr(formatDate(to))}`;

  const fetchStatsWithGrowth = async (unit: 'month' | 'quarter' | 'year', fromDate: Date, toDate: Date) => {
    let apiUrl = '';
    const fromDateStr = formatDate(fromDate);
    const toDateStr = formatDate(toDate);
    if (unit === 'month') {
      apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-thang-day-du?from=${fromDateStr}&to=${toDateStr}`;
      const res = await fetch(apiUrl, { cache: "no-store" });
      const data = await res.json();
      setRevenueByDay(Array.isArray(data) ? data : []);
      setStats(s => ({ ...s, loading: false, error: null }));
    } else if (unit === 'quarter') {
      apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-quy-day-du?from=${fromDateStr}&to=${toDateStr}`;
      const res = await fetch(apiUrl, { cache: "no-store" });
      const data = await res.json();
      setRevenueByDay(Array.isArray(data) ? data : []);
      setStats(s => ({ ...s, loading: false, error: null }));
    } else if (unit === 'year') {
      apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-nam-day-du?from=${fromDateStr}&to=${toDateStr}`;
      const res = await fetch(apiUrl, { cache: "no-store" });
      const data = await res.json();
      setRevenueByDay(Array.isArray(data) ? data : []);
      setStats(s => ({ ...s, loading: false, error: null }));
    }
  };

  const fetchStats = async () => {
    setStats(s => ({ ...s, loading: true, error: null }));
    try {
      // Xác định khoảng thời gian dựa trên timeUnit
      let fromDateStr: string, toDateStr: string;
      const today = new Date();
      if (fromDate && toDate) {
        fromDateStr = formatDate(fromDate);
        toDateStr = formatDate(toDate);
      } else {
        if (timeUnit === 'day') {
          const threeWeeksAgo = new Date(today.getTime() - (21 * 24 * 60 * 60 * 1000));
          fromDateStr = formatDate(threeWeeksAgo);
          toDateStr = formatDate(today);
        } else if (timeUnit === 'month') {
          const yearStart = new Date(today.getFullYear(), 0, 1);
          const yearEnd = new Date(today.getFullYear(), 11, 31);
          fromDateStr = formatDate(yearStart);
          toDateStr = formatDate(yearEnd);
        } else if (timeUnit === 'quarter') {
          const currentQuarter = Math.floor(today.getMonth() / 3);
          const quarterStart = new Date(today.getFullYear(), currentQuarter * 3, 1);
          fromDateStr = formatDate(quarterStart);
          toDateStr = formatDate(today);
        } else {
          const yearStart = new Date(today.getFullYear(), 0, 1);
          const yearEnd = new Date(today.getFullYear(), 11, 31);
          fromDateStr = formatDate(yearStart);
          toDateStr = formatDate(yearEnd);
        }
      }

      // Gọi API số lượng bán theo đơn vị thời gian
      let apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-ngay?from=${fromDateStr}&to=${toDateStr}`;
      if (timeUnit === 'month') {
        apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-thang?from=${fromDateStr}&to=${toDateStr}`;
      } else if (timeUnit === 'quarter') {
        apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-quy?from=${fromDateStr}&to=${toDateStr}`;
      } else if (timeUnit === 'year') {
        apiUrl = `http://localhost:8080/api/thongke/so-luong-ban-nam?from=${fromDateStr}&to=${toDateStr}`;
      }
      const res = await fetch(apiUrl, { cache: "no-store" });
      const data = await res.json();
      setRevenueByDay(Array.isArray(data) ? data : []);
      setStats(s => ({ ...s, loading: false, error: null }));
    } catch (err: any) {
      setStats(s => ({ ...s, loading: false, error: "Lỗi khi lấy dữ liệu thống kê!" }));
      setRevenueByDay([]);
    }
  };

  // Hàm lấy số lượng bán của ngày gần nhất trước khoảng lọc
  const fetchPrevSold = useCallback(async (fromDate: string) => {
    // Lấy ngày trước fromDate
    const prevDate = new Date(fromDate);
    prevDate.setDate(prevDate.getDate() - 1);
    const prevDateStr = formatDate(prevDate);
    // Gọi API lấy sold của ngày trước đó
    const res = await fetch(`http://localhost:8080/api/thongke/so-luong-ban-ngay?from=${prevDateStr}&to=${prevDateStr}`, { cache: "no-store" });
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      return Number(data[0].sold ?? 0);
    }
    return 0;
  }, []);

  // Thêm state cho badge tăng trưởng
  const [showBadge, setShowBadge] = useState<{ ready: boolean, badge: React.ReactNode | null }>({ ready: false, badge: null });

  // Thêm state cho dữ liệu tăng trưởng
  const [growthData, setGrowthData] = useState({
    currentSold: 0,
    previousSold: 0,
    growthPercentage: 0,
    isGrowth: true
  });

  // Hàm tính toán tăng trưởng giống bên doanh thu
  const calculateGrowth = useCallback(async (currentFromDate: Date, currentToDate: Date) => {
    // Tính khoảng kỳ trước (cùng số ngày, lùi về trước 1 tháng)
    const days = Math.ceil((currentToDate.getTime() - currentFromDate.getTime()) / (1000 * 60 * 60 * 24));
    const prevFrom = new Date(currentFromDate);
    prevFrom.setMonth(prevFrom.getMonth() - 1);
    const prevTo = new Date(prevFrom);
    prevTo.setDate(prevTo.getDate() + days);
    const fromStr = formatDate(currentFromDate);
    const toStr = formatDate(currentToDate);
    const prevFromStr = formatDate(prevFrom);
    const prevToStr = formatDate(prevTo);
    // Gọi API lấy sold của kỳ hiện tại
    const res1 = await fetch(`http://localhost:8080/api/thongke/so-luong-ban-ngay?from=${fromStr}&to=${toStr}`, { cache: "no-store" });
    const data1 = await res1.json();
    const currentSold = Array.isArray(data1) ? data1.reduce((sum, item) => sum + Number(item.sold ?? 0), 0) : 0;
    // Gọi API lấy sold của kỳ trước
    const res2 = await fetch(`http://localhost:8080/api/thongke/so-luong-ban-ngay?from=${prevFromStr}&to=${prevToStr}`, { cache: "no-store" });
    const data2 = await res2.json();
    const previousSold = Array.isArray(data2) ? data2.reduce((sum, item) => sum + Number(item.sold ?? 0), 0) : 0;
    // Tính phần trăm tăng trưởng
    let growthPercentage = 0;
    let isGrowth = true;
    if (previousSold > 0) {
      growthPercentage = ((currentSold - previousSold) / previousSold) * 100;
      isGrowth = currentSold >= previousSold;
    } else if (currentSold > 0) {
      growthPercentage = 100;
      isGrowth = true;
    }
    setGrowthData({
      currentSold,
      previousSold,
      growthPercentage: Math.abs(growthPercentage),
      isGrowth
    });
  }, []);

  // Gọi tính tăng trưởng khi đổi ngày lọc
  useEffect(() => {
    if (fromDate && toDate) {
      calculateGrowth(fromDate, toDate);
    }
  }, [fromDate, toDate, calculateGrowth]);

  // Tính toán badge tăng trưởng mỗi khi dữ liệu thay đổi
  useEffect(() => {
    const len = revenueByDay.length;
    const allZero = revenueByDay.every(item => Number(item.sold ?? 0) === 0);
    let ignore = false;
    async function calcBadge() {
      if (allZero && len > 0) {
        // Lấy ngày trước khoảng lọc
        const prevSold = await fetchPrevSold(revenueByDay[0].date);
        if (!ignore) {
          if (prevSold > 0) {
            setShowBadge({
              ready: true,
              badge: (
                <div style={{
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 2px 8px #e74c3c22',
                  padding: '6px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#e74c3c',
                  marginBottom: 12,
                  display: 'inline-block',
                  border: '2px solid #e74c3c'
                }}>
                  <span style={{fontWeight: 900, fontSize: 18, marginRight: 4}}>↘</span>
                  -100.0% <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>{timeUnit === 'day' ? 'so với cùng ngày tháng trước' : 'so với kỳ trước'}</span>
                </div>
              )
            });
          } else {
            setShowBadge({
              ready: true,
              badge: (
                <div style={{
                  background: '#fff',
                  borderRadius: 10,
                  boxShadow: '0 2px 8px #ccc',
                  padding: '6px 14px',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#888',
                  marginBottom: 12,
                  display: 'inline-block',
                  border: '1px solid #ccc'
                }}>
                  Không có dữ liệu để so sánh
                </div>
              )
            });
          }
        }
        return;
      }
      // Logic cũ
      if (len >= 2) {
        const last = revenueByDay[len - 1];
        const prev = revenueByDay[len - 2];
        const lastVal = Number(last.sold ?? 0);
        const prevVal = Number(prev.sold ?? 0);
        let growth = 0;
        let isGrowth = true;
        if (prevVal > 0 && lastVal === 0) {
          growth = -100;
          isGrowth = false;
        } else if (prevVal > 0) {
          growth = ((lastVal - prevVal) / prevVal) * 100;
          isGrowth = lastVal >= prevVal;
        } else if (lastVal > 0) {
          growth = 100;
          isGrowth = true;
        }
        setShowBadge({
          ready: true,
          badge: (
            <div style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: isGrowth ? '0 2px 8px #b59d3a22' : '0 2px 8px #e74c3c22',
              padding: '6px 14px',
              fontSize: 14,
              fontWeight: 700,
              color: isGrowth ? '#388e3c' : '#e74c3c',
              marginBottom: 12,
              display: 'inline-block',
              border: isGrowth ? '2px solid #4caf50' : '2px solid #e74c3c'
            }}>
              <span style={{fontWeight: 900, fontSize: 18, marginRight: 4}}>{isGrowth ? '↗' : '↘'}</span>
              {`${growth >= 0 ? '' : ''}${Math.abs(growth).toFixed(1)}%`} 
              <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                {timeUnit === 'day' ? 'so với cùng ngày tháng trước' : 'so với kỳ trước'}
              </span>
            </div>
          )
        });
      } else {
        setShowBadge({
          ready: true,
          badge: (
            <div style={{
              background: '#fff',
              borderRadius: 10,
              boxShadow: '0 2px 8px #ccc',
              padding: '6px 14px',
              fontSize: 14,
              fontWeight: 700,
              color: '#888',
              marginBottom: 12,
              display: 'inline-block',
              border: '1px solid #ccc'
            }}>
              Không có dữ liệu để so sánh
            </div>
          )
        });
      }
    }
    calcBadge();
    return () => { ignore = true; };
  }, [revenueByDay, fetchPrevSold, timeUnit]);

  useEffect(() => {
    setStats(s => ({ ...s, loading: true, error: null }));
    if (timeUnit === 'day') {
      fetchStats();
    } else if (timeUnit === 'month') {
      fetchStatsWithGrowth('month', fromDate, toDate);
    } else if (timeUnit === 'quarter') {
      fetchStatsWithGrowth('quarter', fromDate, toDate);
    } else if (timeUnit === 'year') {
      fetchStatsWithGrowth('year', fromDate, toDate);
    }
    // eslint-disable-next-line
  }, [timeUnit, fromDate, toDate]);

  return (
    <AdminLayout activeMenu={activeMenu} activeSubMenu={activeSubMenu} pageTitle="Thống kê sản phẩm">
      <div style={{ padding: 20, background: '#fffbe6', minHeight: '100vh' }}>
        {/* Bộ lọc thời gian và đơn vị thời gian */}
        <div style={{ marginBottom: 20, marginLeft: 8, display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          {/* Đơn vị thời gian */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontWeight: 600, fontSize: '15px', color: '#6b4f1d', marginRight: 10 }}>Đơn vị thời gian:</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { key: 'day', label: 'Ngày' },
                { key: 'month', label: 'Tháng' },
                { key: 'quarter', label: 'Quý' },
                { key: 'year', label: 'Năm' }
              ].map((unit) => (
                <button
                  key={unit.key}
                  type="button"
                  onClick={() => setTimeUnit(unit.key as 'day' | 'month' | 'quarter' | 'year')}
                  style={{
                    padding: '8px 16px',
                    background: timeUnit === unit.key ? '#b59d3a' : '#fff',
                    color: timeUnit === unit.key ? '#fff' : '#b59d3a',
                    border: '2px solid #b59d3a',
                    borderRadius: 8,
                    fontWeight: 600,
                    fontSize: '14px',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {unit.label}
                </button>
              ))}
            </div>
          </div>
          {/* Bộ lọc ngày */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <label style={{ fontWeight: 600, fontSize: '15px', color: '#6b4f1d' }}>Từ ngày:</label>
            <DatePicker
              selected={fromDate}
              onChange={(date) => setFromDate(date || new Date())}
              customInput={<CustomInput />}
              dateFormat="dd/MM/yyyy"
              locale={vi}
              maxDate={toDate || new Date()}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            <label style={{ fontWeight: 600, fontSize: '15px', color: '#6b4f1d' }}>Đến ngày:</label>
            <DatePicker
              selected={toDate}
              onChange={(date) => setToDate(date || new Date())}
              customInput={<CustomInput />}
              dateFormat="dd/MM/yyyy"
              locale={vi}
              minDate={fromDate}
              maxDate={new Date()}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
            />
            <button
              onClick={clearFilter}
              style={{
                padding: '8px 16px',
                background: '#e74c3c',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                fontWeight: 600,
                fontSize: '14px',
                cursor: 'pointer',
                transition: 'all 0.2s',
                display: 'flex',
                alignItems: 'center',
                gap: 6
              }}
            >
              <span style={{ fontSize: '16px' }}>×</span>
              Xóa lọc
            </button>
          </div>
          {/* Lọc trạng thái */}
          {/* The status filter dropdown is removed as per the edit hint */}
        </div>
        {stats.loading ? <div>Đang tải dữ liệu...</div> : stats.error ? <div style={{color:'red'}}>{stats.error}</div> : (
          !stats.loading && !stats.error && (
            <>
              <div style={{ background: '#fff', borderRadius: 24, boxShadow: '0 2px 8px #b59d3a22', padding: 40, margin: '0 auto', maxWidth: 1500 }}>
                <h2 style={{ color: '#b59d3a', fontWeight: 70, marginBottom: 24 }}>
                  {timeUnit === 'day' && 'Biểu đồ số lượng bán theo ngày'}
                  {timeUnit === 'month' && 'Biểu đồ số lượng bán theo tháng'}
                  {timeUnit === 'quarter' && 'Biểu đồ số lượng bán theo quý'}
                  {timeUnit === 'year' && 'Biểu đồ số lượng bán theo năm'}
                </h2>
                {/* Hiển thị tốc độ tăng trưởng kỳ gần nhất */}
                {(['day', 'month', 'quarter', 'year'].includes(timeUnit)) && (
                  <div style={{
                    background: '#fff',
                    borderRadius: 10,
                    boxShadow: growthData.isGrowth ? '0 2px 8px #b59d3a22' : '0 2px 8px #e74c3c22',
                    padding: '6px 14px',
                    fontSize: 14,
                    fontWeight: 700,
                    color: growthData.isGrowth ? '#388e3c' : '#e74c3c',
                    marginBottom: 12,
                    display: 'inline-block',
                    border: growthData.isGrowth ? '2px solid #4caf50' : '2px solid #e74c3c'
                  }}>
                    {growthData.currentSold === 0 && growthData.previousSold === 0
                      ? "Không có dữ liệu để so sánh"
                      : (
                        <>
                          <span>
                            {growthData.isGrowth ? '↗' : '↘'} {growthData.growthPercentage > 0 ? growthData.growthPercentage.toFixed(1) : '0'}%
                          </span>
                          <span style={{ fontSize: 12, color: '#666', marginLeft: 8 }}>
                            so với cùng ngày tháng trước
                          </span>
                        </>
                      )
                    }
                  </div>
                )}
                <RevenueBarChart
                  data={revenueByDay.map(item => ({
                    ...item,
                    date: timeUnit === 'month'
                      ? (item.date && item.date.length === 7
                          ? item.date.slice(5) + '/' + item.date.slice(0, 4)
                          : item.date)
                      : (timeUnit === 'quarter'
                          ? (item.date && item.date.includes('-Q')
                              ? 'Q' + item.date.split('-Q')[1] + '/' + item.date.split('-Q')[0]
                              : item.date)
                          : (timeUnit === 'year'
                              ? String(item.date)
                              : formatDateStr(item.date))),
                    sold: Number(item.sold ?? 0)
                  }))}
                  viewMode="sold"
                  timeUnit={timeUnit}
                />
              </div>
            </>
          )
        )}
      </div>
      <style jsx global>{`
        .react-datepicker__day--selected,
        .react-datepicker__day--keyboard-selected {
          background-color: #b3d4fc !important;
          color: #222 !important;
        }
        .react-datepicker__day--in-selecting-range,
        .react-datepicker__day--in-range,
        .react-datepicker__day--range-start,
        .react-datepicker__day--range-end {
          background-color: #fff !important;
          color: #222 !important;
        }
      `}</style>
    </AdminLayout>
  );
} 