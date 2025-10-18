import logging
import os
from mundial_fifa.settings import BASE_DIR

log_dir = os.path.join(BASE_DIR, 'logs')
if not os.path.exists(log_dir):
    os.makedirs(log_dir)

logging.basicConfig(
    level=logging.ERROR,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(os.path.join(log_dir, 'futbox_critical.log')),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)

def log_critical_error(message, exception=None):
    if exception:
        logger.critical(f"{message}: {str(exception)}")
    else:
        logger.critical(message)