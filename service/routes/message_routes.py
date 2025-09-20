from . import message_bp
from controllers.message import get_test_message

@message_bp.route("/api/message")
def get_message():
    return get_test_message()
