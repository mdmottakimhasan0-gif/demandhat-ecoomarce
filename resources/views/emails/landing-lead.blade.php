<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;color:#111827">
    <h2 style="margin:0 0 8px">New lead from "{{ $pageTitle }}"</h2>
    <p style="margin:0 0 16px;color:#6b7280">{{ $pageUrl }}</p>
    <table cellpadding="8" cellspacing="0" style="border-collapse:collapse;width:100%;max-width:560px">
        @foreach ($rows as $row)
            <tr>
                <td style="border-bottom:1px solid #e5e7eb;font-weight:bold;width:35%">{{ $row['label'] }}</td>
                <td style="border-bottom:1px solid #e5e7eb">{{ $row['value'] }}</td>
            </tr>
        @endforeach
    </table>
</body>
</html>
