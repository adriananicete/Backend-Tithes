import http from 'http'
import fs from 'fs'

const options = {
  hostname: 'localhost',
  port: 7001,
  // path: '/api/reports/tithes/export/excel',
  path: '/api/reports/tithes/export/pdf',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YmZjZmEwN2ZhZWQ2MTkzMzE4Yzc0YiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTU2NzE5NCwiZXhwIjoxNzc1NjUzNTk0fQ.3VkaYLcBZVz62_h-FklRibZfjbXZ1aUXJ9i9VUt8u38'
  }
}

// const file = fs.createWriteStream('tithes-report.xlsx');
const file = fs.createWriteStream('tithes-report.pdf');

http.request(options, (res) => {
  res.pipe(file)
  file.on('finish', () => {
    file.close()
    console.log('Downloaded: tithes-report.xlsx')
  })
}).end()