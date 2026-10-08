# BananaLearning — Không gian khám phá

Thư viện mô phỏng **PhET HTML5** bằng **Next.js + React + TypeScript**, chạy bằng **npm**. Các mô phỏng độc lập được lưu cục bộ cùng ứng dụng và chạy trong trình duyệt qua iframe. BananaLearning cung cấp giao diện tiếng Việt, tìm kiếm, điều hướng và ghi chú; **không phải tác giả hay chủ sở hữu của mô phỏng PhET**. Không cơ sở dữ liệu, không đăng nhập, không API nghiệp vụ.

> Next.js dùng công cụ dựng ứng dụng riêng (Turbopack); dự án không dùng Vite.

## Chạy trên máy

Cài Node.js **20.9 trở lên** (khuyến nghị Node.js 22 hoặc 24 LTS), kèm npm. Từ thư mục gốc repo:

```bash
cd chung-khao
npm install
npm run dev
```

Mở **http://127.0.0.1:3000**. Không cần `.env` hoặc khóa API. Có thể chạy các lệnh npm trong thư mục ứng dụng `chung-khao/mapstudy-stem` sau khi cài dependencies trong thư mục `chung-khao`.

Bản production và các lệnh kiểm tra:

```bash
npm run build
npm start
npm run typecheck
npm test
```

Bài kiểm thử dùng Playwright với Microsoft Edge đã cài trên máy và yêu cầu website đang chạy ở `http://127.0.0.1:3000`. Nếu chưa có Edge, cài Edge hoặc điều chỉnh `channel` trong cấu hình Playwright.

## Thư viện PhET cục bộ

- Trang chủ, giới thiệu, hướng dẫn và điều hướng bằng tiếng Việt.
- Danh mục PhET HTML5 thuộc Vật lí, Hóa học, Toán học, Sinh học và Khoa học Trái Đất. Số lượng tổng lấy từ `simulations.length`; số lượng từng môn dùng `subjects` nếu có, nếu không dùng `subject`. Một mô phỏng có thể thuộc nhiều môn.
- Tìm kiếm không phân biệt dấu, lọc môn/ngôn ngữ, sắp xếp và chia sẻ bộ lọc qua URL.
- Mở mô phỏng thật trong iframe, tải lại hoặc mở rộng khung; mỗi mô phỏng tự quản lí các điều khiển bên trong.
- Lưu chủ đề yêu thích và ghi chú bằng `localStorage` trên trình duyệt.
- Thử tệp HTML độc lập trên máy là tính năng **tùy chọn**, không phải điều kiện để chạy thư viện có sẵn.
- Giao diện thích ứng với điện thoại, hỗ trợ bàn phím, nhãn thao tác và giảm chuyển động. Mức độ phù hợp với màn hình nhỏ còn tùy mô phỏng.

### Thu thập/cập nhật danh mục

```bash
npm run crawl:phet
```

Lệnh crawler thu thập danh mục PhET HTML5, thông tin nguồn và tải các tệp mô phỏng. Cần kết nối mạng để cập nhật; ứng dụng phục vụ các tệp đã tải từ thư mục công khai, không cần tải mô phỏng từ website PhET mỗi lần mở.

Các đầu ra:

- `src/lib/phet-catalog.json`: mảng danh mục đã thu thập.
- `src/lib/phet-download-report.json`: báo cáo tải, để kiểm tra các mục thành công, thiếu bản dịch hoặc lỗi theo dữ liệu crawler ghi nhận.
- `public/simulators/phet/<slug>/index.html`: tệp HTML5 độc lập của mô phỏng; có thể kèm `thumbnail.png`.
- `src/lib/simulations.ts`: chuyển dữ liệu danh mục thành các đối tượng sử dụng bởi thư viện và route chi tiết.

Ưu tiên bản dịch tiếng Việt khi có thể tải được. Một số mô phỏng chưa có bản dịch tiếng Việt hoặc bản dịch không tải được; crawler có thể dùng ngôn ngữ thay thế. Kiểm tra trường `locale` và báo cáo, không hiểu giao diện thư viện tiếng Việt là cam kết tất cả mô phỏng đã được Việt hóa. Tổng số danh mục không được ghi cố định trong giao diện hay README vì thay đổi theo kết quả tải.

