# Clothing Store – Nhóm 16

Chạy tại máy bằng Docker Desktop (Linux containers):

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File .\Start-ClothingStore.ps1
```

- Website: http://localhost:4200
- Quản trị: http://localhost:4200/admin
- API: http://localhost:8080/swagger
- Admin demo: `admin@clothingstore.local` / `Admin@123`

Script tạo `.env.local` lần đầu, giữ nguyên khóa ở những lần chạy sau. Cấu hình local dùng CAPTCHA test luôn đạt, cần kết nối Internet đến Cloudflare. Không dùng cấu hình demo để đánh giá hiệu quả chống bot. SQL Server giữ dữ liệu trong volume riêng của dự án `clothing-nhom16`.

Khi database chưa có sản phẩm, cấu hình local tạo sáu sản phẩm mẫu. Biến thể `DEMO-1-DEN-M` chỉ có một sản phẩm, phục vụ kiểm thử đặt hàng đồng thời. Không tự đặt lại tồn kho khi khởi động lại.

```powershell
docker compose --env-file .env.local -f compose.local.yml ps
docker compose --env-file .env.local -f compose.local.yml logs --tail 100 api
docker compose --env-file .env.local -f compose.local.yml down
```

Lệnh `down` giữ dữ liệu. Website dùng Angular 12, ASP.NET Core .NET 10 và SQL Server; XAMPP không chạy được API này trực tiếp. Không cần cài .NET 10 hoặc Node trên máy khi dùng Docker.

## Đối chiếu báo cáo

Thanh toán hiện chỉ có COD và MockQR. Luồng đặt hàng giữ nguyên cơ chế đọc tồn kho, kiểm tra rồi ghi số lượng bằng EF Core trong transaction mặc định; không có khóa tuần tự hay cập nhật tồn kho có điều kiện. Các request đồng thời có thể cùng đọc tồn kho cũ, tạo nhiều đơn vượt lượng hàng và ghi đè lần trừ kho. Đây là hành vi cần quan sát thực tế, không phải lỗi được giả bằng thông báo giao diện.

Để tái hiện: tạo ít nhất hai tài khoản khách với địa chỉ riêng, chọn cùng biến thể có tồn kho 1, gửi đồng thời các request `POST /api/orders` bằng token riêng, mỗi request mua 1. So sánh số đơn thành công, tổng số lượng đã đặt và tồn kho trước/sau trong trang quản trị. Lặp lại với dữ liệu thử mới nếu lịch thực thi chưa gây ra xung đột. Kết quả mong đợi đúng nghiệp vụ là tối đa một đơn thành công và tồn kho còn 0. Không chạy thử trên dữ liệu bán hàng thật.

Có thể dùng Node.js 18 trở lên chạy `node Test-ConcurrentOrders.mjs` khi website đã sẵn sàng. Script tạo 8 tài khoản, địa chỉ và gửi 8 yêu cầu mua đồng thời; kết quả JSON lưu trong `test-results/`. Chỉ chạy khi biến thể mẫu đầu tiên còn đúng 1 sản phẩm. Script không tự xóa đơn hoặc hoàn kho.

Các số 325 ca, 321 Passed, 3 Failed, một trạng thái chưa xác định, 70 unit test và 10 integration test thuộc đợt kiểm thử cũ trong báo cáo người dùng cung cấp. Đợt kiểm thử mới có 149 unit test và 25 integration test Passed cùng kết quả tái hiện đồng thời ghi trong `VERIFICATION.md`. Không cộng hai đợt hoặc dùng số liệu cũ làm kết quả của đợt mới khi chưa đối chiếu Excel và bằng chứng.

Theo thông tin người dùng bổ sung, ca Failed thứ ba trong báo cáo là hai khách cùng mua biến thể còn tồn 1; trong 3 lần chạy, có 1 lần cả hai đơn cùng thành công. Lần thử 8 khách ở đợt mới là bằng chứng bổ sung cho tình huống bán vượt tồn kho này, không phải một ca lỗi mới để cộng thêm. Chưa có file báo cáo đầy đủ và Excel trong thư mục để đối chiếu mã ca kiểm thử hoặc xác nhận lại tổng 325 ca. Hiệu năng đo trên máy cá nhân; độ bao phủ và CI theo commit cuối cần kiểm chứng riêng.
