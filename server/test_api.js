
const apiKey = '20a49c2208mshbc177e9b7509ca0p132e46jsn448eea7feff5';
const apiHost = 'sky-scrapper.p.rapidapi.com';
const url = 'https://' + apiHost + '/api/v2/flights/searchFlights?originSkyId=DEL&destinationSkyId=SXR&date=2026-06-15&adults=1&cabinClass=economy&currency=INR&market=en-US&countryCode=IN';
fetch(url, { headers: { 'X-RapidAPI-Key': apiKey, 'X-RapidAPI-Host': apiHost } })
  .then(res => res.json())
  .then(data => console.log(JSON.stringify(data).substring(0, 500)))
  .catch(console.error);

