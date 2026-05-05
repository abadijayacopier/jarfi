const http = require('http');

http.get('http://localhost:3000/api/mikrotik/traffic?router_id=6', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => {
    const json = JSON.parse(data);
    console.log('Total entries:', json.traffic?.length);
    console.log('Sample entries:', json.traffic?.slice(0, 3));
    const activeWithSpeed = json.traffic?.filter(t => t.rxSpeed > 0 || t.txSpeed > 0);
    console.log('Active with speed:', activeWithSpeed?.length);
    if (activeWithSpeed?.length > 0) {
        console.log('Sample active with speed:', activeWithSpeed[0]);
    }
  });
}).on('error', (err) => {
  console.error('Error:', err.message);
});
