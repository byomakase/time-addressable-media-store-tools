import {
  Box,
  Button,
  FormField,
  Input,
  Modal,
  SpaceBetween,
  Table,
  TextContent,
} from "@cloudscape-design/components";
import { useDelete, useUpdate } from "@/hooks/useTags";

import { useState } from "react";

const Tags = ({ id, entityType, tags }) => {
  const { update, isUpdating } = useUpdate(entityType, id);
  const { del, isDeleting } = useDelete(entityType, id);
  const [modalVisible, setModalVisible] = useState(false);
  const [actionId, setActionId] = useState("");
  const [tagName, setTagName] = useState("");
  const [tagValue, setTagValue] = useState("");

  const handleConfirmAdd = () => {
    setActionId("Add");
    setTagName("");
    setTagValue("");
    setModalVisible(true);
  };

  const handleConfirmDelete = (tagKey) => {
    setActionId("Delete");
    setTagName(tagKey);
    setTagValue("");
    setModalVisible(true);
  };

  const updateTag = async (name, value) => {
    await update({ name, value });
    setTagName("");
    setTagValue("");
    setModalVisible(false);
  };

  const deleteTag = async () => {
    await del({ name: tagName });
    setTagName("");
    setModalVisible(false);
  };

  return (
    <SpaceBetween size="xs">
      {tags ? (
        <Table
          trackBy="key"
          variant="borderless"
          columnDefinitions={[
            {
              id: "key",
              header: "Key",
              cell: (item) => item.key,
              isRowHeader: true,
            },
            {
              id: "value",
              header: "Value",
              cell: (item) => item.value,
              editConfig: {
                editingCell: (item, { currentValue, setValue }) => {
                  return (
                    <Input
                      autoFocus
                      value={currentValue ?? item.value}
                      onChange={({ detail }) => setValue(detail.value)}
                    />
                  );
                },
              },
            },
            {
              id: "delete",
              cell: (item) => (
                <Button
                  iconName="delete-marker"
                  variant="icon"
                  onClick={() => handleConfirmDelete(item.key)}
                />
              ),
              maxWidth: 32,
            },
          ]}
          items={Object.entries(tags).map((tag) => ({
            key: tag[0],
            value: tag[1],
          }))}
          sortingDisabled
          submitEdit={(item, _, newValue) => updateTag(item.key, newValue)}
        />
      ) : (
        <TextContent>No tags</TextContent>
      )}
      <Button iconName="add-plus" variant="normal" onClick={handleConfirmAdd}>
        Add Tag
      </Button>
      <Modal
        onDismiss={() => setModalVisible(false)}
        visible={modalVisible}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                disabled={isUpdating || isDeleting}
                onClick={() => setModalVisible(false)}
              >
                {actionId === "Add" ? "Cancel" : "No"}
              </Button>
              <Button
                variant="primary"
                loading={isUpdating || isDeleting}
                onClick={() =>
                  actionId === "Add"
                    ? updateTag(tagName, tagValue)
                    : deleteTag()
                }
              >
                {actionId === "Add" ? "Add" : "Yes"}
              </Button>
            </SpaceBetween>
          </Box>
        }
        header={`${actionId} tag`}
      >
        <SpaceBetween size="xs">
          {actionId === "Add" ? (
            <>
              <FormField description="Provide a name for the tag." label="Name">
                <Input
                  value={tagName}
                  onChange={({ detail }) => {
                    setTagName(detail.value);
                  }}
                />
              </FormField>
              <FormField
                description="Provide a value for the tag."
                label="Value"
              >
                <Input
                  value={tagValue}
                  onChange={({ detail }) => {
                    setTagValue(detail.value);
                  }}
                />
              </FormField>
            </>
          ) : (
            <TextContent>
              Are you sure you wish to delete the {tagName} tag?
            </TextContent>
          )}
        </SpaceBetween>
      </Modal>
    </SpaceBetween>
  );
};

export default Tags;
