# Nguyên tắc thiết kế LLM cho project Friday

## 1. Không giả định model “tự hiểu”
LLM không hiểu theo kiểu con người. Nó phản hồi dựa trên mẫu, ngữ cảnh và xác suất. Vì vậy, mọi hành vi quan trọng phải được dẫn hướng bằng prompt, context, memory và cấu trúc input rõ ràng.

## 2. Giảm mơ hồ trước khi gọi model
Input càng mơ hồ, output càng dễ lệch. Với dữ liệu từ giọng nói hoặc câu lệnh ngắn, luôn ưu tiên bước tinh chỉnh trước như:
- sửa STT
- chuẩn hóa văn bản
- thêm dấu tiếng Việt
- sửa tên riêng và từ chuyên biệt

## 3. Đưa đúng ngữ cảnh, không đưa quá nhiều
Model hoạt động tốt hơn khi được cấp đúng phần context liên quan nhất. Không nhồi toàn bộ lịch sử hội thoại. Chỉ nạp:
- preference của user
- vài lượt hội thoại gần nhất
- custom vocab liên quan
- ràng buộc nhiệm vụ hiện tại

## 4. Memory dùng cho suy luận thời gian thực, không dùng để train ngay
Memory giúp agent nhớ user trong lúc chạy:
- cách xưng hô
- ngôn ngữ ưu tiên
- độ dài câu trả lời
- sở thích lặp lại
Memory không phải cơ chế tự train model sau mỗi lượt chat.

## 5. Học dài hạn phải theo lô
Không cập nhật model sau mỗi cuộc trò chuyện. Hệ thống cần:
- thu thập log
- làm sạch dữ liệu
- lọc an toàn
- chấm điểm chất lượng
- tạo dataset
- train định kỳ theo lô
- đánh giá model mới trước khi đưa vào dùng

## 6. Prompt phải là ràng buộc hành vi, không phải diễn văn
Prompt tốt phải ngắn, rõ, có thứ tự ưu tiên và format đầu ra cụ thể. Nên nói rõ:
- vai trò
- nhiệm vụ
- điều không được làm
- format output
- ví dụ đúng/sai nếu cần

## 7. Kết hợp rule-based và LLM
Những gì chắc chắn thì xử lý bằng rule-based:
- chuẩn hóa text
- masking dữ liệu nhạy cảm
- fallback
- mapping từ chuyên biệt
Những gì mơ hồ mới giao cho LLM xử lý:
- sửa câu STT theo ngữ cảnh
- suy ra cách diễn đạt tự nhiên
- chọn phản hồi phù hợp với vai trò

## 8. Luôn có fallback an toàn
Khi model lỗi, timeout hoặc trả kết quả kém:
- không làm crash agent
- trả về input đã normalize
- dùng rule-based tối thiểu
- ghi log ngắn gọn
Tính ổn định quan trọng hơn câu trả lời “đẹp”.

## 9. Không cho model học từ dữ liệu xấu
Không dùng để train các mẫu:
- lỗi hệ thống
- traceback
- phản hồi từ chối an toàn
- nội dung vô nghĩa, spam, lặp
- dữ liệu nhạy cảm
- câu trả lời kém chất lượng
Chỉ dữ liệu sạch mới được đi vào pipeline học dài hạn.

## 10. Model mới phải được đánh giá trước khi thay model cũ
Mọi lần train phải đi qua evaluator và versioning:
- so sánh model mới với model đang dùng
- ghi nhận chỉ số
- chỉ promote khi đủ tốt
- phải rollback được
Friday cần ổn định, nhất quán và có thể kiểm soát được phiên bản.