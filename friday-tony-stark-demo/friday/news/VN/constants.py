from __future__ import annotations

NEWS_API_ENDPOINT = "https://newsdata.io/api/1/latest"

DEFAULT_NEWS_LANGUAGE = "vi"
DEFAULT_NEWS_COUNTRY = "vn"
DEFAULT_NEWS_LIMIT = 6
DEFAULT_NEWS_REQUEST_TIMEOUT = 8.0
MAX_NEWS_LIMIT = 20

NEWS_INTENT_KEYWORDS: tuple[str, ...] = (
    "tin tuc",
    "tin moi",
    "cap nhat tin",
    "co gi moi",
    "tin nong",
    "tom tat tin",
    "ban tin",
    "thoi su",
    "news",
)

TOPIC_ALIAS_TO_API_CATEGORY: dict[str, str] = {
    "the gioi": "world",
    "quoc te": "world",
    "toan cau": "world",
    "tai chinh": "business",
    "kinh doanh": "business",
    "chung khoan": "business",
    "dau tu": "business",
    "cong nghe": "technology",
    "ai": "technology",
    "tri tue nhan tao": "technology",
    "khoa hoc": "science",
    "the thao": "sports",
    "giai tri": "entertainment",
    "suc khoe": "health",
    "y te": "health",
    "chinh tri": "politics",
}

COUNTRY_ALIAS_TO_CODE: dict[str, str] = {
    "viet nam": "vn",
    "vn": "vn",
    "vietnam": "vn",
    "my": "us",
    "hoa ky": "us",
    "us": "us",
    "anh": "gb",
    "uk": "gb",
    "united kingdom": "gb",
    "japan": "jp",
    "nhat": "jp",
    "han quoc": "kr",
    "korea": "kr",
    "singapore": "sg",
    "thai lan": "th",
    "thailand": "th",
}

LANGUAGE_ALIAS_TO_CODE: dict[str, str] = {
    "tieng viet": "vi",
    "viet": "vi",
    "vietnamese": "vi",
    "english": "en",
    "tieng anh": "en",
    "anh": "en",
}
