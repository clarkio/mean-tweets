const AZURE_API = 'https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0';
const AZURE_SENTIMENTS_API = AZURE_API + '/sentiment';
const AZURE_KEY_PHRASES_API = AZURE_API + '/keyPhrases';
const KEY = '3178f60ca25c45289882f96082f1214b';
const NEGATIVE_SENTIMENT_THRESHOLD = 0.2;

// TODO: Ask Azure sentiment analysis if this is a mean tweet
async function askAzureForSentiments(tweets) {
  let result = await fetch(AZURE_SENTIMENTS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': KEY
    },
    body: JSON.stringify(tweets)
  });

  return result.json();
}

async function askAzureForKeyPhrases(tweets) {
  let result = await fetch(AZURE_KEY_PHRASES_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': KEY
    },
    body: JSON.stringify(tweets)
  });

  return result.json();
}

function mapNode(node) {
  return {
    language: 'en',
    id: node.getAttribute('data-item-id'),
    text: node.querySelectorAll('.tweet-text')[0].innerText
  };
}

function mapNodes(nodes) {
  let mappedNodes = [];
  nodes.forEach(node => {
    mappedNodes.push(mapNode(node));
  });

  return { documents: mappedNodes };
}

// Twitter only includes 4 tweets in the HTML on the initial response.
// let initialTweets = mapNodes(document.querySelectorAll('.stream-item'));

// askAzure(initialTweets);

// There are an additional 28 tweets that are inlined in the JavaScript and
// are loaded after page load. More tweets are loaded as the page is scrolled.
// This observer will fire each time a tweet is added after the page load.
let target = document.getElementById('stream-items-id');

const observer = new MutationObserver(async mutations => {
  let nodes = Array.from(mutations[0].addedNodes);
  if (!nodes) {
    console.log('found no new nodes');
    return;
  }
  let newTweets = mapNodes(nodes);

  // Get tweets with sentiment below threshold
  let sentiments = await askAzureForSentiments(newTweets);
  let negativeSentiments = sentiments.documents.filter((elem, index, arr) => {
    return elem.score < NEGATIVE_SENTIMENT_THRESHOLD;
  });

  // Find negative tweets based on azure results
  let negativeTweets = newTweets.documents.filter((elem, index, arr) => {
    return negativeSentiments.some(item => {
      return item.id === elem.id;
    });
  });

  // Get key phrases for negative tweets
  let keyPhrases = await askAzureForKeyPhrases({ documents: negativeTweets });
  let mappedNegativeTweets = negativeTweets.map(elem => {
    let sentimentTweet = negativeSentiments.find(item => item.id === elem.id);
    let keyPhraseTweet = keyPhrases.documents.find(item => item.id === elem.id);
    elem.score = sentimentTweet.score;
    elem.keyPhrases = keyPhraseTweet.keyPhrases;
    return elem;
  });

  console.log(mappedNegativeTweets);

  // Change style of negative tweets on screen
  mappedNegativeTweets.forEach(tweet => {
    let tweetNode = document.querySelector("[data-item-id='" + tweet.id + "']");
    tweetNode.style.background = 'red';
  });
});

const config = { childList: true, attributes: true };

if (target != null) {
  observer.observe(target, config);
}
