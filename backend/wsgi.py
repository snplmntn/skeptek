from main import app
from waitress import serve
import logging

import os

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    logger = logging.getLogger("waitress")
    logger.info("🚀 skeptek backend starting in PRODUCTION mode with Waitress...")
    
    port = int(os.environ.get("PORT", 8000))
    # threads=8 is a good default for I/O bound tasks like scraping
    serve(app, host="0.0.0.0", port=port, threads=8)
