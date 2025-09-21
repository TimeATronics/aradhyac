from flask import current_app, jsonify, request, session
from models.s3_asset import S3Asset
from models import db
import boto3
from botocore.exceptions import ClientError
import os
import mimetypes
from werkzeug.utils import secure_filename
import io
from botocore.config import Config

S3_BUCKET_NAME = os.getenv('S3_BUCKET_NAME', 'aradhyac-assets')


def get_download_url(file_name):
    s3_client = boto3.client('s3')
    try:
        url = s3_client.generate_presigned_url('get_object', Params={'Bucket': S3_BUCKET_NAME, 'Key': file_name}, ExpiresIn=3600)
        current_app.logger.info(f"Generated download URL for {file_name}")
        return jsonify({"url": url})
    except ClientError as e:
        current_app.logger.error(f"Error generating S3 download URL: {e}")
        return jsonify({"error": "Could not generate URL"}), 500


def get_s3_assets():
    try:
        assets = S3Asset.query.all()
        return jsonify([asset.to_json() for asset in assets])
    except Exception as e:
        current_app.logger.error(f"Error fetching S3 assets: {e}")
        return jsonify({"error": "Could not fetch assets"}), 500


def generate_upload_url():
    """Generate a presigned PUT URL for direct browser upload to S3.
    
    Request: POST /api/media/upload-url
    Body: { "fileName": "test.jpg", "fileType": "image/jpeg", "targetFolder": "blog_images" }
    Response: { "uploadUrl": "https://...", "key": "blog_images/test.jpg" }
    """
    if not session.get('admin_authenticated'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        data = request.get_json(silent=True) or {}
        file_name = (data.get('fileName') or data.get('file_name') or '').strip()
        file_type = (data.get('fileType') or data.get('file_type') or '').strip() or 'application/octet-stream'
        target_folder = (data.get('targetFolder') or data.get('target_folder') or 'blog_images').strip()
        
        if not file_name:
            return jsonify({'error': 'fileName is required'}), 400
            
        if target_folder not in ('blog_images', 'music'):
            return jsonify({'error': 'targetFolder must be blog_images or music'}), 400
        
        # Sanitize filename and create S3 key
        safe_name = secure_filename(file_name)
        if not safe_name:
            return jsonify({'error': 'Invalid filename'}), 400
            
        s3_key = f"{target_folder}/{safe_name}"
        
        # Create S3 client with proper region and signature version
        region = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-east-1'
        s3_client = boto3.client(
            's3', 
            region_name=region,
            config=Config(signature_version='s3v4')
        )
        
        # Generate presigned PUT URL
        params = {
            'Bucket': S3_BUCKET_NAME,
            'Key': s3_key,
            'ContentType': file_type
        }
        
        upload_url = s3_client.generate_presigned_url(
            ClientMethod='put_object',
            Params=params,
            ExpiresIn=3600
        )
        
        current_app.logger.info(f"Generated upload URL for {s3_key}")
        return jsonify({
            'uploadUrl': upload_url, 
            'key': s3_key,
            'contentType': file_type
        })
        
    except ClientError as e:
        current_app.logger.error(f"AWS error generating upload URL: {e}")
        return jsonify({'error': 'Failed to generate upload URL'}), 500
    except Exception as e:
        current_app.logger.error(f"Error generating upload URL: {e}")
        return jsonify({'error': 'Server error'}), 500


def confirm_upload():
    """Confirm file was uploaded to S3 and register it in the database.
    
    Request: POST /api/media/confirm-upload  
    Body: { "key": "blog_images/test.jpg", "fileType": "image/jpeg" }
    Response: { "success": true, "asset": {...} }
    """
    if not session.get('admin_authenticated'):
        return jsonify({'error': 'Unauthorized'}), 401
        
    try:
        data = request.get_json(silent=True) or {}
        s3_key = (data.get('key') or '').strip()
        file_type = (data.get('fileType') or data.get('file_type') or 'application/octet-stream').strip()
        
        if not s3_key:
            return jsonify({'error': 'key is required'}), 400
            
        # Verify the file exists in S3
        s3_client = boto3.client('s3')
        try:
            s3_client.head_object(Bucket=S3_BUCKET_NAME, Key=s3_key)
        except ClientError as e:
            current_app.logger.error(f"File not found in S3: {s3_key}, error: {e}")
            return jsonify({'error': 'File not found in S3'}), 404
            
        # Determine use_type from the key prefix
        if s3_key.startswith('blog_images/'):
            use_type = 'blog_images'
        elif s3_key.startswith('music/'):
            use_type = 'music'
        else:
            use_type = 'general'
            
        # Check if already registered
        existing = S3Asset.query.filter_by(file_name=s3_key).first()
        if existing:
            # Update file type if different
            if existing.file_type != file_type:
                existing.file_type = file_type
                db.session.commit()
            return jsonify({'success': True, 'asset': existing.to_json()})
            
        # Register new asset
        new_asset = S3Asset(
            file_name=s3_key,
            file_type=file_type,
            use_type=use_type
        )
        db.session.add(new_asset)
        db.session.commit()
        
        current_app.logger.info(f"Registered uploaded file: {s3_key}")
        return jsonify({'success': True, 'asset': new_asset.to_json()})
        
    except Exception as e:
        current_app.logger.error(f"Error confirming upload: {e}")
        try:
            db.session.rollback()
        except Exception:
            pass
        return jsonify({'error': 'Failed to confirm upload'}), 500


def sync_s3_assets():
    """List objects in S3 under blog_images/ and music/ and sync into local s3_assets table.

    Adds missing rows and updates file_type when it differs. Returns counts.
    """
    if not session.get('admin_authenticated'):
        return jsonify({'error': 'Unauthorized'}), 401
    try:
        prefixes = ['blog_images/', 'music/']
        s3_client = boto3.client('s3')
        paginator = s3_client.get_paginator('list_objects_v2')
        added = 0
        updated = 0

        for prefix in prefixes:
            pages = paginator.paginate(Bucket=S3_BUCKET_NAME, Prefix=prefix)
            for page in pages:
                for obj in page.get('Contents', []):
                    key = obj.get('Key')
                    if not key:
                        continue
                    # guess content type by filename
                    content_type, _ = mimetypes.guess_type(key)
                    if not content_type:
                        content_type = 'application/octet-stream'

                    existing = S3Asset.query.filter_by(file_name=key).first()
                    if existing:
                        if existing.file_type != content_type:
                            existing.file_type = content_type
                            db.session.add(existing)
                            updated += 1
                    else:
                        use_type = 'music' if key.startswith('music/') else 'blog_images'
                        new_asset = S3Asset(file_name=key, file_type=content_type, use_type=use_type)
                        db.session.add(new_asset)
                        added += 1
        db.session.commit()
        total = S3Asset.query.count()
        return jsonify({'success': True, 'added': added, 'updated': updated, 'total': total})
    except Exception as e:
        current_app.logger.error(f"Error syncing S3 assets: {e}")
        try:
            db.session.rollback()
        except Exception:
            pass
        return jsonify({'error': 'Failed to sync assets'}), 500


def diagnose_s3():
    """Diagnostic endpoint to test S3 permissions and configuration.
    
    Tests: bucket access, upload permissions, CORS settings
    """
    if not session.get('admin_authenticated'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        region = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-east-1'
        s3_client = boto3.client(
            's3', 
            region_name=region,
            config=Config(signature_version='s3v4')
        )
        
        diagnostics = {
            'bucket': S3_BUCKET_NAME,
            'region': region,
            'tests': {}
        }
        
        # Test 1: Can we access the bucket?
        try:
            s3_client.head_bucket(Bucket=S3_BUCKET_NAME)
            diagnostics['tests']['bucket_access'] = {'status': 'OK', 'message': 'Bucket accessible'}
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            diagnostics['tests']['bucket_access'] = {
                'status': 'FAIL', 
                'message': f'Cannot access bucket: {error_code}',
                'error': str(e)
            }
        
        # Test 2: Can we list objects?
        try:
            response = s3_client.list_objects_v2(Bucket=S3_BUCKET_NAME, Prefix='blog_images/', MaxKeys=1)
            count = response.get('KeyCount', 0)
            diagnostics['tests']['list_objects'] = {'status': 'OK', 'message': f'Can list objects, found {count} in blog_images/'}
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            diagnostics['tests']['list_objects'] = {
                'status': 'FAIL', 
                'message': f'Cannot list objects: {error_code}',
                'error': str(e)
            }
        
        # Test 3: Check CORS configuration
        try:
            cors_response = s3_client.get_bucket_cors(Bucket=S3_BUCKET_NAME)
            cors_rules = cors_response.get('CORSRules', [])
            diagnostics['tests']['cors'] = {
                'status': 'OK', 
                'message': f'CORS configured with {len(cors_rules)} rules',
                'rules': cors_rules
            }
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == 'NoSuchCORSConfiguration':
                diagnostics['tests']['cors'] = {
                    'status': 'MISSING', 
                    'message': 'No CORS configuration found'
                }
            else:
                diagnostics['tests']['cors'] = {
                    'status': 'FAIL', 
                    'message': f'Cannot check CORS: {error_code}',
                    'error': str(e)
                }
        
        # Test 4: Try to create a presigned URL
        try:
            test_key = 'blog_images/test-upload.txt'
            params = {
                'Bucket': S3_BUCKET_NAME,
                'Key': test_key,
                'ContentType': 'text/plain'
            }
            url = s3_client.generate_presigned_url(
                ClientMethod='put_object',
                Params=params,
                ExpiresIn=300  # 5 minutes
            )
            diagnostics['tests']['presigned_url'] = {
                'status': 'OK', 
                'message': 'Can generate presigned URLs',
                'sample_url': url[:100] + '...'  # truncate for security
            }
        except Exception as e:
            diagnostics['tests']['presigned_url'] = {
                'status': 'FAIL', 
                'message': f'Cannot generate presigned URL: {str(e)}'
            }
        
        # Test 5: Check bucket policy (if we have permission)
        try:
            policy_response = s3_client.get_bucket_policy(Bucket=S3_BUCKET_NAME)
            policy = policy_response.get('Policy')
            diagnostics['tests']['bucket_policy'] = {
                'status': 'EXISTS', 
                'message': 'Bucket has a policy (check if it allows PutObject)',
                'policy_length': len(policy) if policy else 0
            }
        except ClientError as e:
            error_code = e.response.get('Error', {}).get('Code', 'Unknown')
            if error_code == 'NoSuchBucketPolicy':
                diagnostics['tests']['bucket_policy'] = {
                    'status': 'NONE', 
                    'message': 'No bucket policy (relying on IAM permissions)'
                }
            else:
                diagnostics['tests']['bucket_policy'] = {
                    'status': 'UNKNOWN', 
                    'message': f'Cannot check bucket policy: {error_code}'
                }
        
        return jsonify(diagnostics)
        
    except Exception as e:
        current_app.logger.error(f"Error in S3 diagnostics: {e}")
        return jsonify({'error': 'Diagnostic failed', 'message': str(e)}), 500


def fix_s3_cors():
    """Attempt to set proper CORS configuration for the S3 bucket"""
    if not session.get('admin_authenticated'):
        return jsonify({'error': 'Unauthorized'}), 401
    
    try:
        region = os.getenv('AWS_REGION') or os.getenv('AWS_DEFAULT_REGION') or 'us-east-1'
        s3_client = boto3.client(
            's3', 
            region_name=region,
            config=Config(signature_version='s3v4')
        )
        
        frontend_origin = os.getenv('FRONTEND_ORIGIN', 'http://localhost:5173')
        
        cors_config = {
            'CORSRules': [
                {
                    'AllowedOrigins': [frontend_origin, 'http://localhost:5173'],
                    'AllowedMethods': ['GET', 'PUT', 'POST', 'HEAD', 'DELETE'],
                    'AllowedHeaders': ['*'],
                    'ExposeHeaders': ['ETag', 'x-amz-meta-custom-header'],
                    'MaxAgeSeconds': 3600
                }
            ]
        }
        
        s3_client.put_bucket_cors(Bucket=S3_BUCKET_NAME, CORSConfiguration=cors_config)
        
        current_app.logger.info(f"Successfully set CORS for bucket {S3_BUCKET_NAME}")
        return jsonify({
            'success': True, 
            'message': f'CORS configured for {frontend_origin}',
            'cors_rules': cors_config['CORSRules']
        })
        
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code', 'Unknown')
        error_message = e.response.get('Error', {}).get('Message', str(e))
        current_app.logger.error(f"Failed to set CORS: {error_code} - {error_message}")
        return jsonify({
            'error': f'Failed to set CORS: {error_code}',
            'message': error_message,
            'suggestion': 'You may need to set CORS manually in AWS Console'
        }), 500
    except Exception as e:
        current_app.logger.error(f"Error setting CORS: {e}")
        return jsonify({'error': 'Failed to set CORS', 'message': str(e)}), 500



