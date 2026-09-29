<?php

namespace App\Exports;

use App\Models\User;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class EmployeesExport implements FromCollection, WithHeadings, WithMapping, ShouldAutoSize
{
    /**
     * Fetch the data for the export
     */
    public function collection()
    {
        return User::whereIn('role', ['manager', 'employee'])
            ->withCount([
                // Count Pending Orders
                'assignedOrders as pending_orders_count' => function ($query) {
                    $query->where('order_status', 'pending');
                },
                // Count Confirmed/Steadfast Orders
                'assignedOrders as confirmed_orders_count' => function ($query) {
                    $query->where(function ($q) {
                        $q->whereNotNull('courier_invoice_id')
                            ->orWhereIn('order_status', ['shipped', 'delivered']);
                    });
                }
            ])
            ->latest()
            ->get();
    }

    /**
     * Map the data to specific columns
     */
    public function map($employee): array
    {
        return [
            $employee->id,
            $employee->name,
            $employee->email,
            $employee->phone,
            ucfirst($employee->role),
            $employee->pending_orders_count ?? 0,
            $employee->confirmed_orders_count ?? 0,
            $employee->created_at->format('Y-m-d h:i A'),
        ];
    }

    /**
     * Set the Heading Row for the Excel File
     */
    public function headings(): array
    {
        return [
            'ID',
            'Name',
            'Email',
            'Phone',
            'Role',
            'Pending Orders',
            'Confirmed Orders',
            'Joined Date',
        ];
    }
}