Thông tin `subject`/`subjects`, `locale`, `sourcePage`, `downloadUrl`, `thumbnail`, `provider` và `license` phản ánh dữ liệu nguồn khi có. Không tự gán lớp 10/11/12 cho các mô phỏng chỉ vì ứng dụng hướng đến người học THPT: PhET phục vụ nhiều cấp học và nguồn không nhất thiết cung cấp ánh xạ lớp THPT Việt Nam. `grade` là tùy chọn, chỉ dùng khi có cơ sở xác minh.

## Bài test hiểu biết sau mô phỏng

Hiện sử dụng **38 bài test hiểu biết đã hoàn thiện (228 câu)** và bài con lắc mẫu được đánh dấu **Demo**. Các mô phỏng chưa có bài hiển thị chờ nội dung. Mỗi bài hoàn thiện gồm 6 câu về tương tác, quan hệ thay đổi và lý thuyết nền, có đáp án cùng giải thích. Đây là bài tự luyện của BananaLearning, không phải đề thi do PhET phát hành; mức nâng cao được tách biệt và chưa được bổ sung.

Các nhóm câu hỏi hiện có là `batch-1.json`, `batch-5.json` và `batch-8.json` trong `src/lib/understanding-quizzes/`. Chạy `npm run validate:understanding` để kiểm tra những bài đã có: ID/đáp án, giải thích, kỹ năng và chấm điểm. Báo cáo ghi rõ các mô phỏng còn thiếu bài. Kiểm tra cấu trúc tự động không thay thế việc giáo viên rà soát về tính sư phạm và tính đúng đắn khoa học.

Tiến độ, câu đánh dấu và kết quả của học sinh lưu trên trình duyệt, không gửi đến máy chủ.

## Nguồn và giấy phép

