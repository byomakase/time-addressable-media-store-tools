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
} from "@cloudscape-design/components";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import useStore from "@/stores/useStore";
import { fetchAuthSession } from "aws-amplify/auth";
import { AWS_REGION, AWS_FFMPEG_PARAMETER } from "@/constants";
import { useJobStart } from "@/hooks/useFfmpeg";

const CreateJobModal = ({
  modalVisible,
  setModalVisible,
  selectedFlowId,
  setSelectedItems,
  flowIds,
}) => {
  const [commands, setCommands] = useState([]);
  const [destination, setDestination] = useState("");
  const [timerange, setTimerange] = useState("");
  const [ffmpeg, setFfmpeg] = useState({});
  const { start, isStarting } = useJobStart();
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

  const handleDismiss = () => {
    setModalVisible(false);
    setDestination({});
    setFfmpeg({});
    setTimerange("");
  };

  const createJob = async () => {
    const startPromise = start({
      sourceFlow: selectedFlowId,
      sourceTimerange: timerange,
      ffmpeg,
      destinationFlow: destination,
    });
    const id = crypto.randomUUID();
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: <TextContent>The Batch Job is being started...</TextContent>,
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    await startPromise;
    setModalVisible(false);
    setDestination({});
    setFfmpeg({});
    setTimerange("");
    setSelectedItems([]);
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
              disabled={isStarting}
              onClick={handleDismiss}
            >
              Cancel
            </Button>
            <Button variant="primary" loading={isStarting} onClick={createJob}>
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Create FFmpeg Batch Job"
    >
      <SpaceBetween size="xs">
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
        <FormField
          description="Provide a destination Flow"
          label="Destination Flow"
        >
          <Select
            selectedOption={flowIds.find(({ value }) => value === destination)}
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
        <KeyValuePairs
          columns={2}
          items={[
            {
              label: "Command",
              value: ffmpeg?.command?.join(" "),
            },
            {
              label: "Output",
              value: ffmpeg?.outputFormat,
            },
          ]}
        />
      </SpaceBetween>
    </Modal>
  );
};

export default CreateJobModal;
