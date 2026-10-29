# Kết quả đợt kiểm thử mới trên bản chạy cục bộ

Ngày kiểm tra: 29/10/2026, trên máy cá nhân, cấu hình `compose.local.yml`.

Đây là đợt kiểm thử bổ sung, tách riêng với đợt được tổng hợp trong báo cáo ban đầu. Tài liệu này cung cấp nội dung cập nhật phần triển khai và kết quả ở chương 4, phần đánh giá và kết luận ở chương 5. Chưa chỉnh trực tiếp bản báo cáo vì thư mục hiện chưa có file báo cáo hoặc Excel test case.

| Nội dung | Đợt cũ theo báo cáo | Đợt mới đã chạy |
|---|---|---|
| Unit test | 70 | 149 Passed |
| Integration test | 10 | 25 Passed |
| Tổng hợp 325 ca | 321 Passed, 3 Failed, 1 chưa xác định hợp lệ | Chưa đối chiếu hoặc chạy lại đầy đủ 325 ca |
| Ca Failed thứ ba, theo người dùng bổ sung | 2 khách, tồn kho 1; 1 trong 3 lần cả hai đơn cùng thành công | 8 khách, tồn kho 1; cả 8 đơn thành công trong lần thử được lưu |

Không cộng số ca của hai đợt. Kết quả 8 khách là bằng chứng tái hiện bổ sung cho tình huống bán vượt tồn kho, không tính thành một lỗi mới ngoài 3 ca Failed trong báo cáo cũ.

## Nội dung cập nhật chương 4: triển khai và kết quả

Hệ thống được chạy bằng Docker gồm Angular, ASP.NET Core Web API và SQL Server. Script `Start-ClothingStore.ps1` tạo cấu hình local và khởi động các dịch vụ; cấu hình demo thêm 6 sản phẩm khi database chưa có sản phẩm. Các luồng được kiểm tra và kết quả tự động của đợt mới được ghi riêng dưới đây. Thanh toán chỉ hỗ trợ COD và QR mô phỏng; CAPTCHA dùng khóa test.

| Kiểm tra | Kết quả quan sát |
|---|---|
| Build API và Angular production trong Docker | Thành công |
| Trang chủ `http://localhost:4200/` | HTTP 200 |
| `/api/products` qua Nginx | HTTP 200, có 6 sản phẩm mẫu |
| Swagger của API | HTTP 200 |
| Đăng nhập admin demo | Có access token |
| Đăng ký khách và thêm địa chỉ | Thành công với CAPTCHA test |
| Đặt hàng COD | Tạo đơn thành công |
| Tạo đơn MockQR, lấy QR và xác nhận | Thành công, trạng thái thanh toán `Paid` |
| Ảnh sản phẩm mẫu | HTTP 200, `image/webp` |
| Unit test có sẵn | 149 Passed, 0 Failed, 0 Skipped; thời gian chạy test 56 giây |
| Integration test có sẵn | 25 Passed, 0 Failed, 0 Skipped; thời gian chạy test 26 giây |

Hai bộ test chạy tuần tự bằng .NET 10 trong container, trên bản sao riêng của source. Bộ integration dùng SQLite theo factory có sẵn; phép thử đồng thời ở dưới dùng SQL Server của website đang chạy. Vì vậy các bộ test Passed không chứng minh việc bảo toàn tồn kho khi đặt hàng đồng thời. Số ca trong source hiện tại là 149 và 25, khác 70 và 10 trong bản tóm tắt. TRX unit test đã lưu trong `test-results/`; kết quả integration được đọc từ đầu ra tiến trình, TRX integration chưa được lưu ra khỏi container do lỗi tham số logger của wrapper.

## Lỗi đặt hàng đồng thời đã tái hiện

Chạy `node Test-ConcurrentOrders.mjs` với 8 khách khác nhau cùng mua biến thể 1:

- Tồn kho trước: **1**.
- Số yêu cầu: **8**, mỗi yêu cầu mua 1.
- Số đơn thành công: **8**, tất cả HTTP 201.
- Tồn kho sau: **0**, dù tổng số lượng đã đặt là **8**.
- Lượng đặt vượt hàng: **7**. So với số đơn đã nhận, kho ghi thiếu 7 lần trừ.
- Bằng chứng: `test-results/concurrency-1793235426254.json`; các đơn thử có ID 1–8 vẫn lưu trong database demo.

Không thay đổi `OrderService.CreateAsync` để tạo lỗi nhân tạo. Hành vi phát sinh từ cơ chế đọc–kiểm tra–ghi tồn kho có sẵn. Bản chạy này giữ lỗi đó theo yêu cầu phục vụ báo cáo kiểm thử. Đơn MockQR thử riêng có ID 9.

Các kiểm tra HTTP/API trên không thay thế kiểm tra trực quan trong trình duyệt, kiểm tra tương thích, bảo mật hoặc hiệu năng toàn hệ thống. Build có cảnh báo CSS, nullable và cảnh báo NuGet về thư viện `System.Security.Cryptography.Pkcs` 10.0.0; chưa xử lý các cảnh báo này trong phạm vi cấu hình bản chạy.

Chưa có danh sách đầy đủ 325 ca của báo cáo để đối chiếu; không suy diễn kết quả 321 Passed, 3 Failed và một trạng thái chưa xác định từ các kiểm tra trên. Chưa xác nhận coverage theo yêu cầu hoặc CI trên commit cuối.

## Nội dung cập nhật chương 5: đánh giá và kết luận

Các luồng chức năng đã kiểm tra hoạt động thành công. Tuy nhiên, kiểm thử đồng thời với tồn kho ban đầu là 1 cho thấy cả 8 khách đều tạo đơn thành công trong khi tồn kho cuối bằng 0. Lỗi nghiệp vụ vẫn còn; hệ thống chưa đạt tiêu chí không bán vượt tồn kho.

Số liệu tổng hợp của đợt cũ được giữ riêng cho đến khi đối chiếu Excel và bằng chứng. Các kết quả mới không đủ để kết luận toàn bộ hệ thống đạt điều kiện chấp nhận, cũng không thay thế việc xác nhận độ bao phủ mã nguồn và CI trên commit cuối. Mã xử lý đặt hàng và lỗi tồn kho được giữ nguyên theo yêu cầu.
