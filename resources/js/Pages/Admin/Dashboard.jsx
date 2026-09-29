import React from "react";
import AdminLayout from "../../Layouts/AdminLayouts/AdminLayout";
import { Head } from "@inertiajs/react";
import DashboardFilter from "../../components/AdminComponents/DashboardCompnents/DashboardFilter";
import KPICards from "../../components/AdminComponents/DashboardCompnents/KPICards";
import SalesChart from "../../components/AdminComponents/DashboardCompnents/SalesChart";
import ActionCenter from "../../components/AdminComponents/DashboardCompnents/ActionCenter";
import RecentActivity from "../../components/AdminComponents/DashboardCompnents/RecentActivity";

function Dashboard({ stats, actions, charts, recent_orders, filters }) {
    return (
        <div className="font-poppins pb-10">
            <Head title="Admin Dashboard" />

            {/* 1. Filter Section */}
            <DashboardFilter
                currentRange={filters.range}
                startDate={filters.start_date}
                endDate={filters.end_date}
            />

            {/* 2. KPI Cards (Row 1) */}
            <KPICards stats={stats} />

            {/* 3. Action Center (Row 2) - Immediate Attention */}
            <ActionCenter actions={actions} />

            {/* 5. Recent Activity & Top Products (Row 4) */}
            <RecentActivity
                recentOrders={recent_orders}
                topProducts={charts.top_products}
            />

            {/* 4. Main Chart (Row 3) */}
            <SalesChart data={charts.sales_trend} />
        </div>
    );
}

Dashboard.layout = (page) => <AdminLayout children={page} />;
export default Dashboard;
