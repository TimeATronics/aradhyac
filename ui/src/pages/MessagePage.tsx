// @ts-ignore
import { useSelector, useDispatch } from 'react-redux';
import { Button, TextField, Typography, Container, Box } from '@mui/material';
import { fetchMessageRequest } from '../store/actions/messageActions';
import type { RootState, AppDispatch } from '../store';

function MessagePage() {
  const dispatch = useDispatch<AppDispatch>();
  const { message, loading, error } = useSelector((state: RootState) => state.message);

  const handleFetchMessage = () => {
    dispatch(fetchMessageRequest());
  };

  const appTitle = import.meta.env.VITE_APP_TITLE || "Default Title";

  return (
    <Container maxWidth="sm">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" component="h1" gutterBottom>
          {appTitle}
        </Typography>
        <Typography variant="h5" component="h2" gutterBottom>
          Message from MariaDB
        </Typography>
        <TextField
          label="Message"
          multiline
          rows={4}
          value={message}
          fullWidth
          margin="normal"
          variant="outlined"
          InputProps={{
            readOnly: true,
          }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={handleFetchMessage}
          disabled={loading}
          sx={{ mt: 2 }}
        >
          {loading ? 'Loading...' : 'Fetch Message'}
        </Button>
        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            Error: {error}
          </Typography>
        )}
      </Box>
    </Container>
  );
}

export default MessagePage;
