<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Invoice #{{ $order->id }}</title>
    <style>
        body {
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 12px;
            color: #333;
        }
        .bil{
            color:red;
        }
        .invoice-header {
            display: table;
            width: 100%;
           
        }
        .company-info {
            display: table-cell;
            width: 50%;
        }
        .invoice-info {
            display: table-cell;
            width: 50%;
            text-align: right;
        }
        .company-info h1 {
            margin: 0;
            font-size: 20px;
            color: #272c38;
        }
        .invoice-title {
            font-size: 20px;
            font-weight: bold;
            color: #333;
            margin: 0;
        }
        .customer-info {
            background-color: #f8f9fa;

            border-radius: 5px;
            margin-bottom: 10px;
        }
        .customer-info h3 {
           
            color: white;
            background-color: #272c38;
            padding: 5px;
        }
      
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 5px;
            text-align: left;
        }
        th {
            background-color: #272c38;
            color: white;
            font-weight: bold;
        }
        .text-right {
            text-align: right;
        }
        .totals {
            margin-top: 5px;
            float: right;
            width: 300px;
        }
        .totals table {
            margin: 0;
        }
        .totals td {
            border: none;
            padding: 4px;
        }
        .total-row {
            font-weight: bold;
            font-size: 16px;
            background-color: #f8f9fa;
        }
        .status-badge {
            padding: 1px 4px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            color: white;
            background-color: red;
            text-transform: uppercase;
           
        }
        .status-paid { background-color: #d4edda; color: #155724; }
        .status-pending { background-color: #fff3cd; color: #856404; }
        .status-failed { background-color: #f8d7da; color: #721c24; }
        .status-refunded { background-color: #d1ecf1; color: #0c5460; }
        .footer {
            margin-top: 3px;
            padding-top: 5px;
            border-top: 2px solid #272c38d4;
            text-align: center;
            color: #070202;
        }
    </style>
</head>
<body>
    <div class="invoice-header">
        <div class="company-info">
            <h1>DEMAND<span class="bil"> BAZAR</span></h1>
            <p>
                4 Tola Mor, Rangpur<br>
                Rangpur Sadar<br>
                Phone: 01705822734<br>
                Email: demandhatbd@gmail.com
            </p>
        </div>
        <div class="invoice-info">
            <p class="invoice-title">INVOICE</p>
            <p>
                <strong>Invoice #:</strong> {{ $order->id }}<br>
                <strong>Date:</strong> {{ $order->created_at->format('d M Y') }}<br>
                <strong>Status:</strong> 
                <span class="status-badge ">
                    {{$order->payment_status }}
                </span>
            </p>
        </div>
    </div>

    <div class="customer-info">
        <h3>Bill To:</h3>
        <p>
            <strong>{{ $order->name }}</strong><br>
            {{ $order->address }}<br>
            Phone: {{ $order->phone }}<br>
            Email: {{ $order->email }}
        </p>
    </div>

    <table>
        <thead>
            <tr>
                <th>Item</th>
                <th class="text-right">Price</th>
                <th class="text-right">Quantity</th>
                <th class="text-right">Total</th>
            </tr>
        </thead>
        <tbody>
            @foreach($order->items as $item)
            <tr>
                <td>{{ $item->product_name }}</td>
                <td class="text-right">TK {{ number_format($item->price, 2) }}</td>
                <td class="text-right">{{ $item->quantity }}</td>
                <td class="text-right">TK {{ number_format($item->price * $item->quantity, 2) }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="totals">
        <table>
            <tr>
                <td>Subtotal:</td>
                <td class="text-right">TK {{ number_format($order->subtotal, 2) }}</td>
            </tr>
            <tr>
                <td>Delivery Fee:</td>
                <td class="text-right">TK {{ number_format($order->delivery_fee, 2) }}</td>
            </tr>
            <tr class="total-row">
                <td>Grand Total:</td>
                <td class="text-right">TK {{ number_format($order->grand_total, 2) }}</td>
            </tr>
        </table>
    </div>

       <div style="clear: both;"></div>
    <div class="footer">
        <p><strong>Payment Method:</strong> {{ ucfirst($order->payment_method) }}</p>
        @if($order->transaction_id)
        <p><strong>Transaction ID:</strong> {{ $order->transaction_id }}</p>
        @endif
        <p style="margin-top: 10px;">Thank you for your business!</p>
    </div>
</body>
</html>