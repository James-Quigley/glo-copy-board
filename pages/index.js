import { useState, useEffect } from 'react';
import axios from 'axios';
import Link from 'next/link';
import Router from 'next/router';
import Head from 'next/head';

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
  return (
  <div>
    <Head>
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta charSet="utf-8" />
    </Head>
    <style jsx global>{`
      body{margin:40px
        auto;max-width:650px;line-height:1.6;font-size:18px;color:#444;padding:0
        10px}h1,h2,h3{line-height:1.2}
    `}</style>
    <h1 style={
      {
        fontSize:'2.5rem'
      }
    }>Copy Glo Board</h1>
    <h2 style={
      {
        fontSize:'1.5rem'
      }
    }>Select a board and we'll duplicate it!</h2>
    {
      !boards.length ? <p>Loading...</p> :
      <select onChange={(e) => {
          setSelectedBoard(e.target.value);
      }}>
        {
          boards.map(board => 
            <option key={board.id} value={board.id} >
              {board.name}
            </option>)
        }
      </select>
    }
    <div style={{
      marginLeft: '20px',
      display: 'inline'
    }}>
      {
        selectedBoard ? <Link href={'/board?id=' + selectedBoard}><button>Duplicate!</button></Link> : null
      }
    </div>
  </div>
)}

export default Index;
