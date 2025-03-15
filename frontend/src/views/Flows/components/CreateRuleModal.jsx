import { useState, useEffect } from "react";
import {
  Box,
  Button,
  FormField,
  KeyValuePairs,
  Modal,
  Select,
  SpaceBetween,
  TextContent,
} from "@cloudscape-design/components";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import useStore from "@/stores/useStore";
import { fetchAuthSession } from "aws-amplify/auth";
import { AWS_REGION, AWS_FFMPEG_PARAMETER } from "@/constants";
import { useCreateRule } from "@/hooks/useFfmpeg";

const CreateRuleModal = ({
  modalVisible,
  setModalVisible,
  selectedFlowId,
  setSelectedItems,
  flowIds,
}) => {
  const [commands, setCommands] = useState([]);
  const [destination, setDestination] = useState("");
  const [ffmpeg, setFfmpeg] = useState({});
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

  const handleDismiss = () => {
    setModalVisible(false);
    setFfmpeg({});
    setDestination({});
  };

  const createRule = async () => {
    const putPromise = put({
      flowId: selectedFlowId,
      destinationFlowId: destination,
      payload: ffmpeg,
    });
    const id = crypto.randomUUID();
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: <TextContent>The Rule is being created...</TextContent>,
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    await putPromise;
    setModalVisible(false);
    setDestination({});
    setFfmpeg({});
    setSelectedItems([]);
  };

  return (
    <Modal
      onDismiss={handleDismiss}
      visible={modalVisible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button variant="link" disabled={isPutting} onClick={handleDismiss}>
              Cancel
            </Button>
            <Button variant="primary" loading={isPutting} onClick={createRule}>
              Create
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Create FFmpeg Event Rule"
    >
      <SpaceBetween size="xs">
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

export default CreateRuleModal;
