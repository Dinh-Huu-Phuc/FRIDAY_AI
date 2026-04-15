"""
Web tools – tìm kiếm, tải trang, và tóm tắt tin tức thế giới.
"""

import httpx
import xml.etree.ElementTree as ET
import asyncio  # Cần thiết để thực thi song song
import re
from datetime import datetime
from friday.search import google_web_search

SEED_FEEDS = [
    'https://feeds.bbci.co.uk/news/world/rss.xml',
    'https://www.cnbc.com/id/100727362/device/rss/rss.html',
    'https://rss.nytimes.com/services/xml/rss/nyt/World.xml',
    'https://www.aljazeera.com/xml/rss/all.xml'
]

WEATHER_CODE_TEXT = {
    0: "trời quang",
    1: "khá quang",
    2: "mây rải rác",
    3: "nhiều mây",
    45: "sương mù",
    48: "sương mù đóng băng",
    51: "mưa phùn nhẹ",
    53: "mưa phùn vừa",
    55: "mưa phùn nặng hạt",
    56: "mưa phùn đóng băng nhẹ",
    57: "mưa phùn đóng băng nặng",
    61: "mưa nhẹ",
    63: "mưa vừa",
    65: "mưa to",
    66: "mưa đóng băng nhẹ",
    67: "mưa đóng băng nặng",
    71: "tuyết rơi nhẹ",
    73: "tuyết rơi vừa",
    75: "tuyết rơi dày",
    77: "hạt tuyết",
    80: "mưa rào nhẹ",
    81: "mưa rào vừa",
    82: "mưa rào mạnh",
    85: "mưa tuyết nhẹ",
    86: "mưa tuyết mạnh",
    95: "dông",
    96: "dông kèm mưa đá nhẹ",
    99: "dông kèm mưa đá mạnh",
}

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
        return google_web_search(query=query)

    @mcp.tool()
    async def get_weather(city: str, country: str = "Vietnam") -> str:
        """
        Lấy thời tiết hiện tại theo thành phố.
        Ví dụ city: "Da Lat", "Ho Chi Minh", "Ha Noi".
        """
        city = (city or "").strip()
        country = (country or "").strip()
        if not city:
            return "Bạn chưa cung cấp tên thành phố để tra cứu thời tiết."

        geo_url = "https://geocoding-api.open-meteo.com/v1/search"
        forecast_url = "https://api.open-meteo.com/v1/forecast"

        try:
            async with httpx.AsyncClient(follow_redirects=True, timeout=12) as client:
                geo_res = await client.get(
                    geo_url,
                    params={
                        "name": city,
                        "count": 1,
                        "language": "vi",
                        "format": "json",
                        "country": country,
                    },
                )
                geo_res.raise_for_status()
                geo_data = geo_res.json()
                results = geo_data.get("results") or []
                if not results:
                    return f"Tôi chưa tìm thấy thành phố '{city}' để lấy thời tiết."

                place = results[0]
                lat = place.get("latitude")
                lon = place.get("longitude")
                city_name = place.get("name", city)
                admin = place.get("admin1") or ""
                country_name = place.get("country") or country

                weather_res = await client.get(
                    forecast_url,
                    params={
                        "latitude": lat,
                        "longitude": lon,
                        "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
                        "timezone": "auto",
                    },
                )
                weather_res.raise_for_status()
                weather_data = weather_res.json()
                current = weather_data.get("current") or {}
        except Exception as exc:
            return f"Tôi chưa lấy được dữ liệu thời tiết lúc này: {exc}"

        temp = current.get("temperature_2m")
        feels = current.get("apparent_temperature")
        humidity = current.get("relative_humidity_2m")
        wind = current.get("wind_speed_10m")
        code = int(current.get("weather_code", -1))
        status = WEATHER_CODE_TEXT.get(code, "điều kiện thời tiết chưa xác định")

        location_text = city_name
        if admin:
            location_text += f", {admin}"
        if country_name:
            location_text += f", {country_name}"

        return (
            f"Thời tiết hiện tại ở {location_text}: {status}. "
            f"Nhiệt độ {temp}°C, cảm giác như {feels}°C, độ ẩm {humidity}%, "
            f"gió khoảng {wind} km/h."
        )

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
