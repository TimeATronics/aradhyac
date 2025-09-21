from . import contact_bp
from controllers.contact import save_contact

@contact_bp.route("/api/contact", methods=["POST"])
def contact():
    return save_contact()
