from __future__ import annotations

from friday.gmail_system_agent import check_unread_gmail_with_timeout, format_gmail_report


def register(mcp):
    @mcp.tool()
    async def check_unread_gmail_messages(include_locally_reported: bool = False) -> str:
        """
        Kiểm tra Gmail chưa đọc của người dùng bằng Gmail API readonly, lưu log local,
        rồi báo cáo lại nội dung chính. Dùng khi người dùng yêu cầu check Gmail,
        đọc email, kiểm tra email chưa đọc, hoặc báo cáo inbox.
        """

        result = await check_unread_gmail_with_timeout(
            include_locally_reported=include_locally_reported,
        )
        return format_gmail_report(result)
