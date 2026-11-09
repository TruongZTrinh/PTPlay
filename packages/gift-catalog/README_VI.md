# PTPlay Shared TikTok LIVE Gift Catalog — v1.0

Một **thư viện dữ liệu quà tham khảo dùng chung** cho tất cả game PTPlay, độc lập TikFinity. Phù hợp đặt trong `PTPlay/packages/gift-catalog/` sau khi xem cấu trúc monorepo thực tế.

## Quan trọng: Nội dung ZIP này có gì / chưa có gì

- **Có:** mã Node.js 20+ không cần package ngoài để tải và chuẩn hóa danh sách quà, tải ZIP icon, trình duyệt quà localhost, ví dụ game mapping, công cụ nhập Gift ID từ sự kiện TikFinity, kiểm thử.
- **Có:** `data/gifts.sample.json` là *dữ liệu mẫu có dẫn nguồn*, không phải toàn bộ quà.
- **Chưa đóng sẵn toàn bộ 2.503 dòng JSON hay 1.715 icon:** môi trường tạo file không thể tải file nhị phân nguồn về để gói lại. **Sau khi chạy `npm run gifts:sync` và `npm run gifts:icons` trên máy Windows có Internet, bạn sẽ có danh mục và ZIP icon thật** từ nguồn công khai.
- **Không có Gift ID đã xác minh** trong bộ JSON tham khảo BeetGames. Không bao giờ coi `slug`, tên, hoặc `referenceKey` là Gift ID TikTok.

## Nguồn công khai đã kiểm tra (09/11/2026)

- Toàn bộ metadata: https://beetgames.com/tiktok-gifts.json (trang này công bố 2.503 rows global; 85 vùng; 1.715 unique across regional lists ở lần kiểm tra)
- JSON Việt Nam: chạy sync rồi lọc theo `regions.includes('VN')`
- CSV gốc: https://beetgames.com/tiktok-gifts.csv
- **ZIP icon PNG công khai:** https://beetgames.com/tiktok-gift-icons.zip
- Trình xem icon online: https://beetgames.com/tiktok-gifts/icons/
- Danh sách Việt Nam: https://beetgames.com/vi/tiktok-gifts/vn/
- Event API TikFinity: https://tikfinity.zerody.one/tiktok/dapi

Tất cả nguồn trên **không thuộc TikTok chính thức**. Độ sẵn có và giá quà phụ thuộc quốc gia, phòng LIVE và thời điểm. Dữ liệu không đảm bảo phản ánh chính xác mọi quà ngay tại thời điểm xem.

## Chạy trên Windows (Node.js 20+)

1. Giải nén thư mục này cạnh PTPlay hoặc đặt vào monorepo ở `packages/gift-catalog/`.
2. Mở Terminal tại đây, chạy:

```bat
npm run gifts:sync
npm run gifts:icons
npm run gifts:browse
```

3. Xem giao diện danh mục ở **http://127.0.0.1:8099**. Có tìm kiếm, lọc quà Việt Nam/tất cả và mức Xu, hiển thị icon khi kết nối Internet.
4. Cũng có thể chạy file **SYNC_GIFTS_WINDOWS.bat** bằng nhấp đúp.

**Kết quả sau khi chạy sync**

```text
data/tiktok-gifts.all.json  <- Toàn bộ records công khai của snapshot
 data/tiktok-gifts.vn.json <- Chỉ records gắn VN
 data/tiktok-gifts.all.csv <- CSV mở Excel
 data/tiktok-gifts.vn.csv  <- CSV mở Excel
 assets/tiktok-gift-icons.zip <- ZIP PNG nguyên bản từ nguồn
```

Bạn có thể giải nén ZIP icon bằng Windows Explorer. Tên file bên trong ZIP có thể không trùng 1:1 với slug trong catalog; kiểm tra trước khi nối vào `localIcon`. Các URL ảnh `.webp` trong metadata là cách nối đáng tin cậy hơn.

## Kiến trúc nên tích hợp

