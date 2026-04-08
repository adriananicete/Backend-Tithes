import http from 'http'
import fs from 'fs'

const options = {
  hostname: 'localhost',
  port: 7001,
  // path: '/api/reports/expense/export/excel',
  path: '/api/reports/expense/export/pdf',
  method: 'GET',
  headers: {
    'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5YmZjZmEwN2ZhZWQ2MTkzMzE4Yzc0YiIsInJvbGUiOiJhZG1pbiIsImlhdCI6MTc3NTYzMjg2NiwiZXhwIjoxNzc1NzE5MjY2fQ.Apr4_EzDmtR5A4z1JLaPCpA_Ko6a6gCAs-PgNb2Ll9U'
  }
}

// const file = fs.createWriteStream('expense-report.xlsx');
const file = fs.createWriteStream('expense-report.pdf');

http.request(options, (res) => {
  console.log('Status:', res.statusCode)
  res.pipe(file)
  file.on('finish', () => {
    file.close()
    console.log('Downloaded: expense-report.pdf')
  })
}).on('error', (err) => {
  console.error('Error:', err)
}).end()