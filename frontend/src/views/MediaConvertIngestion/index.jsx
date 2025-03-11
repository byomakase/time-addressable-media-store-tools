import { useState } from "react";
import { AWS_REGION, PAGE_SIZE, STATUS_MAPPINGS } from "@/constants";
import {
  Badge,
  Box,
  ButtonGroup,
  Link as ExternalLink,
  Header,
  Pagination,
  Popover,
  ProgressBar,
  SpaceBetween,
  StatusIndicator,
  Table,
  TextContent,
  TextFilter,
} from "@cloudscape-design/components";
import StartIngestModal from "@/components/StartIngestModal";

import { useCollection } from "@cloudscape-design/collection-hooks";
import useJobs from "@/hooks/useJobs";

const MediaConvertIngestion = () => {
  const { jobs, isLoading } = useJobs();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState();

  const preferences = {
    pageSize: PAGE_SIZE,
    contentDisplay: [
      { id: "id", visible: true },
      { id: "input", visible: true },
      { id: "status", visible: true },
      { id: "button", visible: true },
    ],
  };
  const { items, collectionProps, filterProps, paginationProps } =
    useCollection(isLoading ? [] : jobs, {
      filtering: {
        empty: (
          <Box margin={{ vertical: "xs" }} textAlign="center" color="inherit">
            <b>No jobs</b>
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
      header: "Job Id",
      cell: (item) => (
        <ExternalLink
          external
          href={`https://${AWS_REGION}.console.aws.amazon.com/mediaconvert/home?region=${AWS_REGION}#/jobs/summary/${item.id}/`}
        >
          {item.id}
        </ExternalLink>
      ),
      sortingField: "Id",
      isRowHeader: true,
    },
    {
      id: "input",
      header: "First Input File Name",
      cell: (item) =>
        item.manifestUri ? (
          <Popover
            dismissButton={false}
            position="top"
            size="small"
            triggerType="text"
            content={item.manifestUri}
          >
            <TextContent>{item.fileName}</TextContent>
          </Popover>
        ) : (
          <SpaceBetween direction="horizontal" size="xs">
            <TextContent>{item.fileName}</TextContent>
            <Badge color="severity-medium">Missing Manifest</Badge>
          </SpaceBetween>
        ),
      sortingField: "input",
    },
    {
      id: "status",
      header: "Jobs Status",
      cell: (item) =>
        item.jobPercentComplete ? (
          <ProgressBar value={item.jobPercentComplete} />
        ) : (
          <StatusIndicator type={STATUS_MAPPINGS[item.status]}>
            {item.status}
          </StatusIndicator>
        ),
      sortingField: "status",
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
              disabled: !item.manifestUri,
            },
          ]}
          variant="icon"
        />
      ),
    },
  ];

  const handleClick = ({ item }) => {
    setSelectedItem(item);
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
        header={<Header>Jobs</Header>}
        columnDefinitions={columnDefinitions}
        columnDisplay={preferences.contentDisplay}
        items={items}
        pagination={<Pagination {...paginationProps} />}
        filter={<TextFilter {...filterProps} />}
      />
      <StartIngestModal
        modalVisible={modalVisible}
        setModalVisible={setModalVisible}
        source="mediaconvert"
        recordId={selectedItem?.id}
        initialManifest={selectedItem?.manifestUri}
        setSelectedItem={setSelectedItem}
        readOnlyManifest={true}
      />
    </>
  );
};

export default MediaConvertIngestion;
