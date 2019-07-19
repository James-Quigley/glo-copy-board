import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Router from 'next/router';
import Container from '@material-ui/core/Container';
import CssBaseline from '@material-ui/core/CssBaseline';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from '@material-ui/core/styles';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import Button from '@material-ui/core/Button';
import Paper from '@material-ui/core/Paper';


const useStyles = makeStyles(theme => ({
  paper: {
    // margin: '20px',
    marginTop: theme.spacing(8),
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  form: {
    width: '100%', // Fix IE 11 issue.
    marginTop: theme.spacing(1),
  },
  submit: {
    margin: theme.spacing(3, 0, 2),
  },
}));

const Index = () => {
  const [boards, setBoards] = useState([]);
  const [selectedBoard, setSelectedBoard] = useState();
  
  const fetchBoards = async () => {
    axios.get('/api/boards', {
      withCredentials: true
    }).then(result => {
      setBoards(result.data);
      setSelectedBoard(result.data[0].id);
    }).catch(err => {
      Router.push('/auth/login');
    });
  }

  useEffect(() => {
    fetchBoards()
  }, []);

  const classes = useStyles();

  return (
    <Container component="main" maxWidth="xs">
      <CssBaseline />
      <Paper style={{
        // padding: '0px'
      }}>
        {/* <div className={classes.paper}> */}
          <Typography component="h1" variant="h5">
            Copy Glo Board
          </Typography>
          <Typography component="h2" variant="h6">
          Select a board and we'll duplicate it!
          </Typography>
          <form className={classes.form} noValidate>
            {
              !boards.length ? <p>Loading...</p> :
              <Select
                fullWidth 
                onChange={(e) => {
                  setSelectedBoard(e.target.value);
                }}
                value={selectedBoard}>
                {
                  boards.map(board => 
                    <MenuItem key={board.id} value={board.id} >
                      {board.name}
                    </MenuItem>)
                }
              </Select>
            }
            <div>
              {
                selectedBoard
                  ? <Link href={'/board?id=' + selectedBoard}>
                      <Button color="secondary" className={classes.submit} type="submit" fullWidth>Duplicate!</Button>
                    </Link>
                  : null
              }
            </div>
          </form>
        {/* </div> */}
      </Paper>
    </Container>
)}

export default Index;
