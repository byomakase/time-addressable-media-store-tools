import {
  AWS_ML_START_ARN,
  AWS_ML_STOP_ARN,
  AWS_REGION,
  PAGE_SIZE,
  STATUS_MAPPINGS,
} from "@/constants";
import {
  Badge,
  Box,
  Button,
  ButtonDropdown,
  Link as ExternalLink,
  FormField,
  Header,
  Input,
  Modal,
  Pagination,
  Popover,
  SpaceBetween,
  StatusIndicator,
  Table,
  TextContent,
  TextFilter,
} from "@cloudscape-design/components";
import { GetParametersCommand, SSMClient } from "@aws-sdk/client-ssm";
import {
  useChannelStart,
  useChannelStop,
  useChannels,
  useStateMachine,
} from "@/hooks/useChannels";

import { Link } from "react-router-dom";
import { fetchAuthSession } from "aws-amplify/auth";
import stringify from "json-stable-stringify";
import { useCollection } from "@cloudscape-design/collection-hooks";
import { useFlowStatusTag } from "@/hooks/useFlows";
import { useState } from "react";
import useStore from "@/stores/useStore";

const confirmationMessages = {
  "start-channel": "Are you sure you wish to START the Channel?",
  "stop-channel": "Are you sure you wish to STOP the Channel?",
  "stop-ingestion": "Are you sure you wish to STOP the Ingestion?",
  "start-ingestion": "Are you sure you wish to START an Ingestion?",
};

