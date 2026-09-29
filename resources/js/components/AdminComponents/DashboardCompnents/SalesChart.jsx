import React from "react";
import {
    ComposedChart,
    Area,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
} from "recharts";

// Custom Tooltip — shows ৳ and order count clearly
const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload || !payload.length) return null;
    return (
        <div className="bg-white dark:bg-slate-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl px-4 py-3 min-w-[170px]">
            <p className="text-xs text-gray-500 dark:text-gray-400 font-medium mb-2">
                {new Date(label).toLocaleDateString("en-BD", {
                    weekday: "short",
                    day: "numeric",
                    month: "short",
                })}
            </p>
            {payload.map((entry, i) => (
                <div key={i} className="flex items-center justify-between gap-4 mt-1">
                    <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-300">
                        <span
                            className="inline-block w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        {entry.name}
                    </span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {entry.name === "Revenue (৳)"
                            ? `৳ ${Number(entry.value).toLocaleString("en-BD")}`
                            : `${entry.value} orders`}
                    </span>
                </div>
            ))}
        </div>
    );
};

// Format Y-axis revenue labels: 10000 → ৳10K
const formatYRevenue = (value) => {
    if (value >= 1_000_000) return `৳${(value / 1_000_000).toFixed(1)}M`;
    if (value >= 1_000) return `৳${(value / 1_000).toFixed(0)}K`;
    return `৳${value}`;
};

export default function SalesChart({ data }) {
    const totalRevenue = data.reduce((s, d) => s + d.revenue, 0);
    const totalOrders = data.reduce((s, d) => s + d.orders, 0);
    const peakDay = data.reduce((max, d) => (d.revenue > (max?.revenue ?? 0) ? d : max), null);

    return (
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg mt-5 shadow-sm border border-gray-200 dark:border-gray-700 mb-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <div>
                    <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        📈 Sales &amp; Orders Over Time
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Daily revenue earned and number of orders placed
                    </p>
                </div>

                {data.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                        <div className="bg-[#059669]/10 text-[#059669] dark:bg-[#059669]/20 dark:text-[#8ab87a] rounded-lg px-3 py-1.5 text-xs font-semibold">
                            Total: ৳{totalRevenue.toLocaleString("en-BD")}
                        </div>
                        <div className="bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded-lg px-3 py-1.5 text-xs font-semibold">
                            {totalOrders} Orders
                        </div>
                        {peakDay && (
                            <div className="bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg px-3 py-1.5 text-xs font-semibold">
                                🏆 Best: {new Date(peakDay.date).toLocaleDateString("en-BD", { day: "numeric", month: "short" })}
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="h-[320px] w-full">
                {data.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 10, right: 20, left: 10, bottom: 0 }}
                        >
                            <defs>
                                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#059669" stopOpacity={0.25} />
                                    <stop offset="95%" stopColor="#059669" stopOpacity={0} />
                                </linearGradient>
                            </defs>

                            <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.15} />

                            <XAxis
                                dataKey="date"
                                stroke="#9ca3af"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) =>
                                    new Date(str).toLocaleDateString("en-BD", {
                                        month: "short",
                                        day: "numeric",
                                    })
                                }
                            />

                            <YAxis
                                yAxisId="revenue"
                                orientation="left"
                                stroke="#9ca3af"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={formatYRevenue}
                            />

                            <YAxis
                                yAxisId="orders"
                                orientation="right"
                                stroke="#9ca3af"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />

                            <Tooltip content={<CustomTooltip />} />

                            <Legend
                                wrapperStyle={{ fontSize: "12px", paddingTop: "16px", color: "#9ca3af" }}
                            />

                            <Area
                                yAxisId="revenue"
                                type="monotone"
                                dataKey="revenue"
                                name="Revenue (৳)"
                                stroke="#059669"
                                strokeWidth={2.5}
                                fill="url(#revenueGrad)"
                                dot={false}
                                activeDot={{ r: 5, fill: "#059669" }}
                            />

                            <Bar
                                yAxisId="orders"
                                dataKey="orders"
                                name="Orders"
                                fill="#fb923c"
                                opacity={0.75}
                                radius={[4, 4, 0, 0]}
                                maxBarSize={28}
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 dark:text-gray-500 gap-2">
                        <span className="text-4xl">📊</span>
                        <p className="text-sm font-medium">No sales data for this period</p>
                        <p className="text-xs">Try selecting a different date range above</p>
                    </div>
                )}
            </div>
        </div>
    );
}
