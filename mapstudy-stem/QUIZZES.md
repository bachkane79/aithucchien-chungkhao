# Bài test hiểu biết sau mô phỏng

Mỗi mô phỏng PhET HTML5 trong thư viện có một bài **test hiểu biết riêng** gồm 6 câu trắc nghiệm tiếng Việt: hỏi về điều khiển và quan sát trong mô phỏng, quan hệ giữa các đại lượng khi thay đổi một yếu tố, và lý thuyết nền. Câu hỏi là nội dung tự luyện của ứng dụng, **không phải nội dung do PhET phát hành**. Mức **nâng cao** được tách qua trường `level` và chưa có ngân hàng câu hỏi; không gắn nhãn bài hiểu biết thành bài nâng cao. Bài demo con lắc ban đầu chỉ giữ làm tài liệu tham chiếu trong mã nguồn và không hiển thị như một bài chính thức.

## Học tập và lưu tiến độ

- `/trac-nghiem`: 122 bài hiểu biết, tìm kiếm, lọc theo môn và phân trang 12 bài.
- `/trac-nghiem/[slug]`: chuẩn bị → trả lời 6 câu → xác nhận nộp → xem điểm, đáp án và giải thích.
- Liên kết từ trang mô phỏng dẫn tới bài hiểu biết cùng slug. Các alias mô phỏng cũ được chuẩn hóa về slug PhET.
- Câu trả lời, câu đánh dấu và kết quả lưu trên trình duyệt qua `localStorage`, không gửi về máy chủ. Chấm điểm tại trình duyệt: mỗi câu đúng tính ngang nhau, câu bỏ trống tính sai, điểm hiển thị trên thang 10.
- Có thể đổi đáp án, lưu nháp, xem lại và làm lại bài; thay đổi nội dung câu hỏi sẽ vô hiệu tiến độ cũ nhờ fingerprint.

## Ngân hàng nội dung

`src/lib/understanding-quizzes/batch-1.json` đến `batch-8.json` chia toàn bộ 122 slug. `src/lib/quizzes.ts` nạp ngân hàng, định nghĩa schema và hàm chấm. Mỗi bài có `id`, `simulationSlug`, `title`, `description`, `estimatedMinutes`, `level: 'understanding'`, `isDemo: false`, `sources` và mảng `questions` gồm đúng 6 câu.

Mỗi câu có ID riêng, câu hỏi thuần văn bản (`prompt`), 4 phương án a–d (`options`), đúng một `correctOptionId`, giải thích (`explanation`) và `skill` là `interaction`, `relationship` hoặc `theory`. Bài cần tối thiểu 3 câu gắn với thao tác/hiển thị, thêm ít nhất 2 câu về quan hệ/lý thuyết và ít nhất 1 câu lý thuyết. Điều kiện giữ cố định và giả thiết vật lý cần nói rõ để chỉ có một đáp án đúng. Không sao chép một bộ câu hỏi chung rồi thay tên mô phỏng.

Các bài được biên soạn dựa trên mô phỏng PhET và bảng nhãn điều khiển trong các tệp HTML5 tiếng Việt chính thức. Nguồn của từng mô phỏng nằm trong `sources`. Để tạo bài nâng cao sau này, đặt `level: 'advanced'`, sử dụng ID bài riêng và nội dung thực sự nâng cao; không thay thế bài hiểu biết hoặc dùng nhầm đáp án của bài này.

## Kiểm tra

Từ gốc repo:

```sh
npm run validate:understanding
npm run typecheck
npm run build
npm test -- tests/quizzes.spec.ts --workers=2
```

`validate:understanding` kiểm tra đủ 122 slug, không trùng ID/nội dung, đủ 6 câu/bài, đủ 4 phương án/câu, đáp án hợp lệ, kỹ năng, giải thích, nguồn tham chiếu và các trường hợp chấm đúng/sai/trống cho từng bài. Kết quả được ghi vào `src/lib/understanding-quiz-report.json`. Kiểm tra kỹ thuật **không thay thế** việc giáo viên/nhà chuyên môn rà soát độc lập độ chính xác, mức độ sư phạm và sự phù hợp của các phiên bản PhET về sau.

Playwright kiểm tra hành vi ở `http://127.0.0.1:3000`; cần ứng dụng đang chạy. Website không có backend, đăng nhập hay hệ thống gửi điểm cho giáo viên.