const MediaLiveIngestion = () => {
  const { execute, isRunning } = useStateMachine();
  const { start, isStarting } = useChannelStart();
  const { stop, isStopping } = useChannelStop();
  const { channels, isLoading } = useChannels();
  const { update } = useFlowStatusTag();
  const preferences = {
    pageSize: PAGE_SIZE,
    contentDisplay: [
      { id: "Id", visible: true },
      { id: "Name", visible: true },
      { id: "SourceId", visible: true },
      { id: "State", visible: true },
    ],
  };
  const { items, collectionProps, filterProps, paginationProps } =
    useCollection(isLoading ? [] : channels, {
      filtering: {
        empty: (
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <b>No channels</b>
          </Box>
        ),
        noMatch: (
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <b>No matches</b>
          </Box>
        ),
      },
      pagination: { pageSize: preferences.pageSize },
      sorting: {},
      selection: {},
    });
  const { selectedItems } = collectionProps;
  const addAlertItem = useStore((state) => state.addAlertItem);
  const delAlertItem = useStore((state) => state.delAlertItem);
  const [actionId, setActionId] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [label, setLabel] = useState("");
  const columnDefinitions = [
    {
      id: "Id",
      header: "Channel Id",
      cell: (item) => (
        <ExternalLink
          external
          href={`https://${AWS_REGION}.console.aws.amazon.com/medialive/home?region=${AWS_REGION}#/channels/${item.Id}/`}
        >
          {item.Id}
        </ExternalLink>
      ),
      sortingField: "Id",
      isRowHeader: true,
      minWidth: 140,
    },
    {
      id: "Name",
      header: "Channel Name",
      cell: (item) => item.Name,
      sortingField: "Name",
    },
    {
      id: "SourceId",
      header: "Source Id",
      cell: (item) =>
        item.Valid ? (
          item.SourceId ? (
            <Link to={`/sources/${item.SourceId}`}>{item.SourceId}</Link>
          ) : (
            <Badge>Ingestion not present</Badge>
          )
        ) : (
          <Popover
            dismissButton={false}
            position="top"
            size="small"
            triggerType="text"
            content={
              <TextContent>
                This channel is missing one or more of the following required
                criteria:
                <ul>
                  <li>
                    Must not use the underscore character in any of the S3
                    destination urls.
                  </li>
                  <li>
                    Must not use the same S3 destination path as any other
                    MediaLive Channel.
                  </li>
                  <li>
                    Must have EventBridge notifications enabled on the S3
                    destination Bucket.
                  </li>
                </ul>
              </TextContent>
            }
          >
            <Badge color="red">Channel not useable</Badge>
          </Popover>
        ),
      sortingField: "SourceId",
      isRowHeader: true,
      minWidth: 310,
    },
    {
      id: "State",
      header: "Channel State",
      cell: (item) => (
        <StatusIndicator type={STATUS_MAPPINGS[item.State]}>
          {item.State}
        </StatusIndicator>
      ),
      sortingField: "State",
      minWidth: 150,
    },
  ];

  const getFlowIds = async () => {
    const parameterNames = selectedItems[0].Destinations.map((dest) =>
      dest.split("/").slice(1).join("/")
    );
    const authSession = await fetchAuthSession();
    const ssmClient = new SSMClient({
      region: AWS_REGION,
      credentials: authSession.credentials,
    });
    const command = new GetParametersCommand({ Names: parameterNames });
    const ssmResponse = await ssmClient.send(command);
    return ssmResponse.Parameters.map((param) =>
      Object.values(JSON.parse(param.Value)).filter(
        (value) => typeof value === "string"
      )
    ).flat();
  };

  const tagFlows = async (status) => {
    const flowIds = await getFlowIds();
    const tagPromises = flowIds.map((flowId) => update({ flowId, status }));
    await Promise.all(tagPromises);
  };

  const handleOnClick = async ({ detail }) => {
    setActionId(detail.id);
    setModalVisible(true);
  };

  const performAction = async () => {
    if (actionId === "start-ingestion") {
      return startIngestion();
    }
    const id = selectedItems[0].Id;
    if (actionId.endsWith("-channel")) {
      if (actionId === "start-channel") {
        await start({ ChannelId: id });
        await tagFlows("ingesting");
      } else if (actionId === "stop-channel") {
        await stop({ ChannelId: id });
        await tagFlows("closed_complete");
      }
      setModalVisible(false);
      addAlertItem({
        type: "success",
        dismissible: true,
        dismissLabel: "Dismiss message",
        content: (
          <TextContent>
            The channel <b>{id}</b> is being{" "}
            {actionId === "start-channel" ? "started" : "stopped"}...
          </TextContent>
        ),
        id: id,
        onDismiss: () => delAlertItem(id),
      });
    } else if (actionId.endsWith("-ingestion")) {
      const id = crypto.randomUUID();
      const sfnResponse = await execute({
        stateMachineArn: AWS_ML_STOP_ARN,
        name: id,
        input: stringify({
          SourceId: selectedItems[0].SourceId,
          ChannelId: selectedItems[0].Id,
          Parameters: selectedItems[0].Output,
        }),
        traceHeader: id,
      });
      setModalVisible(false);
      addAlertItem({
        type: STATUS_MAPPINGS[sfnResponse.status],
        dismissible: true,
        dismissLabel: "Dismiss message",
        content:
          sfnResponse.status === "SUCCEEDED" ? (
            <TextContent>
              The ingestion <b>{id}</b> has been removed.
            </TextContent>
          ) : (
            <TextContent>
              An error occurred in the Step Function. Details can be found{" "}
              <ExternalLink
                external
                href={`https://${AWS_REGION}.console.aws.amazon.com/states/home?region=${AWS_REGION}#/express-executions/details/${
                  sfnResponse.executionArn
                }?startDate=${sfnResponse.startDate.valueOf()}`}
              >
                here
              </ExternalLink>
              .
            </TextContent>
          ),
        id: id,
        onDismiss: () => delAlertItem(id),
      });
    }
  };

  const startIngestion = async () => {
    const id = crypto.randomUUID();
    const sfnResponse = await execute({
      stateMachineArn: AWS_ML_START_ARN,
      name: id,
      input: stringify({
        Id: id,
        ChannelId: selectedItems[0].Id,
        Label: label,
      }),
      traceHeader: id,
    });
    setLabel("");
    setModalVisible(false);
    addAlertItem({
      type: STATUS_MAPPINGS[sfnResponse.status],
      dismissible: true,
      dismissLabel: "Dismiss message",
      content:
        sfnResponse.status === "SUCCEEDED" ? (
          <TextContent>
            A new ingestion <b>{id}</b> has been created.
          </TextContent>
        ) : (
          <TextContent>
            An error occurred in the Step Function. Details can be found{" "}
            <ExternalLink
              external
              href={`https://${AWS_REGION}.console.aws.amazon.com/states/home?region=${AWS_REGION}#/express-executions/details/${
                sfnResponse.executionArn
              }?startDate=${sfnResponse.startDate.valueOf()}`}
            >
              here
            </ExternalLink>
            .
          </TextContent>
        ),
      id: id,
      onDismiss: () => delAlertItem(id),
    });
  };

  return (
    <>
      <Table
        {...collectionProps}
        isItemDisabled={(item) =>
          !item.Valid || isRunning || isStarting || isStopping
        }
        variant="borderless"
        loadingText="Loading resources"
        loading={isLoading}
        trackBy="Id"
        selectionType="single"
        header={
          <Header
            actions={
              <ButtonDropdown
                onItemClick={handleOnClick}
                disabled={selectedItems.length !== 1}
                items={[
                  {
                    text: "Ingestion",
                    items: [
                      {
                        text: "Setup",
                        id: "start-ingestion",
                        disabled:
                          selectedItems.length > 0 && selectedItems[0].SourceId,
                      },
                      {
                        text: "Remove",
                        id: "stop-ingestion",
                        disabled: !(
                          selectedItems.length > 0 &&
                          selectedItems[0].SourceId &&
                          selectedItems[0].State === "IDLE"
                        ),
                      },
                    ],
                  },
                  {
                    text: "Channel",
                    items: [
                      {
                        text: "Start",
                        id: "start-channel",
                        disabled: !(
                          selectedItems.length > 0 &&
                          selectedItems[0].SourceId &&
                          selectedItems[0].State === "IDLE"
                        ),
                      },
                      {
                        text: "Stop",
                        id: "stop-channel",
                        disabled: !(
                          selectedItems.length > 0 &&
                          selectedItems[0].State === "RUNNING"
                        ),
                      },
                    ],
                  },
                ]}
              >
                Actions
              </ButtonDropdown>
            }
          >
            Channels
          </Header>
        }
        columnDefinitions={columnDefinitions}
        columnDisplay={preferences.contentDisplay}
        items={items}
        pagination={<Pagination {...paginationProps} />}
        filter={<TextFilter {...filterProps} />}
      />
      <Modal
        onDismiss={() => setModalVisible(false)}
        visible={modalVisible}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                disabled={isRunning || isStarting || isStopping}
                onClick={() => setModalVisible(false)}
              >
                No
              </Button>
              <Button
                variant="primary"
                loading={isRunning || isStarting || isStopping}
                onClick={performAction}
              >
                Yes
              </Button>
            </SpaceBetween>
          </Box>
        }
        header="Confirmation"
      >
        <SpaceBetween size="xs">
          {actionId === "start-ingestion" && (
            <>
              <FormField
                description="Provide a value for the label to use in TAMS."
                label="Label"
              >
                <Input
                  value={label}
                  onChange={({ detail }) => {
                    setLabel(detail.value);
                  }}
                />
              </FormField>
            </>
          )}
          <TextContent>{confirmationMessages[actionId]}</TextContent>
        </SpaceBetween>
      </Modal>
    </>
  );
};

export default MediaLiveIngestion;
