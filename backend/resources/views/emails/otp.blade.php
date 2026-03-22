<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
        .container { max-width: 600px; margin: 20px auto; background: #ffffff; border: 4px solid #000000; padding: 40px; }
        .header { text-align: center; margin-bottom: 30px; }
        .logo { font-size: 32px; font-weight: 900; text-transform: uppercase; color: #ff3e3e; border-bottom: 4px solid #000; display: inline-block; padding-bottom: 5px; }
        .code-box { background: #f0f0f0; border: 2px dashed #000; padding: 20px; text-align: center; margin: 30px 0; }
        .code { font-size: 48px; font-weight: 900; letter-spacing: 10px; color: #000; }
        .footer { font-size: 12px; text-align: center; color: #666; margin-top: 30px; border-top: 1px solid #ddd; padding-top: 20px; }
        .btn { background: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; display: inline-block; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">ShopDee 2D</div>
        </div>
        
        <h2>Xin chào!</h2>
        
        @if($purpose == 'registration')
            <p>Cảm ơn bạn đã lựa chọn ShopDee. Để hoàn tất việc đăng ký tài khoản, vui lòng sử dụng mã xác thực dưới đây:</p>
        @elseif($purpose == 'reset_password')
            <p>Chúng tôi nhận được yêu cầu khôi phục mật khẩu của bạn. Vui lòng sử dụng mã dưới đây để thiết lập mật khẩu mới:</p>
        @elseif($purpose == 'change_email')
            <p>Bạn đang thực hiện thay đổi Email liên kết. Vui lòng xác nhận bằng mã dưới đây:</p>
        @endif

        <div class="code-box">
            <div class="code">{{ $code }}</div>
        </div>

        <p>Mã này sẽ hết hạn sau 10 phút. Nếu bạn không thực hiện yêu cầu này, vui lòng bỏ qua email này.</p>

        <div class="footer">
            <p>© 2026 ShopDee Team - Nền tảng thương mại điện tử 2D Flat-Design</p>
            <p>Đừng trả lời email này. Đây là hệ thống tự động.</p>
        </div>
    </div>
</body>
</html>
