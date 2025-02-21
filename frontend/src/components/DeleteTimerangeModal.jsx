import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
} from "@cloudscape-design/components";

const DeleteTimeRangeModal = ({
  modalVisible,
  setModalVisible,
  isDeletingTimerange,
  deleteTimerange,
  timerange,
  setTimerange,
}) => {
  return (
    <Modal
      onDismiss={() => setModalVisible(false)}
      visible={modalVisible}
      footer={
        <Box float="right">
          <SpaceBetween direction="horizontal" size="xs">
            <Button
              variant="link"
              disabled={isDeletingTimerange}
              onClick={() => setModalVisible(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={isDeletingTimerange}
              onClick={deleteTimerange}
            >
              Delete
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Confirmation"
    >
      <>
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
      </>
    </Modal>
  );
};

export default DeleteTimeRangeModal;