Mô phỏng do [PhET Interactive Simulations · University of Colorado Boulder](https://phet.colorado.edu) phát triển. Theo [trang giấy phép chính thức hiện hành](https://phet.colorado.edu/en/licensing), các bản HTML5 thông thường được cấp phép theo **[CC BY-NC 4.0](https://creativecommons.org/licenses/by-nc/4.0/)**, cho sử dụng **phi thương mại**, không phải mặc định CC BY 4.0. Tích hợp vào sản phẩm thương mại, dịch vụ thu phí/đăng ký hoặc ứng dụng có quảng cáo cần giấy phép thương mại từ CU Boulder. Kiểm tra điều kiện hiện hành, thông tin giấy phép trong từng tệp và metadata nguồn trước khi tái phân phối; không suy rộng giấy phép bản HTML sang mọi mã nguồn, tài nguyên hoặc sản phẩm khác của PhET.

Hiển thị ghi nhận nguồn ở gần mô phỏng, tương đương: **“Mô phỏng do PhET Interactive Simulations, University of Colorado Boulder phát triển, được cấp phép theo CC BY-NC 4.0 (https://phet.colorado.edu).”** Giữ logo PhET hiển thị và không sửa đổi logo; giữ nguyên thông tin bản quyền, giấy phép và ghi nhận nguồn bên trong các tệp. Logo/nhận diện Mapstudy không thay thế attribution của PhET.

## Thử HTML trên máy hoặc bổ sung mô phỏng riêng

Trong trang chi tiết, chọn **Thử nhúng tệp HTML**. Tệp `.html`/`.htm` dưới 10 MB được hiển thị qua Blob URL trong iframe, **không upload lên server** và chỉ tồn tại trong phiên trang hiện tại. Gỡ tệp thử để trở lại mô phỏng có sẵn. Dùng HTML độc lập với CSS/JS nhúng sẵn: việc chọn một HTML không cấp quyền đọc các tệp khác trong thư mục trên máy.

Với mô phỏng nhiều tệp, đặt toàn bộ tài nguyên trong một thư mục công khai và cấu hình `embedSrc`, ví dụ:

```text
public/simulators/ten-chu-de/
├── index.html
├── style.css
├── script.js
└── assets/
```

```ts
embedSrc: '/simulators/ten-chu-de/index.html'
```

Dùng đường dẫn tương đối trong HTML như `./style.css` hoặc `./assets/...`. Thư mục `public` không xuất hiện trong URL. Thêm đối tượng `Simulation` theo schema của ứng dụng để tạo thẻ và route; không chỉnh thủ công danh mục crawler nếu muốn giữ thay đổi qua lần cập nhật tiếp theo. Khi phát triển tải lại trang; với production dựng lại ứng dụng trước khi khởi động.

### Bảo mật và giới hạn iframe

Mô phỏng chạy trong iframe có sandbox; tệp HTML chọn trên máy phải được cách li khỏi trang cha. Chỉ thử nội dung từ nguồn tin cậy. **Sandbox không chặn mọi yêu cầu mạng** và không bảo đảm mọi mô phỏng bên ngoài sẽ tương thích. Nội dung dùng module/fetch có thể cần máy chủ/CORS phù hợp; quyền bổ sung phải được đánh giá trước khi thay đổi sandbox. Không cấp quyền cùng nguồn cho HTML không đáng tin cậy chỉ để bỏ lỗi.

Iframe có nút tải lại nhưng không có giao thức điều khiển tham số hay trao đổi dữ liệu với trang cha. Mỗi mô phỏng tự quản lí tương tác bên trong. Tệp được lưu cục bộ không đồng nghĩa toàn bộ tính năng hay liên kết bên trong luôn hoạt động khi ngoại tuyến; kiểm tra từng mô phỏng nếu cần triển khai không có mạng.

## Nhận diện BananaLearning

Tên ứng dụng: **BananaLearning**. Logo từ [BananaLearning.png](<../BananaLearning.png>) được sao chép nguyên bản vào [tài nguyên logo ứng dụng](<public/brand/bananalearning.png>), dùng tại header, footer và biểu tượng trình duyệt. Bố cục, bảng màu và phông chữ kế thừa mẫu tham khảo Mapstudy ban đầu; tên ứng dụng và logo đã được thay mới.

- Xanh thương hiệu `#155E94`, xanh hover `#2470AA`, nền `#F3F4F5`, khối trắng.
- Logo và Google Sans 400/500/700 tiếng Việt/Latin lưu cục bộ trong `public/brand/`.
- Giữ tinh thần thanh điều hướng trắng mờ, thẻ trắng bo góc và chân trang xanh.
- SVG STEM trang trí là minh họa giao diện, không phải bản thân mô phỏng tương tác. Ảnh thu nhỏ PhET, khi có, đến từ dữ liệu nguồn.
- Đây là giao diện thử nghiệm dựa trên bộ nhận diện được cung cấp, không khẳng định là sản phẩm Mapstudy hoặc PhET chính thức.

## Dữ liệu cục bộ

- `mapstudy-stem:favorites`: danh sách slug đã lưu.
- `mapstudy-stem:notes:<slug>`: ghi chú cho từng chủ đề.

Dữ liệu không đồng bộ giữa thiết bị. Xóa dữ liệu trình duyệt sẽ xóa dữ liệu này. Nếu localStorage bị chặn, danh sách yêu thích vẫn hoạt động trong phiên và ghi chú hiển thị thông báo không thể lưu.

## Cấu trúc chính

```text
src/
├── app/                         # Các trang, bố cục và CSS
├── components/                  # Điều hướng, thư viện, iframe, ghi chú và SVG
└── lib/
    ├── simulations.ts           # Schema và dữ liệu thư viện
    ├── phet-catalog.json         # Danh mục nguồn PhET
    └── phet-download-report.json # Báo cáo thu thập/tải
public/
├── brand/                       # Logo và phông chữ cục bộ
└── simulators/phet/             # HTML5 PhET đã tải và ảnh thu nhỏ
 tests/                         # Kiểm thử hành vi bằng trình duyệt
```

Các thư mục của BTC và tài liệu có sẵn được giữ nguyên. Mã ứng dụng nằm trong `chung-khao/mapstudy-stem`; npm workspace và cấu hình Netlify nằm trong `chung-khao`, không nằm ở gốc repo.
