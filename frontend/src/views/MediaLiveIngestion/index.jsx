import { useState } from "react";
import { AWS_REGION, PAGE_SIZE, STATUS_MAPPINGS } from "@/constants";
import {
  Box,
  ButtonGroup,
  Link as ExternalLink,
  Header,
  Pagination,
  Popover,
  StatusIndicator,
  Table,
  TextContent,
  TextFilter,
} from "@cloudscape-design/components";
import StartIngestElementalModal from "@/components/StartIngestElementalModal";
import ConfirmationModal from "./components/ConfirmationModal";
import { useCollection } from "@cloudscape-design/collection-hooks";
import { useChannels } from "@/hooks/useChannels";

const MediaLiveIngestion = () => {
  const { channels, isLoading } = useChannels();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState();
  const [actionId, setActionId] = useState("");

  const preferences = {
    pageSize: PAGE_SIZE,
    contentDisplay: [
      { id: "id", visible: true },
      { id: "name", visible: true },
      { id: "manifest", visible: true },
      { id: "state", visible: true },
      { id: "button", visible: true },
    ],
  };
  const { items, collectionProps, filterProps, paginationProps } =
    useCollection(isLoading ? [] : channels, {
      filtering: {
        empty: (
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <b>No channels</b>
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
  const columnDefinitions = [
    {
      id: "id",
      header: "Channel Id",
      cell: (item) => (
        <ExternalLink
          external
          href={`https://${AWS_REGION}.console.aws.amazon.com/medialive/home?region=${AWS_REGION}#/channels/${item.id}/`}
        >
          {item.id}
        </ExternalLink>
      ),
      sortingField: "id",
      isRowHeader: true,
    },
    {
      id: "name",
      header: "Channel Name",
      cell: (item) => item.name,
      sortingField: "name",
    },
    {
      id: "manifest",
      header: "Manifest Uri",
      cell: (item) => (
        <Popover
          dismissButton={false}
          position="top"
          size="small"
          triggerType="text"
          content={item.manifestUri}
        >
          <TextContent>{item.manifestUri.replace(/^.*[\\/]/, "")}</TextContent>
        </Popover>
      ),
      sortingField: "manifest",
    },
    {
      id: "state",
      header: "Channel State",
      cell: (item) => (
        <StatusIndicator type={STATUS_MAPPINGS[item.state]}>
          {item.state}
        </StatusIndicator>
      ),
      sortingField: "state",
    },
    {
      id: "button",
      cell: (item) => (
        <ButtonGroup
          onItemClick={({ detail }) => handleClick({ detail, item })}
          items={[
            {
              type: "icon-button",
              id: "ingest",
              iconName: "add-plus",
              text: `Ingest ${item.id}`,
            },
            {
              type: "icon-button",
              id: "start",
              iconName: "play",
              disabled: item.state !== "IDLE",
              text: `Start ${item.id}`,
            },
            {
              type: "icon-button",
              id: "stop",
              iconName: "pause",
              disabled: item.state !== "RUNNING",
              text: `Stop ${item.id}`,
            },
          ]}
          variant="icon"
        />
      ),
    },
  ];

  const handleClick = ({ detail, item }) => {
    setSelectedItem(item);
    setActionId(detail.id);
    setModalVisible(true);
  };

  return (
    <>
      <Table
        {...collectionProps}
        variant="borderless"
        loadingText="Loading resources"
        loading={isLoading}
        trackBy="id"
        header={<Header>Channels</Header>}
        columnDefinitions={columnDefinitions}
        columnDisplay={preferences.contentDisplay}
        contentDensity="compact"
        items={items}
        pagination={<Pagination {...paginationProps} />}
        filter={<TextFilter {...filterProps} />}
      />
      {
        {
          ingest: (
            <StartIngestElementalModal
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              source="medialive"
              selectedItem={selectedItem}
              setSelectedItem={setSelectedItem}
            />
          ),
          start: (
            <ConfirmationModal
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              channelId={selectedItem?.id}
              setSelectedItem={setSelectedItem}
              actionId={actionId}
              setActionId={setActionId}
            />
          ),
          stop: (
            <ConfirmationModal
              modalVisible={modalVisible}
              setModalVisible={setModalVisible}
              channelId={selectedItem?.id}
              setSelectedItem={setSelectedItem}
              actionId={actionId}
              setActionId={setActionId}
            />
          ),
        }[actionId]
      }
    </>
  );
};

export default MediaLiveIngestion;
