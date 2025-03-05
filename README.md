# Time-addressable Media Store Tools

This solution contains a Web UI and associated tools to be used to help adoption and understanding of the AWS implementation of the [BBC TAMS API](https://github.com/bbc/tams). AWS have created an open source sample implementation of that API [here](https://github.com/awslabs/time-addressable-media-store).  This solutions is designed to be used with that implementation.

**NOTE: This solution is not designed to be used in a Production environment. It is designed for dev use cases where a tools is required to help visualise the contents of a TAMS store.**

## Pre-requisites

This solution requires a running deployment of the [TAMS API](https://github.com/awslabs/time-addressable-media-store).

To build and run the Web UI frontend you will also need:

- npm
- node

## Deploy the required infrastructure

The Serverless Application Model Command Line Interface (SAM CLI) is an extension of the AWS CLI that adds functionality for building and testing Lambda applications. It uses Docker to run your functions in an Amazon Linux environment that matches Lambda. It can also emulate your application's build environment and API.

To use the SAM CLI, you need the following tools.

- SAM CLI - [Install the SAM CLI](https://docs.aws.amazon.com/serverless-application-model/latest/developerguide/serverless-sam-cli-install.html)
- Docker - [Install Docker community edition](https://hub.docker.com/search/?type=edition&offering=community)

To build and deploy the infrastructure for the first time, run the following in your shell:

```bash
cd backend
sam build --use-container
sam deploy --guided
```

The first command will build the source of your application. The second command will package and deploy your application to AWS, with a series of prompts:

- **Stack Name**: The name of the stack to deploy to CloudFormation. This should be unique to your account and region, and a good starting point would be something matching your project name.
- **AWS Region**: The AWS region you want to deploy your app to.
- **ApiStackName**: Supply the name of the CloudFormation stack used to the deploy the TAMS API.
- **DeployHlsApi**: Defines whether to deploy the HLS component. **Leave the default value of `No`.**
- **DeployIngestMediaLive**: Defines whether to deploy the MediaLive component. **Leave the default value of `No`.**
- **DeployIngestMediaConvert**: Defines whether to deploy the MediaConvert component. **Leave the default value of `No`.**
- **Confirm changes before deploy**: If set to yes, any change sets will be shown to you before execution for manual review. If set to no, the AWS SAM CLI will automatically deploy application changes.
- **Allow SAM CLI IAM role creation**: Many AWS SAM templates, including this example, create AWS IAM roles required for the AWS Lambda function(s) included to access AWS services. By default, these are scoped down to minimum required permissions. To deploy an AWS CloudFormation stack which creates or modifies IAM roles, the `CAPABILITY_IAM` value for `capabilities` must be provided. If permission isn't provided through this prompt, to deploy this example you must explicitly pass `--capabilities CAPABILITY_IAM` to the `sam deploy` command.
- **Save arguments to samconfig.toml**: If set to yes, your choices will be saved to a configuration file inside the project, so that in the future you can just re-run `sam deploy` without parameters to deploy changes to your application.

The deployment will only take a short time as with all the components set to No there is no Infrastructure to deploy.

## Configure and build the Web Ui frontend

```bash
cd ../frontend
npm ci
cp .env.template .env.local
```

Open the newly created `env.local` file in your preferred text editor and set the values for the non-commented out variables, leave the commented out lines for now. All the values for the variables specified in this file are provided as Outputs on the Cloudformation stack that resulted from the deployment of the infrastructure.

- VITE_APP_AWS_REGION
- VITE_APP_AWS_USER_POOL_ID
- VITE_APP_AWS_USER_POOL_CLIENT_WEB_ID
- VITE_APP_AWS_IDENTITY_POOL_ID
- VITE_APP_AWS_API_ENDPOINT

Once you have set these values save the changes to the file. You now have 2 choicess:

### Run the web app locally in dev mode

To do this run the following command:

```bash
npm run dev
```

### Build and deploy the web app to a web server

To do this run the following command:

```bash
npm run build
```

Then take the contents of the `dist` subfolder and place this on the web server of your choosing.

## Usage

In the initial state the Web App will just have a simple interface that allows you to browse and view the basic data held in your TAMS store. 4 optional components can be deployed to the infrastructure to add functionality to this solution. The deployment of these components is expected to be done from the AWS Cloudformation Console. Changes should therefore be made by updating the stack parameters for the CloudFormation Stack created for the infrastructure.

**NOTE: The Web UI is authenticated using the same Cognito User Pool used by the TAMS API. To login you will first need to create a user in Cognito.**

### HLS API

To deploy this component perform an update on the Cloudformation Stack and change the value of `Deploy HLS Endpoint?` to Yes.

Once the update is complete. Review the Outputs section of the Stack and copy the value of the `HLSEndpoint`. Edit the `env.local` file to uncomment the appropriate line and set its value and save the changes to the file. If you are running locally in Dev mode the change will be picked up automatically. If you build and deployed the App to a web server you will need to perform the build and deploy steps again.

### MediaLive Ingest

To deploy this component perform an update on the Cloudformation Stack and change the value of `Deploy MediaLive Channel ingest?` to Yes.

Once the update is complete. Review the Outputs section of the Stack and copy the values of `MediaLiveEndpoint`, `MediaLiveStartArn` and `MediaLiveStopArn`. Edit the `env.local` file to uncomment the appropriate lines and set their values and save the changes to the file. If you are running locally in Dev mode the change will be picked up automatically. If you build and deployed the App to a web server you will need to perform the build and deploy steps again.

### MediaConvert Ingest

To deploy this component perform an update on the Cloudformation Stack and change the value of `Deploy MediaConvert Job ingest?` to Yes.

Once the update is complete. Review the Outputs section of the Stack and copy the value of the `MediaConvertEndpoint`. Edit the `env.local` file to uncomment the appropriate line and set its value and save the changes to the file. If you are running locally in Dev mode the change will be picked up automatically. If you build and deployed the App to a web server you will need to perform the build and deploy steps again.

## Cleanup

To delete the solution, use the SAM CLI, you can run the following:

```bash
sam delete
```

## Security

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This library is licensed under the MIT-0 License. See the LICENSE file.
