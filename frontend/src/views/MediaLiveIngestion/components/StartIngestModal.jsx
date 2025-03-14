import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
  Textarea,
  TextContent,
} from "@cloudscape-design/components";
import { AWS_HLS_INGEST_ARN } from "@/constants";
import { useStateMachine } from "@/hooks/useStateMachine";
import useStore from "@/stores/useStore";
import stringify from "json-stable-stringify";

const StartIngestModal = ({
  modalVisible,
  setModalVisible,
  selectedItem,
  setSelectedItem,
}) => {
  const [label, setLabel] = useState("");
  const { execute, isExecuting } = useStateMachine();
  const addAlertItem = useStore((state) => state.addAlertItem);
  const delAlertItem = useStore((state) => state.delAlertItem);

  const performAction = async () => {
    const id = `medialive-${selectedItem.id}-${Date.now()}`;
    await execute({
      stateMachineArn: AWS_HLS_INGEST_ARN,
      name: id,
      input: stringify({
        label,
        manifestLocation: selectedItem.manifestUri,
      }),
      traceHeader: id,
    });
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: (
        <TextContent>
          A new ingestion process: {id} has been started...
        </TextContent>
      ),
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    setModalVisible(false);
    setSelectedItem({});
    setLabel("");
  };

  const handleDismiss = async () => {
    setModalVisible(false);
    setSelectedItem({});
    setLabel("");
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
              disabled={isExecuting}
              onClick={handleDismiss}
            >
              No
            </Button>
            <Button
              variant="primary"
              loading={isExecuting}
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
        <FormField
          description="The following manifest will be processed and ingested."
          label="Manifest URI"
          warningText={selectedItem.manifestExists && "This content already exists. You can proceed with the ingest job if you wish. The warning is provided in case you expected to process new content instead of existing."}
        >
          <Textarea
            value={selectedItem?.manifestUri}
            readOnly
          />
        </FormField>
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
        <TextContent>Are you sure you wish to START an Ingestion?</TextContent>
      </SpaceBetween>
    </Modal>
  );
};

export default StartIngestModal;
