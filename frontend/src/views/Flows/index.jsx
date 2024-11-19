import {
  Box,
  Button,
  ButtonDropdown,
  CollectionPreferences,
  FormField,
  Header,
  Input,
  Modal,
  Pagination,
  SpaceBetween,
  Table,
  TextContent,
  TextFilter,
  Toggle,
} from "@cloudscape-design/components";
import { useDelete, useDeleteTimerange, useFlows } from "@/hooks/useFlows";

import { Link } from "react-router-dom";
import { useCollection } from "@cloudscape-design/collection-hooks";
import { useState } from "react";
import useStore from "@/stores/useStore";

const columnDefinitions = [
  {
    id: "id",
    header: "Id",
    cell: (item) => <Link to={`/flows/${item.id}`}>{item.id}</Link>,
    sortingField: "id",
    isRowHeader: true,
    minWidth: 340,
  },
  {
    id: "label",
    header: "Label",
    cell: (item) => item.label,
    sortingField: "label",
  },
  {
    id: "description",
    header: "Description",
    cell: (item) => item.description,
    sortingField: "description",
    minWidth: 240,
  },
  {
    id: "format",
    header: "Format",
    cell: (item) => item.format,
    sortingField: "format",
    minWidth: 240,
  },
  {
    id: "created_by",
    header: "Created by",
    cell: (item) => item.created_by,
    sortingField: "created_by",
  },
  {
    id: "updated_by",
    header: "Modified by",
    cell: (item) => item.updated_by,
    sortingField: "updated_by",
  },
  {
    id: "created",
    header: "Created",
    cell: (item) => item.created,
    sortingField: "created",
  },
  {
    id: "tags",
    header: "Tags",
    cell: (item) => item.tags,
    sortingField: "tags",
  },
  {
    id: "flow_collection",
    header: "Flow collection",
    cell: (item) => item.flow_collection,
    sortingField: "flow_collection",
  },
  {
    id: "collected_by",
    header: "Collected by",
    cell: (item) => item.collected_by,
    sortingField: "collected_by",
  },
  {
    id: "source_id",
    header: "Source id",
    cell: (item) => item.source_id,
    sortingField: "source_id",
  },
  {
    id: "metadata_version",
    header: "Metadata version",
    cell: (item) => item.metadata_version,
    sortingField: "metadata_version",
  },
  {
    id: "generation",
    header: "Generation",
    cell: (item) => item.generation,
    sortingField: "generation",
  },
  {
    id: "metadata_updated",
    header: "Metadata updated",
    cell: (item) => item.metadata_updated,
    sortingField: "metadata_updated",
  },
  {
    id: "segments_updated",
    header: "Segments updated",
    cell: (item) => item.segments_updated,
    sortingField: "segments_updated",
  },
  {
    id: "read_only",
    header: "Read only",
    cell: (item) => item.read_only,
    sortingField: "read_only",
  },
  {
    id: "codec",
    header: "Codec",
    cell: (item) => item.codec,
    sortingField: "codec",
  },
  {
    id: "container",
    header: "Container",
    cell: (item) => item.container,
    sortingField: "container",
  },
  {
    id: "avg_bit_rate",
    header: "Avg bit rate",
    cell: (item) => item.avg_bit_rate,
    sortingField: "avg_bit_rate",
  },
  {
    id: "max_bit_rate",
    header: "Max bit rate",
    cell: (item) => item.max_bit_rate,
    sortingField: "max_bit_rate",
  },
];
const collectionPreferencesProps = {
  pageSizePreference: {
    title: "Select page size",
    options: [
      { value: 10, label: "10 resources" },
      { value: 20, label: "20 resources" },
    ],
  },
  contentDisplayPreference: {
    title: "Column preferences",
    description: "Customize the columns visibility and order.",
    options: columnDefinitions.map(({ id, header }) => ({
      id,
      label: header,
      alwaysVisible: id === "id",
    })),
  },
  cancelLabel: "Cancel",
  confirmLabel: "Confirm",
  title: "Preferences",
};

