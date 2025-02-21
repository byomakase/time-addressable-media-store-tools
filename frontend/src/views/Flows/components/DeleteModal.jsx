import {
  Box,
  Button,
  Modal,
  SpaceBetween,
  TextContent,
} from "@cloudscape-design/components";

const DeleteModal = ({
  modalVisible,
  setModalVisible,
  isDeleting,
  deleteFlow,
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
              disabled={isDeleting}
              onClick={() => setModalVisible(false)}
            >
              No
            </Button>
            <Button variant="primary" loading={isDeleting} onClick={deleteFlow}>
              Yes
            </Button>
          </SpaceBetween>
        </Box>
      }
      header="Confirmation"
    >
      <TextContent>
        Are you sure you wish to DELETE the selected Flow(s)?
      </TextContent>
    </Modal>
  );
};

export default DeleteModal;
