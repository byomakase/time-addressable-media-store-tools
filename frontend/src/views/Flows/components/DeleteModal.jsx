import { useState } from "react";
import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
  TextContent,
  Toggle,
} from "@cloudscape-design/components";
import useStore from "@/stores/useStore";
import { useDelete } from "@/hooks/useFlows";
import { useDeleteTimerange } from "@/hooks/useFlows";

const DeleteModal = ({
  modalVisible,
  setModalVisible,
  selectedItem,
  setSelectedItem,
}) => {
  const [enableTimerange, setEnableTimerange] = useState(false);
  const [timerange, setTimerange] = useState("");
  const { del, isDeleting } = useDelete();
  const { delTimerange, isDeletingTimerange } = useDeleteTimerange();
  const addAlertItem = useStore((state) => state.addAlertItem);
  const delAlertItem = useStore((state) => state.delAlertItem);

  const deleteFlow = async () => {
    const id = crypto.randomUUID();
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: (
        <TextContent>
          Flow {selectedItem.id} is being deleted. This will happen
          asynchronously. You may need to refresh to see the change.
        </TextContent>
      ),
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    await del({ flowId: selectedItem.id });
    handleDismiss();
  };

  const deleteTimerange = async () => {
    const id = crypto.randomUUID();
    addAlertItem({
      type: "success",
      dismissible: true,
      dismissLabel: "Dismiss message",
      content: (
        <TextContent>
          Flow segments on flow {selectedItem.id} within the timerange{" "}
          {timerange} are being deleted. This will happen asynchronously...
        </TextContent>
      ),
      id: id,
      onDismiss: () => delAlertItem(id),
    });
    await delTimerange({ flowId: selectedItem.id, timerange });
    handleDismiss();
  };

  const handleDismiss = () => {
    setModalVisible(false);
    setTimerange("");
    setEnableTimerange(false);
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
              disabled={isDeleting || isDeletingTimerange}
              onClick={handleDismiss}
            >
              No
            </Button>
            <Button
              variant="primary"
              loading={isDeleting || isDeletingTimerange}
              onClick={enableTimerange ? deleteTimerange : deleteFlow}
            >
              Yes
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Delete Confirmation"
    >
      <SpaceBetween size="xs">
        <Toggle
          onChange={({ detail }) => setEnableTimerange(detail.checked)}
          checked={enableTimerange}
        >
          Delete Timerange
        </Toggle>
        {enableTimerange && (
          <FormField
            description="Provide a timerange for the segments to be deleted."
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
        <TextContent>
          {enableTimerange
            ? "Are you sure you wish to DELETE the specified timerange of this flow?"
            : "Are you sure you wish to DELETE this flow?"}
        </TextContent>
      </SpaceBetween>
    </Modal>
  );
};

export default DeleteModal;
