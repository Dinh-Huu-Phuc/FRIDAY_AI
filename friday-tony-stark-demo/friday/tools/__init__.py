"""Tool registry - imports and registers all tool modules with the MCP server."""

def register_all_tools(mcp):
    """Register all tool groups onto the MCP server instance."""
    from friday.tools import facebook, social, system, utils, web, windows_launcher

    facebook.register(mcp)
    social.register(mcp)
    web.register(mcp)
    system.register(mcp)
    utils.register(mcp)
    windows_launcher.register(mcp)
