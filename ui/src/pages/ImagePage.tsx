// @ts-ignore
import { Typography, Box, Container, Grid, Card, CardContent } from '@mui/material';

function AboutPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>Hi there! I am Aradhya.</Typography>
        <Typography variant="body1" sx={{ mb: 4 }}>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
        </Typography>
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Skill 1</Typography>
                <Typography variant="body2">Lorem ipsum dolor sit amet, consectetur adipiscing elit.</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Skill 2</Typography>
                <Typography variant="body2">Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Skill 3</Typography>
                <Typography variant="body2">Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Experience</Typography>
                <Typography variant="body2">Nisi ut aliquip ex ea commodo consequat.</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Hobbies</Typography>
                <Typography variant="body2">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore.</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Contact</Typography>
                <Typography variant="body2">Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}

export default AboutPage;
