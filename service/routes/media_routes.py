from . import media_bp
from flask import jsonify, request, session
from controllers.media import generate_upload_url, confirm_upload, get_s3_assets, get_download_url, sync_s3_assets, diagnose_s3, fix_s3_cors, diagnose_s3, fix_s3_cors

@media_bp.route('/api/media/upload-url', methods=['POST'])
def media_upload_url():
    """Generate presigned URL for direct browser upload to S3"""
    return generate_upload_url()

@media_bp.route('/api/media/confirm-upload', methods=['POST'])
def media_confirm_upload():
    """Confirm file was uploaded and register it in database"""
    return confirm_upload()

@media_bp.route('/api/s3-assets')
def media_list():
    """List all registered S3 assets"""
    return get_s3_assets()

@media_bp.route('/api/media/download-url/<path:file_name>')
def media_download(file_name):
    """Generate presigned download URL for S3 object"""
    return get_download_url(file_name)

@media_bp.route('/api/media/sync', methods=['POST'])
def media_sync():
    """Sync S3 bucket contents with local database"""
    if not session.get('admin_authenticated'):
        return jsonify({'error': 'Unauthorized'}), 401
    return sync_s3_assets()

@media_bp.route('/api/media/diagnose', methods=['GET'])
def media_diagnose():
    """Diagnose S3 configuration and permissions"""
    return diagnose_s3()

@media_bp.route('/api/media/fix-cors', methods=['POST'])
def media_fix_cors():
    """Attempt to fix S3 CORS configuration"""
    return fix_s3_cors()
