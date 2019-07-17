const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const express = require('express')
const next = require('next')
const OAuth2Strategy = require('passport-oauth2');
const passport = require('passport');
const session = require('express-session');
const axios = require('axios').default;

const dev = process.env.NODE_ENV !== 'production'

const baseURL = `https://gloapi.gitkraken.com/v1/glo`

if (dev){
  require('dotenv').config()
}
const app = next({ dev })
const handle = app.getRequestHandler()

const users = {};

const strategy = new OAuth2Strategy({
  authorizationURL: process.env.AUTHORIZATION_URL,
  tokenURL: process.env.TOKEN_URL,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  callbackURL: process.env.CALLBACK_URL,
  scope: 'board:read board:write'
}, function(accessToken, refreshToken, profile, cb) {
  if (!users[accessToken]){
    users[accessToken] = accessToken
  }
  cb(null, accessToken);
});

passport.serializeUser(function (accessToken, done) {
  done(null, accessToken);
});

passport.deserializeUser(function (accessToken, done) {
  done(null, accessToken);
});

app.prepare()
.then(() => {
  const server = express()

  server.use(bodyParser.json());
  server.use(cookieParser());

  server.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {}
  }));

  passport.use(strategy);
  server.use(passport.initialize());
  server.use(passport.session());
  
  server.get('/auth/login', passport.authenticate('oauth2'));

  server.get('/auth/callback', (req, res, next) => {
    next();
  }, passport.authenticate('oauth2', { failureRedirect: '/auth/login', successRedirect: '/' }),
    function(req, res) {
      res.redirect('/');
    });
  
  server.get('/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err){
        console.error("Failed to destroy session", err);
      }
      req.logOut();
      res.clearCookie('user_sid');
      res.redirect('/');
    });
  });

  server.get('/api/boards', async (req, res, next) => {
    if (!req.user){
      res.sendStatus(401);
      return;
    }
    const glo = axios.create({
        baseURL,
        headers: {
            Authorization: `Bearer ${req.user}`
        }
    });
    
    let has_more = true;
    let boards = [];
    let page = 1;
    while (has_more){
        const response = await glo.get(`/boards?page=${page}&per_page=1000&fields=archived_columns%2Carchived_date%2Ccolumns%2Ccreated_by%2Ccreated_date%2Cinvited_members%2Clabels%2Cmembers%2Cname`)
            .catch(error => {
                console.error(error);
            })
        has_more = response.headers['has-more'] === 'true';
        boards = boards.concat(response.data);
        page++;
    }
    res.send(boards);
  });

  server.post('/api/boards/:id/copy', async (req, res, next) => {
    if (!req.user){
      res.sendStatus(401);
      return;
    }
    const glo = axios.create({
        baseURL,
        headers: {
            Authorization: `Bearer ${req.user}`
        }
    });

    const response = await glo.get(`/boards/${req.params.id}?fields=archived_columns%2Carchived_date%2Ccolumns%2Ccreated_by%2Ccreated_date%2Cinvited_members%2Clabels%2Cmembers%2Cname`)
        .catch(error => {
            console.error(error);
        });
    const oldBoard = response.data;


    let all_cards = [];
    for (let column of oldBoard.columns){
        let has_more = true;
        let page = 1;
        while (has_more) {
            const cards_response = await glo.get(`/boards/${req.params.id}/columns/${column.id}/cards?page=${page}&per_page=1000&fields=archived_date%2Cassignees%2Cattachment_count%2Cboard_id%2Ccolumn_id%2Ccomment_count%2Ccompleted_task_count%2Ccreated_by%2Ccreated_date%2Cdue_date%2Cdescription%2Clabels%2Cname%2Ctotal_task_count%2Cupdated_date`);
            has_more = cards_response.headers['has-more'] === 'true';
            all_cards = all_cards.concat(cards_response.data);
            page++;
        }
    }
    console.log("length", all_cards.length);

    // Create board w/name
    const {data: board} = await glo.post(`/boards`, {
        name: `${oldBoard.name} - Copy`
    });


    const labelMap = {};
    const columnMap = {};

    const labelPromises = []
    for (const label of oldBoard.labels){
        labelPromises.push(glo.post(`/boards/${board.id}/labels`, {
            name: label.name,
            color: label.color
        }).then(response => {
            labelMap[label.id] = response.data.id;
            return response;
        }));
    }
    await Promise.all(labelPromises);
    // Create columns
    for (const column of oldBoard.columns.sort((a, b) => a.position - b.position)){
        await glo.post(`/boards/${board.id}/columns`, {
            name: column.name
        }).then(response => {
            columnMap[column.id] = response.data.id;
            return response;
        });
    }

    // Create cards

    const cardBatchPromises = [];
    const batches = Math.ceil(all_cards.length / 100);
    const rev = all_cards.reverse();
    for (let i = 0; i < batches; i++){
        const cardBatch = rev.slice(i * 100, (i * 100)+100);
        const mappedCardBatch = cardBatch.map(card => ({
            ...card,
            labels: card.labels.map(l => ({
                id: labelMap[l.id]
            })),
            column_id: columnMap[card.column_id],
            id: undefined,
            position: 0,
            assignees: undefined
        }));


        cardBatchPromises.push(glo.post(`/boards/${board.id}/cards/batch`, {
            cards: mappedCardBatch
        }));
    }

    await Promise.all(cardBatchPromises);

    res.send({
      id: board.id
    });
  });

  server.get('*', (req, res) => {
    return handle(req, res)
  })

  server.use((err, req, res, next) => {
    console.log("ERROR", err);
    next(err);
  })
    
  server.listen(8080, (err) => {
    if (err) throw err
    console.log('> Ready on http://localhost:8080')
  })
})
.catch((ex) => {
  console.error(ex.stack)
  process.exit(1)
})
