"""
Friday MCP Server — Entry Point
Run with: python server.py
"""

from mcp.server.fastmcp import FastMCP
from friday.tools import register_all_tools
from friday.prompts import register_all_prompts
from friday.resources import register_all_resources
from friday.config import config

# Create the MCP server instance
mcp = FastMCP(
    name=config.SERVER_NAME,
    instructions=(
        "Bạn là Friday, một trợ lý AI phong cách Tony Stark. "
        "Bạn có quyền truy cập vào các công cụ để hỗ trợ người dùng. "
        "Hãy phản hồi ngắn gọn, chính xác, hơi dí dỏm và ưu tiên tiếng Việt."
    ),
)

# Register tools, prompts, and resources
register_all_tools(mcp)
register_all_prompts(mcp)
register_all_resources(mcp)

def main():
    mcp.run(transport='sse')

if __name__ == "__main__":
    main()
