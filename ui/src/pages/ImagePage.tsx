// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import { useEffect } from 'react';
import { Typography, Box, Container, List, ListItem, ListItemButton, ListItemText } from '@mui/material';
import { fetchImageRequest } from '../store/actions/imageActions';
import { fetchAssetsRequest } from '../store/actions/assetsActions';
import type { RootState, AppDispatch } from '../store';

function ImagePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { url, loading: imageLoading, error: imageError } = useSelector((state: RootState) => state.image);
  const { assets, loading: assetsLoading, error: assetsError } = useSelector((state: RootState) => state.assets);

  useEffect(() => {
    dispatch(fetchAssetsRequest());
  }, [dispatch]);

  const handleSelectAsset = (fileName: string) => {
    dispatch(fetchImageRequest(fileName));
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Image from S3
        </Typography>
        {assetsLoading && <Typography>Loading assets...</Typography>}
        {assetsError && <Typography color="error">Error loading assets: {assetsError}</Typography>}
        {!assetsLoading && !assetsError && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="h6">Available Images:</Typography>
            <List>
              {assets.map((asset) => (
                <ListItem key={asset.id}>
                  <ListItemButton onClick={() => handleSelectAsset(asset.file_name)}>
                    <ListItemText primary={asset.file_name} secondary={asset.file_type} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Box>
        )}
        {imageLoading && <Typography>Loading image...</Typography>}
        {imageError && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {imageError}
          </Typography>
        )}
        {url && (
          <Box sx={{ mt: 2 }}>
            <img src={url} alt="S3 Image" style={{ maxWidth: '100%', height: 'auto' }} />
          </Box>
        )}
      </Box>
    </Container>
  );
}

export default ImagePage;
