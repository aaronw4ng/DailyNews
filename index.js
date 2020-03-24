//Similar to include statements
//Var: detecting variable
//Let: Let this be a variable for(let i = 0;)
//Const: Constant variables
require("dotenv").config();
var axios = require("axios");
var cheerio = require("cheerio");
var express = require("express");

//Constant gif API URL
const giphyURL =
  "https://api.giphy.com/v1/gifs/random?api_key=FcOuFsdxtb7cE0iatNEjFMQw1r4NmvHc&tag=animals&rating=pg-13";

//Function to automatically format Slack text to its API standards
const getBlock = text => ({
  type: "section",
  text: {
    type: "mrkdwn",
    text: text
  }
});

//Function to send random gifs
const getGif = gif => ({
  type: "image",
  image_url: gif,
  alt_text: "Random Gif"
});

//Async indicates promise function
const getNews = async () => {
  console.log("Grabbing the top five news of the day");
  //new variable waiting for a promise through "await", using axios.get to fetch the website
  const response = await axios.get("http://theweek.com/5things");
  console.log("got news, prepared to send to slack");
  const $ = cheerio.load(response.data);
  const newsItemsHTML = $(".five-things-item");

  const newsItem = [];

  console.log("Retrieving gif from giphy");
  const gifData = await axios.get(giphyURL);
  const gifID = gifData.data.data.id;
  console.log(gifID);
  const gifURL = "https://media.giphy.com/media/" + gifID + "/giphy.gif";
  console.log(gifURL);

  //if(dailyUpdate)
  newsItem.push(
    getBlock(
      "Good afternoon Alpha Zeta! 🌤 Here's some daily news to keep you informed during the COVID pandemic!"
    ),
    getGif(gifURL)
  );

  for (let i = 0; i < 5; i++) {
    const headline = $(newsItemsHTML[i])
      .find(".five-things-headline > a > p")
      .text();
    const description = $(newsItemsHTML[i])
      .find(".five-things-text > p")
      .text();

    //${}allows you to insert content within a string, use ``to indicate that it's a string
    newsItem.push(getBlock(`*${i + 1}. ${headline}*`));
    newsItem.push(getBlock(description));
  }
  //* is slackbot documentation for BOLD
  console.log("about to spam");
  return newsItem;
};

console.log("setting interval...");
setInterval(async () => {
  const news = await getNews().catch(e =>
    console.log("Error trying to get the news:", e)
  );
  axios
    .post(process.env.SLACK_WEBHOOK, {
      //notifications
      text: "Daily News Update! 📰",
      blocks: news
    })
    .then(() => console.log("Suceessfully posted news to"))
    .catch(e => console.log("Error sending news to Slack wehook:", e));
}, 86400000);

//Express server
const server = express();
//The port is assigned to 5000, port is encrypted
const port = process.env.PORT || 5000;
//Set the port of the server to the port
server.set("port", port);
//To work with the server
server
  //Another get request, so when the server is asked for /news,
  //Create new variable 'news' that will
  .get("/news", async (req, res) => {
    const news = await getNews();
    res.json(news);
  })
  //Get request, when the server 'gets' '/', server will respond "App is running"
  //Get request is function with 2 parameters, what you are 'getting', and the function
  .get("/", function(request, response) {
    var result = "App is running";
    response.send(result);
  })
  //Listen request, to indicate that the server is listening
  .listen(server.get("port"), function() {
    console.log(
      "App is running, server is listening on port ",
      server.get("port")
    );
  });
