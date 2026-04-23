"""
Web tools – tìm kiếm, tải trang, tóm tắt tin tức thế giới và tài chính.
"""

import httpx
import xml.etree.ElementTree as ET
import asyncio  # Cần thiết để thực thi song song
import re
import webbrowser # Thêm thư viện để mở link trình duyệt
from friday.search import get_weather_report, google_web_search

# --- CÁC NGUỒN TIN TỨC CHUNG ---
SEED_FEEDS = [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.cnbc.com/id/100727362/device/rss/rss.html',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://www.aljazeera.com/xml/rss/all.xml'
]

# --- [MỚI] CÁC NGUỒN TIN TỨC TÀI CHÍNH ---
FINANCE_SEED_FEEDS = [
    'https://www.cnbc.com/id/10000664/device/rss/rss.html',        # CNBC Finance
    'https://feeds.bloomberg.com/markets/news.rss',                # Bloomberg Markets
    'https://www.reutersagency.com/feed/?taxonomy=best-sectors&post_type=best',  # Reuters
    'https://feeds.marketwatch.com/marketwatch/topstories/',       # MarketWatch
    'https://rss.nytimes.com/services/xml/rss/nyt/Business.xml',   # NYT Business
]

async def fetch_and_parse_feed(client, url):
    """Hàm hỗ trợ xử lý yêu cầu RSS feed và phân tích cú pháp XML."""
    try:
        response = await client.get(url, headers={'User-Agent': 'Friday-AI/1.0'}, timeout=5.0)
        if response.status_code != 200:
            return []

        root = ET.fromstring(response.content)
        # Lấy tên nguồn từ URL (ví dụ: 'BBC' hoặc 'NYTIMES')
        parts = url.split('.')
        source_name = parts[1].upper() if len(parts) > 1 else "NEWS"
        
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
            tasks = [fetch_and_parse_feed(client, url) for url in SEED_FEEDS]
            results_of_lists = await asyncio.gather(*tasks)
            all_articles = [item for sublist in results_of_lists for item in sublist]

        if not all_articles:
            return "Luồng tin thế giới hiện không phản hồi, sếp ạ. Tôi chưa lấy được tiêu đề mới."

        report = ["### TIN NHANH THẾ GIỚI (TRỰC TIẾP)\n"]
        for entry in all_articles[:12]:
            report.append(f"**[{entry['source']}]** {entry['title']}")
            report.append(f"{entry['summary']}")
            report.append(f"Link: {entry['link']}\n")

        return "\n".join(report)

    # --- [MỚI] CÔNG CỤ LẤY TIN TỨC TÀI CHÍNH ---
    @mcp.tool()
    async def get_world_finance_news() -> str:
        """
        Lấy tin tức tài chính và thị trường mới nhất từ các nguồn tài chính lớn.
        Sử dụng khi người dùng hỏi về kinh tế, chứng khoán hoặc thị trường tài chính.
        """
        async with httpx.AsyncClient(follow_redirects=True, timeout=10) as client:
            tasks = [fetch_and_parse_feed(client, url) for url in FINANCE_SEED_FEEDS]
            results_of_lists = await asyncio.gather(*tasks)
            all_articles = [item for sublist in results_of_lists for item in sublist]

        if not all_articles:
            return "Các nguồn tin tài chính hiện không phản hồi, sếp ạ. Tôi không thể cập nhật tin thị trường."

        report = ["### BẢN TIN TÀI CHÍNH (TRỰC TIẾP)\n"]
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
        """
        url = "https://worldmonitor.app/"
        try:
            webbrowser.open(url)
            return "Đã mở màn hình theo dõi thế giới trên trình duyệt cho sếp."
        except Exception as e:
            return f"Tôi chưa thể khởi tạo màn hình theo dõi trực quan: {str(e)}"

    # --- [MỚI] MỞ MONITOR TÀI CHÍNH ---
    @mcp.tool()
    async def open_finance_world_monitor() -> str:
        """
        Mở bảng điều khiển Tài chính (finance.worldmonitor.app) trên trình duyệt.
        Sử dụng khi người dùng muốn xem biểu đồ thị trường hoặc xu hướng kinh tế trực quan.
        """
        url = "https://finance.worldmonitor.app/"
        try:
            webbrowser.open(url)
            return "Đã hiển thị màn hình theo dõi Tài chính Thế giới cho sếp."
        except Exception as e:
            return f"Tôi không thể khởi động màn hình theo dõi tài chính: {str(e)}"