const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const jsdom = require("jsdom");
const axios = require('axios');
const app = express();

let PORT = process.env.PORT || 4000;

app.use(cors());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

// parse application/json
app.use(bodyParser.json());


app.get("/", async (req, res)=>{
    const instance = axios.create();

    // Access the provided 'page' and 'limt' query parameters
    const year = req.query.year;
    const quarter = req.query.quarter;
    const lesson = req.query.lesson;
    const day = "01";

    if(year === undefined || quarter === undefined || lesson === undefined){
        res.send("Sorry could not load lesson guide");
    }else{
        
        try{
            
            
            //send initial url request e.g `https://sabbath-school-stage.adventech.io/en/2021-02-er/07/01`
            const requestUrl = await instance.get(`https://sabbath-school-stage.adventech.io/en/${year}-0${quarter}-er/${lesson}/${day}`).catch((error)=>console.log(error));
            const url = new jsdom.JSDOM(requestUrl.data).window.document.querySelector("head").textContent;

            //send page request
            const requestLessonPage = await instance.get(url).catch((error)=>console.log(error));
            const dom = new jsdom.JSDOM(requestLessonPage.data);

            //lesson title
            const title = dom.window.document.querySelector('h1').textContent;

            //memory verse
            const blockquote = dom.window.document.querySelector('blockquote');
            blockquote.removeChild(blockquote.querySelector('p'));
            const memoryVerse = blockquote.textContent.replace("\n", "").replace("\n", "");

            //get paragraph tags
            const list = dom.window.document.getElementsByTagName('p');
            const usableList = [];
            

            //collect useful information
            for(const item of list){ 
                if(item.className === "" && item.textContent !== "Memory Text"){
                    usableList.push(item.textContent);
                } 
            }

            //remove the first element from array and collection it as leading verses
            const verses = usableList.shift();


            //create sabbath school lesson object
            const sabbathLesson = {
                title:title, 
                memoryVerse:memoryVerse,
                verses:verses,
                description: usableList,
            };

            res.send(sabbathLesson);
        }catch(ex){
            console.log(ex.message);
            res.send("Sorry could not load lesson guide");
        }
    }
});

app.listen(PORT, ()=>{
    console.log(`Listening on port ${PORT}`);
});