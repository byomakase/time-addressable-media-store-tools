import {
  SQSClient,
  ReceiveMessageCommand,
  DeleteMessageCommand,
  SendMessageCommand,
} from "@aws-sdk/client-sqs";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import ffmpeg from "fluent-ffmpeg";
import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import { PassThrough } from "stream";

const REGION = process.env.AWS_REGION;

const s3Client = new S3Client({ region: REGION });
const sqsClient = new SQSClient({ region: REGION });
ffmpeg.setFfmpegPath(ffmpegPath);

const processMessage = async (message) => {
  console.log(message);
  return Promise.all(
    message.segments?.map(async (segment) => {
      const bucket = segment.get_urls
        .find((getUrl) => getUrl.label.includes(":s3:"))
        .url.match(/https:\/\/(?<bucket>.*)\.s3.*/).groups.bucket;
      const getObjectCommand = new GetObjectCommand({
        Bucket: bucket,
        Key: segment.object_id,
      });
      const getObjectCommandResponse = await s3Client.send(getObjectCommand);
      const passThrough = new PassThrough();
      const outputFile = crypto.randomUUID();
      const upload = new Upload({
        client: s3Client,
        params: {
          Bucket: message.outputBucket,
          Key: `${message.outputPrefix}${outputFile}`,
          Body: passThrough,
        },
      });
      ffmpeg(getObjectCommandResponse.Body)
        .outputOptions(message.ffmpeg.command)
        .outputFormat(message.ffmpeg.outputFormat)
        .pipe(passThrough, { end: true });
      await upload.done();
      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: process.env.INGEST_QUEUE_URL,
        MessageBody: JSON.stringify({
          flowId: message.destinationFlow,
          timerange: segment.timerange,
          uri: `s3://${message.outputBucket}/${message.outputPrefix}${outputFile}`,
          deleteSource: true,
        }),
      });
      await sqsClient.send(sendMessageCommand);
    })
  );
};

export const lambdaHandler = async (event, context) => {
  console.log(event);
  for (const message of event.Records) {
    await processMessage(JSON.parse(message.body));
  }
};

// Main method to be used for local/ECS execution mode.
export const main = async () => {
  const QueueUrl = process.env.FFMPEG_QUEUE_URL;
  const receiveMessageCommand = new ReceiveMessageCommand({
    QueueUrl,
    MaxNumberOfMessages: 1,
    WaitTimeSeconds: 10,
  });
  while (true) {
    const receiveMessageResponse = await sqsClient.send(receiveMessageCommand);
    receiveMessageResponse.Messages &&
      (await Promise.all(
        receiveMessageResponse.Messages?.map(async (message) => {
          await processMessage(JSON.parse(message.Body));
          const deleteMessageCommand = new DeleteMessageCommand({
            QueueUrl,
            ReceiptHandle: message.ReceiptHandle,
          });
          sqsClient.send(deleteMessageCommand);
        })
      ));
  }
};
