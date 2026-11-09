# PTPlay — Shared Music Library (5 games)

Bộ này gồm **15 đề cử từ trang nguồn đã kiểm tra**; **không kèm MP3/OGG** vì môi trường xuất file hiện tại không truy cập được máy chủ tải nhạc. Tải bằng các URL gốc trong `music-catalog.json` hoặc thử `download_music.py` trên máy có Internet.

## Game → nhạc

| Game | Main | Phụ/đặc biệt |
|---|---|---|
| Café Mòe | Cat caffe | A cup of tea, Chill lofi inspired |
| Mini War Arena | Heartfelt Battle | Epic Boss Battle, Boss Battle Theme |
| English Class | Cozy Puzzle Stage Select | Cozy Puzzle In-Game 1, Party and Gameover Loop |
| Đố Vui Có Thưởng | Funky Disco Beats | Funked Up, Catchy Swing |
| Đuổi Hình Bắt Chữ | Magic Puzzle In-Game 1 | Cozy Puzzle In-Game 3, Music Loops |

## Cách tải trên Windows

```powershell
python download_music.py
```

Script dò file MP3/OGG trên trang OpenGameArt theo `fileHint`, tải xuống `downloaded/<gameId>`. Nếu website chặn script, vào URL nguồn và bấm tải thủ công. **Chưa kiểm thử tải nhạc thành công trên máy bạn.**

Sau khi tải, kiểm tra các file phát được, nghe đủ bài, thử loop có vết cắt hay không, và dùng ffmpeg nếu cần xuất file OGG gọn nhẹ, ví dụ:

```powershell
ffmpeg -i input.wav -c:a libvorbis -q:a 5 output.ogg
```

Giữ metadata nguồn bài, tác giả và giấy phép trong repo. Không đưa các bài chưa kiểm chứng vào release. Trong file `music-catalog.json`, `status` là `needs-download-and-audio-review` cho đến khi duyệt thủ công.

## Khuyến nghị âm thanh cho LIVE

- Có một **MusicController** dùng chung với `loop`, volume, crossfade, stop/start và chế độ tự động thay bài.
- Khi TTS nói, giảm nhạc nền khoảng 10–15 dB rồi tăng lại sau câu nói (audio ducking).
- Bắt đầu với BGM khoảng 15–25% độ lớn tối đa trong engine, sau đó đo âm lượng và thử qua điện thoại; giá trị % không thay thế đo loudness.
- Mỗi game nên có ít nhất hai bản nền để tránh lặp một bài liên tục trong livestream dài.
- Tránh phát một bài cùng lúc từ Chrome và OBS Browser Source; OBS Virtual Camera không truyền audio.
- Kiểm tra TikTok LIVE Studio capture, đầu ra âm thanh và chính sách nền tảng trước khi live.

## Quyền sử dụng

Các trang nguồn hiển thị **CC0**, thường không yêu cầu ghi công, nhưng việc website đăng CC0 không bảo đảm không có quyền của bên thứ ba hay khiếu nại Content ID. Một track trong bộ `lofi Compilation` từng có báo cáo automated copyright claim (*Morning rain*, không được đưa vào gợi ý này). Giữ URL + tác giả + ngày duyệt, và cẩn trọng với LIVE thương mại. Chính sách TikTok vẫn áp dụng.

Không phát các bài theo lời quảng cáo “no copyright” nếu trang không có giấy phép cụ thể.
