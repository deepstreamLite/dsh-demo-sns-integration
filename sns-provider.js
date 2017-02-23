const http = require('http')
const deepstream = require('deepstream.io-client-js')
const AWS = require('aws-sdk')
AWS.config.update({
  "secretAccessKey": "...",
  "sessionToken": "...",
  "accessKeyId": "...",
  "region": "eu-central-1"
})

const sns = new AWS.SNS()
const client = deepstream('<Your app URL>')
client.login()

const server = new http.Server()
server.on('request', (request, response) => {
  request.setEncoding( 'utf8' )

  //concatenate POST data
  var msgBody = ''
  request.on('data', (data) => {
    msgBody += data
  })
  request.on( 'end', function(){
    var msgData = JSON.parse(msgBody)
    var msgType = request.headers['x-amz-sns-message-type']
    handleIncomingMessage(msgType, msgData)
  })

  // SNS doesn't care about our response as long as it comes
  // with a HTTP statuscode of 200
  response.end('OK')
})

const handleIncomingMessage = (msgType, msgData) => {
  if(msgType === 'SubscriptionConfirmation') {
    //confirm the subscription.
    sns.confirmSubscription({
      Token: msgData.Token,
      TopicArn: msgData.TopicArn
    }, (err, data) => console.log(err || data))
  } else if (msgType === 'Notification') {
    client.event.emit(msgData.Subject, msgData.Message)
  } else {
    console.log('Unexpected message type ' + msgType)
  }
}

const subscribeToSnS = () => {
  sns.subscribe({
    Protocol: 'http',
    //You don't just subscribe to "news", but the whole Amazon Resource Name (ARN)
    TopicArn: 'arn:aws:sns:eu-central-1:277026727916:news',
    Endpoint: 'http://your-endpoint-url.com'
  }, (error, data) => {
    console.log(error || data)
  })
}

server.listen(3000, subscribeToSnS)
