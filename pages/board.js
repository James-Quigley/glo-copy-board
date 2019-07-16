import Router, { withRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default withRouter((props) => {

  const [loading, setLoading] = useState(true);
  
  const fetchBoard = async () => {
    axios.post(`/api/boards/${props.router.query.id}/copy`, {
      withCredentials: true
    }).then(result => {
      setLoading(false)
    }).catch(err => {
      Router.push('/auth/login');
    })
  }

  useEffect(() => {
    fetchBoard()
  }, []);

  return (
    <div>
      {loading ? <p>Copying in progress</p> : <p>Done!</p>}
    </div>
  )
});
