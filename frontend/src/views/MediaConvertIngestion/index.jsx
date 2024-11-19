import { AWS_REGION, PAGE_SIZE, STATUS_MAPPINGS } from "@/constants";
import {
  Box,
  Link as ExternalLink,
  Header,
  Pagination,
  ProgressBar,
  StatusIndicator,
  Table,
  TextFilter,
} from "@cloudscape-design/components";

import { Link } from "react-router-dom";
import React from "react";
import { useCollection } from "@cloudscape-design/collection-hooks";
import useJobs from "@/hooks/useJobs";

const MediaConvertIngestion = () => {
  const { jobs, isLoading } = useJobs();
  const preferences = {
    pageSize: PAGE_SIZE,
    contentDisplay: [
      { id: "Input", visible: true },
      { id: "SourceId", visible: true },
      { id: "Status", visible: true },
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
      id: "Input",
      header: "Input File",
      cell: (item) => (
        <ExternalLink
          external
          href={`https://${AWS_REGION}.console.aws.amazon.com/mediaconvert/home?region=${AWS_REGION}#/jobs/summary/${item.Id}/`}
        >
          {item.Input}
        </ExternalLink>
      ),
      sortingField: "Input",
      isRowHeader: true,
      minWidth: 310,
    },
    {
      id: "SourceId",
      header: "Source Id",
      cell: (item) => (
        <Link to={`/sources/${item.SourceId}`}>{item.SourceId}</Link>
      ),
      sortingField: "SourceId",
      isRowHeader: true,
      minWidth: 310,
    },
    {
      id: "Status",
      header: "Jobs Status",
      cell: (item) =>
        item.JobPercentComplete ? (
          <ProgressBar value={item.JobPercentComplete} />
        ) : (
          <StatusIndicator type={STATUS_MAPPINGS[item.Status]}>
            {item.Status}
          </StatusIndicator>
        ),
      sortingField: "Status",
      minWidth: 150,
    },
  ];

  return (
    <Table
      {...collectionProps}
      isItemDisabled={(item) => !item.Valid || loading}
      variant="borderless"
      loadingText="Loading resources"
      loading={isLoading}
      trackBy="Id"
      header={<Header>Jobs</Header>}
      columnDefinitions={columnDefinitions}
      columnDisplay={preferences.contentDisplay}
      items={items}
      pagination={<Pagination {...paginationProps} />}
      filter={<TextFilter {...filterProps} />}
    />
  );
};

export default MediaConvertIngestion;
