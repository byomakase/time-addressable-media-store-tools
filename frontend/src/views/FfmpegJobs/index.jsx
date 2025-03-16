import { useState } from "react";
import { AWS_REGION, PAGE_SIZE, STATUS_MAPPINGS } from "@/constants";
import {
  Box,
  CollectionPreferences,
  Link as ExternalLink,
  Header,
  Pagination,
  StatusIndicator,
  Table,
  TextFilter,
} from "@cloudscape-design/components";

import { Link } from "react-router-dom";
import { useCollection } from "@cloudscape-design/collection-hooks";
import { useJobs } from "@/hooks/useFfmpeg";

const columnDefinitions = [
  {
    id: "id",
    header: "Id",
    cell: (item) => <Link to={`/flows/${item.id}`}>{item.id}</Link>,
    sortingField: "id",
    isRowHeader: true,
    width: 310,
  },
  {
    id: "sourceTimerange",
    header: "Timerange",
    cell: (item) => item.sourceTimerange,
    sortingField: "sourceTimerange",
    maxWidth: 160,
  },
  {
    id: "command",
    header: "FFmpeg Command",
    cell: (item) => item.ffmpeg?.command?.join(" "),
    sortingField: "command",
    maxWidth: 200,
  },
  {
    id: "outputFormat",
    header: "Output Format",
    cell: (item) => item.ffmpeg?.outputFormat,
    sortingField: "outputFormat",
  },
  {
    id: "destinationFlow",
    header: "Destination Flow",
    cell: (item) => (
      <Link to={`/flows/${item.destinationFlow}`}>{item.destinationFlow}</Link>
    ),
    sortingField: "destinationFlow",
    width: 310,
  },
  {
    id: "status",
    header: "Status",
    cell: (item) =>
      item.status && (
        <>
          <StatusIndicator type={STATUS_MAPPINGS[item.status]}>
            {item.status}
          </StatusIndicator>
          <ExternalLink
            external
            href={`https://${AWS_REGION}.console.aws.amazon.com/states/home?region=${AWS_REGION}#/v2/executions/details/${item.executionArn}`}
            variant="info"
          />
        </>
      ),
    sortingField: "status",
  },
  {
    id: "startDate",
    header: "Start",
    cell: (item) => item.startDate,
    sortingField: "startDate",
  },
  {
    id: "stopDate",
    header: "Stop",
    cell: (item) => item.stopDate,
    sortingField: "stopDate",
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

const FfmpegJobs = () => {
  const { jobs, isLoading } = useJobs();
  const [preferences, setPreferences] = useState({
    pageSize: PAGE_SIZE,
    contentDisplay: [
      { id: "id", visible: true },
      { id: "sourceTimerange", visible: true },
      { id: "command", visible: true },
      { id: "outputFormat", visible: false },
      { id: "destinationFlow", visible: true },
      { id: "status", visible: true },
      { id: "startDate", visible: false },
      { id: "stopDate", visible: false },
    ],
  });
  const { items, collectionProps, filterProps, paginationProps } =
    useCollection(isLoading ? [] : jobs, {
      expandableRows: {
        getId: (item) => item.id,
        getParentId: (item) => item.parentId,
      },
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

  return (
    <Table
      {...collectionProps}
      isItemDisabled={(item) => !item.Valid || loading}
      variant="borderless"
      wrapLines
      loadingText="Loading resources"
      loading={isLoading}
      trackBy="key"
      header={<Header>Jobs</Header>}
      columnDefinitions={columnDefinitions}
      columnDisplay={preferences.contentDisplay}
      contentDensity="compact"
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
  );
};

export default FfmpegJobs;
