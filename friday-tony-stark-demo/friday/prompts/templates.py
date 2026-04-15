"""
Reusable prompt templates registered with the MCP server.
"""


def register(mcp):

    @mcp.prompt()
    def summarize(text: str) -> str:
        """Prompt to summarize a block of text."""
        return f"Hãy tóm tắt ngắn gọn nội dung sau bằng tiếng Việt tự nhiên:\n\n{text}"

    @mcp.prompt()
    def explain_code(code: str, language: str = "Python") -> str:
        """Prompt to explain a block of code."""
        return (
            f"Hãy giải thích đoạn mã {language} sau bằng tiếng Việt dễ hiểu, "
            f"theo từng bước:\n\n```{language.lower()}\n{code}\n```"
        )