```text
TikTok LIVE
  -> TikFinityProvider (unchanged)
  -> Normalize event / gift streak / dedup (existing LIVE Bridge)
  -> GiftCatalog (id -> name -> price + icon reference)
  -> GiftMapper (per-game configurable action)
  -> Selected game SDK
  -> Phaser VFX / sound / TTS
```

- Không ghi logic game vào `TikFinityProvider`.
- Thư viện catalog **chỉ làm tra cứu, không xử lý lại số lượng streak**. Luôn giữ `deltaCount`, `eventId`, `repeatEnd`, và chống trùng từ Bridge cũ.
- Ưu tiên **Gift ID được quan sát thực**, sau đó mới fallback tên duy nhất; trùng tên thì chờ người quản trị xử lý. Giá ở metadata là giá **Coin tham khảo**, không phải doanh thu/tiền thưởng của streamer.
- Avatar/sender username không thuộc gift catalog. `gifts:observe` chỉ lưu dữ liệu quà đã được trích từ sự kiện, không lưu người gửi.

## Học Gift ID thật từ TikFinity (không mua quà để test)

Nếu bạn đã có event gift từ phiên LIVE trước, dùng log JSON **đã loại bỏ token, cookie và dữ liệu người dùng**. Ví dụ:

```json
{"event":"gift","data":{"giftId":12345,"giftName":"Rose","diamondCount":1,"giftPictureUrl":"https://example.com/rose.webp"}}
```

**Số 12345 ở đây chỉ là ví dụ giả, KHÔNG phải gift ID Rose thực.**

```bat
npm run gifts:observe -- C:\path\to\sanitized-gift-events.json
```

Sau đó chương trình tạo `data/gifts.observed-ids.json` chỉ chứa ID, tên, giá và URL biểu tượng từ event thật. Tùy cấu trúc JSON thực tế, Antigravity có thể cần chỉnh extractor sau khi đối chiếu log.

## Gắn vào từng game

- `config/gift-actions.example.json`: mapping tham khảo cho Café Mòe, Mini War, English Class. Không thay thế config hiện tại chưa kiểm thử.
- `src/gift-utils.mjs`: `resolveGift(event, catalog, observed)` trả về `observed-id`, `name-only-unverified`, `ambiguous` hoặc `unresolved`.
- Nếu một game cần lấy ảnh, ưu tiên URL của gift event đã được xác minh hoặc `iconUrl` đã có trong catalog, sau khi kiểm tra an toàn và quyền sử dụng.
- Lưu file JSON từ công cụ sync ở `packages/gift-catalog/data/`; **không import thẳng JSON 2.503 mục vào mọi game bundle**. Để server phục vụ danh sách khi cần, cache và chỉ gửi các trường cần thiết.

## Tính pháp lý của icon

Hình quà TikTok là tài sản trí tuệ của TikTok/ByteDance. BeetGames cung cấp bộ sưu tập để tải nhưng quyền phân phối lại, đổi thương hiệu hoặc dùng thương mại cần kiểm tra riêng. Không khẳng định bạn có quyền tái phân phối icon gốc. Trong game có thể dùng icon chỉ để *nhận dạng quà*, và tự tạo VFX/đạo cụ của PTPlay để phát hành.

## Chạy test

```bat
npm test
```

Không sửa các source game đang chạy LIVE thật trước khi có test regression. Một provider khác phải nạp được metadata độc lập.

## TypeScript SDK

`src/index.ts` cung cấp `GiftReference`, `ObservedGiftIdentity`, `GiftCatalogSnapshot` và `lookupGift`. Không nhập `diamondCount` từ event làm giá `coins` mặc định: đây là các trường có ngữ nghĩa khác nhau cần xác minh.

**Điểm tích hợp:** Nếu đã có `GiftMapper`, chỉ thêm `giftCatalog.resolve(...)` để tra icon/tên/region và cấu hình trong Dashboard. Đừng thay thế `GiftStreakHandler` đang chạy thật.
