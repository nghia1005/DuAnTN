"use client";
import React from "react";
import { BarChart, Bar, ResponsiveContainer, CartesianGrid, XAxis, YAxis, Tooltip, Legend, LabelList } from "recharts";

export default function BieuDo({ data, viewMode, timeUnit }: { data: any[], viewMode?: 'revenue' | 'sold', timeUnit?: 'day' | 'month' | 'quarter' | 'year' }) {
  // Tính tổng doanh thu trong khoảng thời gian đã chọn
  const totalRevenue = data.reduce((sum, item) => sum + (item.revenue || 0), 0);

  // Hàm định dạng số tiền
  const formatCurrency = (value: number) => value.toLocaleString("vi-VN") + "₫";

  // Hàm định dạng label cho data labels
  const formatLabel = (value: any) => {
    if (typeof value !== 'number') return '';
    if (viewMode === 'sold') {
      return value.toString();
    }
    return formatCurrency(value);
  };

  // Hàm xác định label cho tooltip
  const getTooltipLabel = () => {
    switch (timeUnit) {
      case 'day':
        return 'Ngày: ';
      case 'month':
        return 'Tháng: ';
      case 'quarter':
        return 'Quý: ';
      case 'year':
        return 'Năm: ';
      default:
        return 'Ngày: ';
    }
  };

  // Tạo các mốc ticks cho YAxis bắt đầu từ 5 triệu, cách nhau 5 triệu
  const maxRevenue = Math.max(...data.map(item => item.revenue || 0), 0);
  // Chia mức cố định cho trục Y
  let step = 1000000;
  if (maxRevenue < 10000000) step = 1000000;
  else if (maxRevenue < 50000000) step = 2000000;
  else if (maxRevenue < 100000000) step = 5000000;
  else step = 10000000;
  let ticks = [];
  for (let i = step; i <= maxRevenue + step; i += step) {
    ticks.push(i);
  }
  // Nếu số tick quá nhiều, tự động tăng step lên gấp đôi cho đến khi số tick <= 12
  while (ticks.length > 12) {
    step *= 2;
    ticks = [];
    for (let i = step; i <= maxRevenue + step; i += step) {
      ticks.push(i);
    }
  }

  // Lấy doanh thu ngày cuối cùng trong mảng data
  let lastRevenue = 0;
  let lastDate = '';
  if (data && data.length > 0) {
    lastRevenue = data[data.length - 1].revenue || 0;
    lastDate = data[data.length - 1].date || '';
  }

  return (
    <div style={{ width: "100%", height: 650 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 60, right: 40, left: 20, bottom: 80 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="date"
            angle={0} // Đặt góc là 0 để label nằm ngang
            textAnchor="middle" // Căn giữa label
            height={40} // Giảm chiều cao cho phù hợp
            tick={{ fontSize: 16 }}
            tickMargin={12} // Giảm margin cho gọn
          />
          {(!viewMode || viewMode === 'revenue') && (
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 16 }}
              tickFormatter={formatCurrency}
              domain={[0, 'auto']}
              tickMargin={18}
              width={100}
              ticks={ticks}
            />
          )}
          {viewMode === 'sold' && (
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 16 }}
              tickFormatter={value => value.toString()}
              domain={[0, 'auto']}
              tickMargin={18}
              width={100}
            />
          )}
          <Tooltip
            wrapperStyle={{ fontSize: 20 }}
            formatter={(value: any, name: string, props: any) =>
              name === 'Doanh thu' ? formatCurrency(value) : value
            }
            labelFormatter={(label: any) => `${getTooltipLabel()} ${label}`}
          />
          <Legend wrapperStyle={{ fontSize: 20 }} />
          {(!viewMode || viewMode === 'revenue') && (
            <Bar yAxisId="left" dataKey="revenue" fill="#2980b9" name="Doanh thu" barSize={32}>
              <LabelList 
                dataKey="revenue" 
                position="top" 
                formatter={formatLabel}
                style={{ fontSize: 12, fontWeight: 'bold' }}
                offset={10}
              />
            </Bar>
          )}
          {viewMode === 'sold' && (
            <Bar yAxisId="left" dataKey="sold" fill="#e74c3c" name="Số lượng bán" barSize={32}>
              <LabelList 
                dataKey="sold" 
                position="top" 
                formatter={formatLabel}
                style={{ fontSize: 12, fontWeight: 'bold' }}
                offset={10}
              />
            </Bar>
          )}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
} 