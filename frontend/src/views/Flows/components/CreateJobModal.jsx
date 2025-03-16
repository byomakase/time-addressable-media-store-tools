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
import { Link } from "react-router-dom";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";
import useStore from "@/stores/useStore";
import { fetchAuthSession } from "aws-amplify/auth";
import { AWS_REGION, AWS_FFMPEG_PARAMETER } from "@/constants";
import { useJobStart } from "@/hooks/useFfmpeg";
import createFFmegFlow from "@/utils/createFFmegFlow";

const CreateJobModal = ({
  modalVisible,
  setModalVisible,
  selectedFlowId,
  mutateFlows,
}) => {
  const [commands, setCommands] = useState([]);
  const [timerange, setTimerange] = useState("");
  const [destinationFlow, setDestinationFlow] = useState("");
  const [ffmpeg, setFfmpeg] = useState();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { start } = useJobStart();
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
    setTimerange("");
    setDestinationFlow("");
    setFfmpeg();
    setIsSubmitting(false);
  };

  const createJob = async () => {
    setIsSubmitting(true);
    const destination =
      destinationFlow || (await createFFmegFlow(selectedFlowId, ffmpeg.tams));
    const id = crypto.randomUUID();
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: (
        <TextContent>
          <p>The Batch Job is being started...</p>
          <p>
            It will ingest into flow{" "}
            <Link to={`/flows/${destination}`}>{destination}</Link>
          </p>
        </TextContent>
      ),
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    await start({
      sourceFlow: selectedFlowId,
      sourceTimerange: timerange,
      ffmpeg: { command: ffmpeg.command, outputFormat: ffmpeg.outputFormat },
      destinationFlow: destination,
    });
    handleDismiss();
    setIsSubmitting(false);
    mutateFlows();
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
              disabled={isSubmitting}
              onClick={handleDismiss}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isSubmitting}
              disabled={!ffmpeg}
              onClick={createJob}
            >
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
          description="(Optional) Specify the ID for an existing Flow to ingest into. Leave blank to create a new Flow."
          label="Destination"
        >
          <Input
            value={destinationFlow}
            onChange={({ detail }) => {
              setDestinationFlow(detail.value);
            }}
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

export default CreateJobModal;
