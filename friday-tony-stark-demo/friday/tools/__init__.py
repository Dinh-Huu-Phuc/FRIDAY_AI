"""Tool registry - imports and registers all tool modules with the MCP server."""

from friday.tools import facebook, social, system, utils, web


def register_all_tools(mcp):
    """Register all tool groups onto the MCP server instance."""
    facebook.register(mcp)
    social.register(mcp)
    web.register(mcp)
    system.register(mcp)
    utils.register(mcp)
