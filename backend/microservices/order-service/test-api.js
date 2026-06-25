const http = require('http');

http.get('http://localhost:3004/api/bookings', {
  headers: { 'x-user-role': 'admin' }
}, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    try {
      const parsed = JSON.parse(data);
      console.log(JSON.stringify(parsed[0], null, 2));
    } catch(e) { console.log(data); }
  });
});
