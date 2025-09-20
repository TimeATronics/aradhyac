from flask import Flask, request, jsonify
from dotenv import load_dotenv
import os
import logging
from models import db
from models.test_message import TestMessage
from models.s3_asset import S3Asset
from routes import message_bp
import boto3
from botocore.exceptions import ClientError

load_dotenv()

app = Flask(__name__)

handler = logging.StreamHandler()
handler.setLevel(logging.INFO)
app.logger.addHandler(handler)
app.logger.setLevel(logging.INFO)

app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URI')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)
with app.app_context():
    db.create_all()

app.register_blueprint(message_bp)

S3_BUCKET_NAME = "aradhyac-assets"  # Your bucket name

@app.route('/api/media/download-url/<path:file_name>')
def get_download_url(file_name):
    """Generates a presigned URL to download a file from S3."""
    s3_client = boto3.client('s3')
    try:
        # URL is valid for 1 hour (3600 seconds)
        url = s3_client.generate_presigned_url('get_object',
                                                Params={'Bucket': S3_BUCKET_NAME,
                                                        'Key': file_name},
                                                ExpiresIn=3600)
        app.logger.info(f"Generated download URL for {file_name}")
        return jsonify({"url": url})
    except ClientError as e:
        app.logger.error(f"Error generating S3 download URL: {e}")
        return jsonify({"error": "Could not generate URL"}), 500

@app.route('/api/s3-assets')
def get_s3_assets():
    """Gets all S3 assets from the database."""
    try:
        assets = S3Asset.query.all()
        return jsonify([asset.to_json() for asset in assets])
    except Exception as e:
        app.logger.error(f"Error fetching S3 assets: {e}")
        return jsonify({"error": "Could not fetch assets"}), 500

if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)