<!DOCTYPE html>
<html>
<head>
    <title>Verification Code</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 20px;">
    <div style="max-width: 500px; margin: 0 auto; background-color: #ffffff; padding: 25px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
        
        <h2 style="color: #111827; margin-bottom: 10px;">
            Hello, {{ $name }} 👋
        </h2>

        <p style="color: #374151; font-size: 15px; line-height: 1.6;">
            Thank you for registering with us. To complete your verification, please use the code below:
        </p>

        <div style="text-align: center; margin: 25px 0;">
            <h1 style="color: #4F46E5; letter-spacing: 6px; margin: 0;">
                {{ $otp }}
            </h1>
        </div>

        <p style="color: #6B7280; font-size: 14px;">
            This verification code will expire in <strong>5 minutes</strong>.
        </p>

        <p style="color: #6B7280; font-size: 14px; margin-top: 20px;">
            If you did not request this intentionally, you can safely ignore this email.
        </p>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 25px 0;">

        <p style="color: #9CA3AF; font-size: 12px; text-align: center;">
            © {{ date('Y') }} {{ config('app.name') }}. All rights reserved.
        </p>

    </div>
</body>
</html>
