from __future__ import annotations

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from friday.src.config.settings import get_settings
from friday.src.router.api_router import api_router
from friday.src.sse.routes import router as sse_router


def create_app() -> FastAPI:
    settings = get_settings()
    app = FastAPI(
        title=settings.app_name,
        version="0.1.0",
        docs_url="/docs",
        redoc_url="/redoc",
        openapi_url="/openapi.json",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(api_router, prefix=settings.api_v1_prefix)
    app.include_router(sse_router, prefix=settings.sse_prefix, tags=["sse"])

    @app.get("/")
    def root() -> dict[str, str | bool]:
        return {"ok": True, "service": settings.app_name}

    return app


app = create_app()


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "friday.src.main:app",
        host=settings.host,
        port=settings.port,
        http="h11",
        reload=False,
    )


if __name__ == "__main__":
    main()
