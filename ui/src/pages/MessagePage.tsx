// @ts-ignore
import { Typography, Box, Container } from '@mui/material';

function ProjectsPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ textAlign: 'center', mt: 8 }}>
        <Typography variant="h4" gutterBottom>Projects</Typography>
        <Typography variant="h6" color="text.secondary">
          Coming Soon...
        </Typography>
        <Box sx={{ mt: 4 }}>
          {/* Add a nice graphic here, e.g., an image or icon */}
          <Typography variant="body1">Exciting projects are on the way!</Typography>
        </Box>
      </Box>
    </Container>
  );
}

export default ProjectsPage;
