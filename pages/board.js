import Router, { withRouter } from 'next/router';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default withRouter((props) => {

  const [loading, setLoading] = useState(true);
  const [id, setId] = useState('');
  
  const fetchBoard = async () => {
    axios.post(`/api/boards/${props.router.query.id}/copy`, {
      withCredentials: true
    }).then(result => {
      setLoading(false);
      console.log(result.data);
      setId(result.data.id);
    }).catch(err => {
      Router.push('/auth/login');
    })
  }

  useEffect(() => {
    fetchBoard()
  }, []);

  return (
    <div>
      {
          loading ? 
            <div>
                <p>Copying in progress</p>
            </div> : 
            <div>
                <h1>Done!</h1>
                <a href={`https://app.gitkraken.com/glo/board/${id}`}>Go to your new board</a>
            </div>
        }
    </div>
  )
});
