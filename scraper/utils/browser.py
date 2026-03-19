"""Browser automation utilities using Playwright for MCP-like behavior."""

import random
import time
from typing import Optional, List, Dict, Any
from contextlib import asynccontextmanager

from playwright.async_api import async_playwright, Browser, BrowserContext, Page
from tenacity import retry, stop_after_attempt, wait_exponential

from config import config


# User agents for rotation
USER_AGENTS = [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
]


class BrowserManager:
    """Manages browser instances with anti-detection features."""

    def __init__(self):
        self.browser: Optional[Browser] = None
        self.context: Optional[BrowserContext] = None
        self.page: Optional[Page] = None

    async def start(self, headless: bool = True, proxy: Optional[Dict[str, str]] = None):
        """Start a new browser instance."""
        playwright = await async_playwright().start()

        # Browser launch options
        launch_options = {
            "headless": headless,
            "args": [
                "--no-sandbox",
                "--disable-setuid-sandbox",
                "--disable-dev-shm-usage",
                "--disable-accelerated-2d-canvas",
                "--no-first-run",
                "--no-zygote",
                "--disable-gpu",
                "--disable-extensions",
                "--disable-web-security",
                "--disable-features=IsolateOrigins,site-per-process",
            ],
        }

        if proxy:
            launch_options["proxy"] = proxy

        self.browser = await playwright.chromium.launch(**launch_options)

        # Context options with anti-detection
        user_agent = random.choice(USER_AGENTS)
        viewport = {
            "width": random.randint(1200, 1920),
            "height": random.randint(700, 1080),
        }

        self.context = await self.browser.new_context(
            user_agent=user_agent,
            viewport=viewport,
            locale="en-US",
            timezone_id="America/New_York",
            geolocation=None,
            permissions=[],
            color_scheme="light",
            reduced_motion="no-preference",
        )

        # Add anti-detection scripts
        await self.context.add_init_script("""
            Object.defineProperty(navigator, 'webdriver', {
                get: () => undefined,
            });
            Object.defineProperty(navigator, 'platform', {
                get: () => 'Win32',
            });
            Object.defineProperty(navigator, 'plugins', {
                get: () => [1, 2, 3, 4, 5],
            });
            Object.defineProperty(navigator, 'languages', {
                get: () => ['en-US', 'en'],
            });
            window.chrome = {
                runtime: {},
            };
        """)

        self.page = await self.context.new_page()
        return self

    async def navigate(self, url: str, wait_until: str = "networkidle", timeout: int = 30000):
        """Navigate to a URL with retry logic."""
        if not self.page:
            raise RuntimeError("Browser not started")

        # Random delay before navigation
        await self.random_delay(1, 3)

        response = await self.page.goto(
            url,
            wait_until=wait_until,
            timeout=timeout,
        )

        # Additional delay to seem human-like
        await self.random_delay(2, 4)

        return response

    async def get_content(self) -> str:
        """Get page content."""
        if not self.page:
            raise RuntimeError("Browser not started")
        return await self.page.content()

    async def click(self, selector: str):
        """Click an element with human-like behavior."""
        if not self.page:
            raise RuntimeError("Browser not started")

        await self.page.hover(selector)
        await self.random_delay(0.5, 1.5)
        await self.page.click(selector)
        await self.random_delay(1, 2)

    async def type(self, selector: str, text: str, delay: float = 0.1):
        """Type text with human-like behavior."""
        if not self.page:
            raise RuntimeError("Browser not started")

        await self.page.click(selector)
        await self.random_delay(0.5, 1)

        # Type with variable speed
        for char in text:
            await self.page.type(selector, char, delay=delay * random.uniform(0.8, 1.5))
            await self.random_delay(0.05, 0.15)

    async def scroll_to_bottom(self):
        """Scroll to bottom of page."""
        if not self.page:
            raise RuntimeError("Browser not started")

        await self.page.evaluate("""
            async () => {
                await new Promise((resolve) => {
                    let totalHeight = 0;
                    const distance = 100;
                    const timer = setInterval(() => {
                        const scrollHeight = document.body.scrollHeight;
                        window.scrollBy(0, distance);
                        totalHeight += distance;

                        if (totalHeight >= scrollHeight) {
                            clearInterval(timer);
                            resolve(null);
                        }
                    }, 100);
                });
            }
        """)

    async def random_delay(self, min_seconds: float, max_seconds: float):
        """Wait for a random duration."""
        await self.page.wait_for_timeout(random.randint(int(min_seconds * 1000), int(max_seconds * 1000)))

    async def close(self):
        """Close browser and clean up."""
        if self.context:
            await self.context.close()
        if self.browser:
            await self.browser.close()

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()


@asynccontextmanager
async def managed_browser(headless: bool = True):
    """Context manager for browser instances."""
    manager = BrowserManager()
    try:
        await manager.start(headless=headless)
        yield manager
    finally:
        await manager.close()
