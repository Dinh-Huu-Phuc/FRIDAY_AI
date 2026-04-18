# Playground Code Enhancer

Mục tiêu: khi agent trả source code trên `https://agents-playground.livekit.io/`, phần code sẽ:
- Hiển thị đẹp theo block.
- Có syntax highlight.
- Có nút copy (icon 📋).

## Phân tích ngắn

- Bản hosted `agents-playground.livekit.io` không cho backend agent tự gắn nút UI.
- Vì vậy muốn có icon copy/format đẹp thì cần can thiệp frontend.
- Cách nhanh nhất là dùng userscript (Tampermonkey) để render lại code block ngay trên trình duyệt.
- Cách chuẩn production là self-host `agents-playground` rồi sửa renderer React.

## Cách dùng nhanh (hosted playground)

1. Cài extension Tampermonkey cho Chrome/Edge.
2. Tạo script mới.
3. Dán toàn bộ nội dung file:
   - `playground-enhancer/agents_playground_code_enhancer.user.js`
4. Save và bật script.
5. Mở lại `https://agents-playground.livekit.io/`.

Khi agent gửi text có fenced code dạng:

```markdown
```python
print("hello")
```
```

script sẽ tự:
- Tách code block.
- Highlight theo ngôn ngữ.
- Gắn nút `📋 Copy`.

## Nếu vẫn hiển thị xấu

1. Mở DevTools Console và kiểm tra có log:
   - `[FridayEnhancer] Ready`
2. Kiểm tra góc phải trên có nút:
   - `✨ Format Code`
3. Bấm nút đó một lần để format lại toàn bộ message hiện tại.
4. Nếu chưa có, kiểm tra lại:
   - Tampermonkey đang bật.
   - Script đang enabled.
   - `@match` đúng domain `https://agents-playground.livekit.io/*`.
5. Hard reload trang (`Ctrl + Shift + R`).
6. Thử gửi prompt mẫu:
   - "Viết hàm cộng bằng Python, trả trong code block chuẩn."
7. Nếu message không có dấu ``` thì bản 1.2 vẫn có mode bắt code thô nhiều dòng, nhưng kết quả đẹp nhất vẫn là fenced code block chuẩn.

## Gợi ý để agent trả code ổn định hơn

Trong prompt hệ thống của agent, thêm quy tắc:
- Khi trả source code, luôn dùng markdown fenced code block.
- Luôn có tag ngôn ngữ, ví dụ `python`, `javascript`, `bash`.
- Không dùng dấu backtick đơn cho block code nhiều dòng.

Ví dụ đúng:

```markdown
```python
def add(a, b):
    return a + b
```
```

## Nâng cấp thêm (nếu cần)

- Nếu bạn muốn chỉnh UI sâu hơn (theme, font, panel riêng cho code), nên self-host:
  - `https://github.com/livekit/agents-playground`
- Lúc đó mình có thể giúp bạn patch trực tiếp component chat để có:
  - Copy icon chuẩn SVG.
  - Line numbers.
  - Wrap/nowrap toggle.
  - Download file `.py` / `.js`.
