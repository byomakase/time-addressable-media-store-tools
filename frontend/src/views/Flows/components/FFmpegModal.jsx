import { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormField,
  KeyValuePairs,
  Input,
  Modal,
  Select,
  SpaceBetween,
  TextContent,
  Toggle,
} from "@cloudscape-design/components";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import useStore from "@/stores/useStore";
import { fetchAuthSession } from "aws-amplify/auth";
import { AWS_REGION, AWS_FFMPEG_PARAMETER } from "@/constants";
import { useJobStart } from "@/hooks/useFfmpeg";
import { useCreateRule } from "@/hooks/useFfmpeg";

const FFmpegModal = ({
  modalVisible,
  setModalVisible,
  selectedItem,
  setSelectedItem,
  flowIds,
}) => {
  const [enableTimerange, setEnableTimerange] = useState(false);
  const [destination, setDestination] = useState("");
  const [timerange, setTimerange] = useState("");
  const [commands, setCommands] = useState([]);
  const [ffmpeg, setFfmpeg] = useState();
  const { start, isStarting } = useJobStart();
  const { put, isPutting } = useCreateRule();
  const addAlertItem = useStore((state) => state.addAlertItem);
  const delAlertItem = useStore((state) => state.delAlertItem);

  useEffect(() => {
    const fetchCommands = async () => {
      const data = await fetchAuthSession().then((session) =>
        new SSMClient({ region: AWS_REGION, credentials: session.credentials })
          .send(new GetParameterCommand({ Name: AWS_FFMPEG_PARAMETER }))
          .then((response) => JSON.parse(response.Parameter.Value))
      );
      setCommands(
        Object.entries(data).map(([label, value]) => ({
          label,
          value,
        }))
      );
    };
    fetchCommands();
  }, []);

  const createRule = async () => {
    const id = crypto.randomUUID();
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: <TextContent>The Rule is being created...</TextContent>,
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    await put({
      flowId: selectedFlowId,
      destinationFlowId: destination,
      payload: ffmpeg,
    });
    handleDismiss();
  };

  const createJob = async () => {
    const id = crypto.randomUUID();
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: <TextContent>The Batch Job is being started...</TextContent>,
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    await start({
      sourceFlow: selectedItem.Id,
      sourceTimerange: timerange,
      ffmpeg,
      destinationFlow: destination,
    });
    handleDismiss();
  };

  const handleDismiss = () => {
    setModalVisible(false);
    setEnableTimerange(false);
    setDestination("");
    setTimerange("");
    // setCommands([]);
    setFfmpeg();
    setSelectedItem();
  };

  return (
    <Modal
      onDismiss={handleDismiss}
      visible={modalVisible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              disabled={isStarting || isPutting}
              onClick={handleDismiss}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isStarting || isPutting}
              onClick={enableTimerange ? createJob : createRule}
            >
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
      header={"Create FFmpeg " + (enableTimerange ? "Batch Job" : "Event Rule")}
    >
      <SpaceBetween size="xs">
        {enableTimerange ? (
          <TextContent>
            <p>
              This will create a one off batch <strong>JOB</strong> that will
              process all the segments registered to this flow, or within the
              supplied timerange. For each segment the chosen FFMpeg action will
              be applied to it and the result will be re-ingested into TAMS to a
              newly created Flow.
            </p>
          </TextContent>
        ) : (
          <TextContent>
            <p>
              This will create an event based <strong>RULE</strong> that
              triggers automatically whenever a new segment is registered
              against thie flow. When a new segment is detected the chosen
              FFMpeg action will be applied to it and the result will be
              re-ingested into TAMS to a newly created Flow.
            </p>
          </TextContent>
        )}
        <Toggle
          onChange={({ detail }) => setEnableTimerange(detail.checked)}
          checked={enableTimerange}
        >
          Batch Job
        </Toggle>
        {enableTimerange && (
          <FormField
            description="(Optional) Provide a timerange for the segments to processed."
            label="Timerange"
          >
            <Input
              value={timerange}
              onChange={({ detail }) => {
                setTimerange(detail.value);
              }}
            />
          </FormField>
        )}
        <FormField
          description="Provide a destination Flow"
          label="Destination Flow"
        >
          <Select
            selectedOption={flowIds?.find(({ value }) => value === destination)}
            onChange={({ detail }) =>
              setDestination(detail.selectedOption.value)
            }
            options={flowIds}
          />
        </FormField>
        <FormField
          description="Choose an FFmpeg command"
          label="FFmpeg Command"
        >
          <Select
            selectedOption={commands.find(({ value }) => value === ffmpeg)}
            onChange={({ detail }) => setFfmpeg(detail.selectedOption.value)}
            options={commands}
          />
        </FormField>
        {ffmpeg && (
          <KeyValuePairs
            columns={2}
            items={[
              {
                label: "Command",
                value: ffmpeg.command?.join(" "),
              },
              {
                label: "Output",
                value: ffmpeg.outputFormat,
              },
            ]}
          />
        )}
      </SpaceBetween>
    </Modal>
  );
};

export default FFmpegModal;
