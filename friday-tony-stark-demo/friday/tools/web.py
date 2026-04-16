"""
Web tools – tìm kiếm, tải trang, và tóm tắt tin tức thế giới.
"""

import httpx
import xml.etree.ElementTree as ET
import asyncio  # Cần thiết để thực thi song song
import re
from friday.search import get_weather_report, google_web_search

SEED_FEEDS = [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.cnbc.com/id/100727362/device/rss/rss.html',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://www.aljazeera.com/xml/rss/all.xml'
]

async def fetch_and_parse_feed(client, url):
    """Hàm hỗ trợ xử lý yêu cầu RSS feed và phân tích cú pháp XML."""
    try:
        response = await client.get(url, headers={'User-Agent': 'Friday-AI/1.0'}, timeout=5.0)
        if response.status_code != 200:
            return []

        root = ET.fromstring(response.content)
        # Lấy tên nguồn từ URL (ví dụ: 'BBC' hoặc 'NYTIMES')
        source_name = url.split('.')[1].upper()
        
        feed_items = []
        # Lấy tối đa 5 tin mỗi nguồn
        items = root.findall(".//item")[:5]
        for item in items:
            title = item.findtext("title")
            description = item.findtext("description")
            link = item.findtext("link")
            
            if description:
                # Loại bỏ các thẻ HTML trong mô tả
                description = re.sub('<[^<]+?>', '', description).strip()

            feed_items.append({
                "source": source_name,
                "title": title,
                "summary": description[:200] + "..." if description else "",
                "link": link
            })
        return feed_items
    except Exception:
        # Nếu một nguồn tin bị lỗi, trả về danh sách rỗng để không ảnh hưởng các nguồn khác
        return []

def register(mcp):

    @mcp.tool()
    async def get_world_news() -> str:
        """
        Lấy các tiêu đề tin tức thế giới mới nhất từ các nguồn lớn cùng lúc.
        Sử dụng khi người dùng hỏi 'Thế giới có gì mới?' hoặc về các sự kiện gần đây.
        """
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            # 1. Tạo danh sách các tác vụ (mỗi URL một tác vụ)
            tasks = [fetch_and_parse_feed(client, url) for url in SEED_FEEDS]
            
            # 2. Kích hoạt đồng thời và chờ kết quả
            results_of_lists = await asyncio.gather(*tasks)
            
            # 3. Gộp các danh sách con thành một danh sách bài báo duy nhất
            all_articles = [item for sublist in results_of_lists for item in sublist]

        if not all_articles:
            return "Luồng tin thế giới hiện không phản hồi, sếp ạ. Tôi chưa lấy được tiêu đề mới."

        # 4. Định dạng báo cáo cuối cùng
        report = ["### TIN NHANH THẾ GIỚI (TRỰC TIẾP)\n"]
        # Giới hạn 12 tin quan trọng nhất để tránh quá tải dữ liệu
        for entry in all_articles[:12]:
            report.append(f"**[{entry['source']}]** {entry['title']}")
            report.append(f"{entry['summary']}")
            report.append(f"Link: {entry['link']}\n")

        return "\n".join(report)

    @mcp.tool()
    async def search_web(query: str) -> str:
        """Tìm kiếm trên web theo yêu cầu và trả về bản tóm tắt kết quả."""
        return await asyncio.to_thread(google_web_search, query=query)

    @mcp.tool()
    async def get_weather(city: str, country: str = "Vietnam") -> str:
        """
        Lấy thời tiết hiện tại và dự báo ngắn hạn theo thành phố.
        Ví dụ city: "Da Lat", "Ho Chi Minh", "Ha Noi".
        """
        return await get_weather_report(city=city, country=country)

    @mcp.tool()
    async def fetch_url(url: str) -> str:
        """Tải nội dung văn bản thô từ một URL."""
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.text[:4000]
    
    @mcp.tool()
    async def open_world_monitor() -> str:
        """
        Mở bảng điều khiển World Monitor (worldmonitor.app) trên trình duyệt hệ thống.
        Sử dụng khi người dùng muốn xem bản đồ thời gian thực hoặc tổng quan trực quan.
        """
        import webbrowser
        url = "https://worldmonitor.app/"
        
        try:
            # Mở URL trong trình duyệt mặc định
            webbrowser.open(url)
            return "Đã mở màn hình theo dõi thế giới trên trình duyệt cho sếp."
        except Exception as e:
            return f"Tôi chưa thể khởi tạo màn hình theo dõi trực quan: {str(e)}"
