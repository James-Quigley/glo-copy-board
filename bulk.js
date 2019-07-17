const axios = require('axios').default
const LoremIpsum = require('lorem-ipsum').LoremIpsum;

const glo = axios.create({baseURL: 'https://gloapi.gitkraken.com/v1/glo', headers: { Authorization: 'Bearer 5a29d1f504ba4117e5e1313ade0818b1824437aa'}})

// const board_id = '5d2f1aba98d023000f8d896c';

// const column_ids = [
//     '5d2f1ac313853d0011aacb40',
//     '5d2f1ac64e1d32000f87f5dc',
//     '5d2f1ac998d023000f8d896e',
//     '5d2f1acc4e1d32000f87f5e1',
//     '5d2f1acf538eed00115682c3'
// ]

// const label_ids = [
//     '5d2f1ad898d023000f8d8977',
//     '5d2f1add538eed00115682c4',
//     '5d2f1ae213853d0011aacb48',
//     '5d2f1ae74e1d32000f87f5e7',
//     '5d2f1aeb13853d0011aacb49',
//     '5d2f1af0538eed00115682c9'
// ]

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min; //The maximum is exclusive and the minimum is inclusive
}



function getRandomText() {
    const lorem = new LoremIpsum({
        sentencesPerParagraph: {
            max: 10,
            min: 1
        },
        wordsPerSentence: {
            max: 20,
            min: 5
        }
    });

    return lorem.generateParagraphs(1);
}

function randomTitle() {
    return new LoremIpsum({
        wordsPerSentence: {
            max: 6,
            min: 1
        }
    }).generateSentences(1);
}

function randomDueDate() {
    return `2019-${getRandomInt(6, 13)}-${getRandomInt(1, 31)}`
}

const createBoard = async () => {
    const { id } = (await glo.post(`/boards`, {
        name: 'Big Boi'
    })).data;
    return id;
}

const createColumns = async (board_id) => {
    const column_ids = [];
    for (let i = 0; i < 5; i++) {
        const {id} = (await glo.post(`/boards/${board_id}/columns`, {
            name: new LoremIpsum().generateWords(1)
        })).data;
        column_ids.push(id);
    }
    return column_ids;
}

const createLabels = async(board_id) => {
    const label_ids = [];
    for (let i = 0; i < 6; i++){
        const {id} = (await glo.post(`/boards/${board_id}/labels`, {
            name: new LoremIpsum().generateWords(1),
            color: {
                r: getRandomInt(0, 255),
                g: getRandomInt(0, 255),
                b: getRandomInt(0, 255)
            }
        })).data;
        label_ids.push(id);
    }
    return label_ids;
}

async function createBigBoi() {
    const board_id = await createBoard();
    const column_ids = await createColumns(board_id);
    const label_ids = await createLabels(board_id);
    console.log("TCL: createBigBoi -> label_ids", label_ids)

    const chooseNLabels = (n) => {
        let label_pool = label_ids.slice();
        const selected = [];
        for (i = 0; i < n; i++){
            const idx = getRandomInt(0, label_pool.length);
            selected.push(label_pool.splice(idx, 1));
        }
        return selected;
    }
    
    function getRandomLabels() {
        return chooseNLabels(getRandomInt(0, 4));
    }

    const cards = [];
    for (const column of column_ids) {
        const num_cards = getRandomInt(300, 800);
        // const num_cards = getRandomInt(3, 8);
        for (let i = 0; i < num_cards; i++) {
            const labels = getRandomLabels();
            // console.log(labels);
            const description = getRandomText();
            const name = randomTitle();
            const has_due_date = Math.random() > .5;

            cards.push({
                name,
                description: {
                    text: description
                },
                labels: labels.length ? labels.map(l => ({ id: l})) : undefined,
                due_date: has_due_date ? randomDueDate() : undefined,
                column_id: column
            });
        }
    }

    const batches = cards.length / 100;
    for (let i = 0; i < batches; i++) {
        glo.post(`/boards/${board_id}/cards/batch`, {
            cards: cards.slice(i * 100, (i*100) + 100)
        })
        .then(() => {})
        .catch(console.error);
    }
}

createBigBoi()
