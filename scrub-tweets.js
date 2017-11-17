const AZURE_API =
  'https://westcentralus.api.cognitive.microsoft.com/text/analytics/v2.0/sentiment';
const KEY = '3178f60ca25c45289882f96082f1214b';

// TODO: Ask Azure sentiment analysis if this is a mean tweet
async function askAzure(tweets) {
  let result = await fetch(AZURE_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Ocp-Apim-Subscription-Key': KEY
    },
    body: JSON.stringify(tweets)
  });

  let json = await result.json();

  console.log(json);

  return json;
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

const observer = new MutationObserver(mutations => {
  let nodes = Array.from(mutations[0].addedNodes);
  let newTweets = mapNodes(nodes);

  askAzure(newTweets);
});

const config = { childList: true, attributes: true };

if (target != null) {
  observer.observe(target, config);
}