const Flows = () => {
  const { flows, mutate, isLoading, isValidating } = useFlows();
  const { del, isDeleting } = useDelete();
  const { delTimerange, isDeletingTimerange } = useDeleteTimerange();
  const [showHierarchy, setShowHierarchy] = useState(true);
  const [preferences, setPreferences] = useState({
    pageSize: 10,
    contentDisplay: [
      { id: "id", visible: true },
      { id: "label", visible: true },
      { id: "description", visible: true },
      { id: "format", visible: true },
      { id: "created_by", visible: false },
      { id: "updated_by", visible: false },
      { id: "created", visible: true },
      { id: "tags", visible: false },
      { id: "flow_collection", visible: false },
      { id: "collected_by", visible: false },
      { id: "source_id", visible: false },
      { id: "metadata_version", visible: false },
      { id: "generation", visible: false },
      { id: "metadata_updated", visible: false },
      { id: "segments_updated", visible: false },
      { id: "read_only", visible: false },
      { id: "codec", visible: false },
      { id: "container", visible: false },
      { id: "avg_bit_rate", visible: false },
      { id: "max_bit_rate", visible: false },
    ],
  });
  const [modalVisible, setModalVisible] = useState(false);
  const [actionId, setActionId] = useState("");
  const [timerange, setTimerange] = useState("");
  const { items, collectionProps, filterProps, paginationProps } =
    useCollection(isValidating || isLoading ? [] : flows, {
      expandableRows: showHierarchy && {
        getId: (item) => item.id,
        getParentId: (item) =>
          item.collected_by ? item.collected_by[0] : null,
      },
      filtering: {
        empty: (
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <b>No flows</b>
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
  const addAlertItems = useStore((state) => state.addAlertItems);
  const delAlertItem = useStore((state) => state.delAlertItem);

  const deleteFlow = async () => {
    const promises = selectedItems.map((item) => del({ flowId: item.id }));
    const id = crypto.randomUUID();
    addAlertItems(
      selectedItems.map((flow, n) => ({
        type: "success",
        dismissible: true,
        dismissLabel: "Dismiss message",
        content: (
          <TextContent>
            Flow {flow.id} is being deleted. This will happen asynchronously.
            You may need to refresh to see the change.
          </TextContent>
        ),
        id: `${id}-${n}`,
        onDismiss: () => delAlertItem(`${id}-${n}`),
      }))
    );
    await Promise.all(promises);
    setModalVisible(false);
  };

  const deleteTimerange = async () => {
    const promises = selectedItems.map((item) =>
      delTimerange({ flowId: item.id, timerange })
    );
    const id = crypto.randomUUID();
    addAlertItems(
      selectedItems.map((flow, n) => ({
        type: "success",
        dismissible: true,
        dismissLabel: "Dismiss message",
        content: (
          <TextContent>
            Flow segments on flow {flow.id} within the timerange {timerange} are
            being deleted. This will happen asynchronously...
          </TextContent>
        ),
        id: `${id}-${n}`,
        onDismiss: () => delAlertItem(`${id}-${n}`),
      }))
    );
    await Promise.all(promises);
    setTimerange("");
    setModalVisible(false);
  };

  const handleOnClick = ({ detail }) => {
    setActionId(detail.id);
    setModalVisible(true);
  };

  return (
    <>
      <Table
        {...collectionProps}
        variant="borderless"
        resizableColumns
        loadingText="Loading resources"
        loading={isValidating || isLoading}
        trackBy="id"
        selectionType="multi"
        header={
          <Header
            actions={
              <SpaceBetween
                size="xs"
                direction="horizontal"
                alignItems="center"
              >
                <Toggle
                  onChange={({ detail }) => setShowHierarchy(detail.checked)}
                  checked={showHierarchy}
                >
                  Hierarchical View
                </Toggle>
                <ButtonDropdown
                  onItemClick={handleOnClick}
                  disabled={selectedItems.length === 0}
                  items={[
                    {
                      text: "Delete",
                      id: "delete",
                      disabled: !(selectedItems.length > 0),
                    },
                    {
                      text: "Timerange delete",
                      id: "timerange",
                      disabled: !(selectedItems.length > 0),
                    },
                  ]}
                >
                  Actions
                </ButtonDropdown>
                <Button
                  iconName="refresh"
                  variant="link"
                  onClick={mutate}
                  disabled={isValidating || isLoading}
                />
              </SpaceBetween>
            }
          >
            Flows
          </Header>
        }
        columnDefinitions={columnDefinitions}
        columnDisplay={preferences.contentDisplay}
        items={items}
        pagination={<Pagination {...paginationProps} />}
        filter={<TextFilter {...filterProps} />}
        preferences={
          <CollectionPreferences
            {...collectionPreferencesProps}
            preferences={preferences}
            onConfirm={({ detail }) => setPreferences(detail)}
          />
        }
      />
      <Modal
        onDismiss={() => setModalVisible(false)}
        visible={modalVisible}
        footer={
          <Box float="right">
            <SpaceBetween direction="horizontal" size="xs">
              <Button
                variant="link"
                disabled={isDeleting || isDeletingTimerange}
                onClick={() => setModalVisible(false)}
              >
                {actionId === "delete" ? "No" : "Cancel"}
              </Button>
              <Button
                variant="primary"
                loading={isDeleting || isDeletingTimerange}
                onClick={actionId === "delete" ? deleteFlow : deleteTimerange}
              >
                {actionId === "delete" ? "Yes" : "Delete"}
              </Button>
            </SpaceBetween>
          </Box>
        }
        header="Confirmation"
      >
        {actionId === "delete" ? (
          <TextContent>
            Are you sure you wish to DELETE the selected Flow(s)?
          </TextContent>
        ) : (
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
        )}
      </Modal>
    </>
  );
};

export default Flows;
