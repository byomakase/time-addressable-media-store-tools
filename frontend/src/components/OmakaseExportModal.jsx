import { useState } from "react";
import {
  Modal,
  FormField,
  Select,
  Input,
  Multiselect,
  ExpandableSection,
  SpaceBetween,
  Button,
  Box,
} from "@cloudscape-design/components";
import useAlertsStore from "@/stores/useAlertsStore";
import { executeExport } from "@/utils/executeExport";
import { getMediaConvertJobSpec } from "@/utils/getMediaConvertJobSpec";
import { useStartJob } from "@/hooks/useMediaConvert";

export default function OmakaseExportModal({
  sourceId,
  editTimeranges,
  flows,
  onModalToggle,
  isModalOpen,
}) {
  const [formData, setFormData] = useState({
    operation: "Segment Concatenation",
    format: "TS",
    bucket: "",
    path: "",
    filename: "",
    label: "",
    flows: flows
      .filter((flow) => flow.format === "urn:x-nmos:format:audio")
      .reduce((acc, flow) => {
        acc[flow.id] = true;
        return acc;
      }, {}),
  });
  const [isLoading, setIsLoading] = useState(false);
  const [showAdvancedContent, setShowAdvancedContent] = useState(false);
  const addAlertItem = useAlertsStore((state) => state.addAlertItem);
  const delAlertItem = useAlertsStore((state) => state.delAlertItem);
  const { start, isStarting } = useStartJob();

  const operations = [
    "Segment Concatenation",
    "Flow Creation",
    "MediaConvert Export",
  ];
  const formats = [
    { label: "TS", value: "M2TS" },
    { label: "MP4", value: "MP4" },
  ];
  const isExportButtonDisabled =
    formData.operation === "Flow Creation" && formData.label === "";
  const audioFlows = flows.filter(
    (flow) => flow.format === "urn:x-nmos:format:audio"
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const id = crypto.randomUUID();
    if (formData.operation === "MediaConvert Export") {
      start(
        {
          spec: JSON.stringify(
            getMediaConvertJobSpec(
              sourceId,
              `${formData.format.toLowerCase()}H264AAC`
            )
          ),
          sourceId: sourceId,
          timeranges: editTimeranges.join(","),
        },
        {
          onSuccess: (jobId) => {
            addAlertItem({
              type: "success",
              dismissible: true,
              dismissLabel: "Dismiss message",
              content: `MediaConvert Job: ${jobId} is being submitted...`,
              id: id,
              onDismiss: () => delAlertItem(id),
            });
            onModalToggle(false);
            setIsLoading(false);
          },
          onError: (err) => {
            addAlertItem({
              type: "error",
              dismissible: true,
              dismissLabel: "Dismiss message",
              content: `MediaConvert Job Error: ${err.message}`,
              id: id,
              onDismiss: () => delAlertItem(id),
            });
            onModalToggle(false);
            setIsLoading(false);
          },
        }
      );
    } else {
      try {
        await executeExport(formData, editTimeranges, flows, sourceId);
        addAlertItem({
          id,
          type: "success",
          content: "Export successful",
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () => delAlertItem(id),
        });
      } catch (error) {
        addAlertItem({
          id,
          type: "error",
          content: "Export failed",
          dismissible: true,
          dismissLabel: "Dismiss message",
          onDismiss: () => delAlertItem(id),
        });
      } finally {
        onModalToggle(false);
        setIsLoading(false);
      }
    }
  };

  const handleOperationChange = (e) => {
    setFormData((prevFormData) => {
      const newOperation = e.target.value;
      if (
        prevFormData.operation === "Segment Concatenation" &&
        newOperation !== "Segment Concatenation"
      ) {
        return {
          ...prevFormData,
          operation: newOperation,
          filename: "",
          bucket: "",
          path: "",
        };
      }
      return { ...prevFormData, operation: newOperation };
    });
  };

  return (
    <>
      <Modal
        onDismiss={() => onModalToggle(false)}
        visible={isModalOpen}
        header="Export"
      >
        <SpaceBetween direction="vertical" size="l">
          <FormField label="Operation">
            <Select
              selectedOption={{
                label: formData.operation,
                value: formData.operation,
              }}
              onChange={({ detail }) => {
                const e = { target: { value: detail.selectedOption.value } };
                handleOperationChange(e);
              }}
              options={operations.map((op) => ({ label: op, value: op }))}
            />
          </FormField>

          {(formData.operation === "Segment Concatenation" ||
            formData.operation === "MediaConvert Export") && (
            <FormField label="Format">
              <Select
                selectedOption={formats.find(
                  (format) => format.value == formData.format
                )}
                onChange={({ detail }) =>
                  setFormData((prevFormData) => ({
                    ...prevFormData,
                    format: detail.selectedOption.value,
                  }))
                }
                options={formats}
              />
            </FormField>
          )}

          {formData.operation === "Flow Creation" && (
            <FormField label="Label">
              <Input
                value={formData.label}
                onChange={({ detail }) =>
                  setFormData({ ...formData, label: detail.value })
                }
                placeholder="Label"
              />
            </FormField>
          )}

          {formData.operation !== "MediaConvert Export" &&
            audioFlows.length > 0 && (
              <FormField label="Audio Flows">
                <Multiselect
                  inlineTokens
                  selectedOptions={audioFlows
                    .filter((flow) => formData.flows[flow.id])
                    .map((flow) => ({
                      label: flow.description ?? "",
                      value: flow.id,
                    }))}
                  onChange={({ detail }) => {
                    const selectedIds = detail.selectedOptions.map(
                      (option) => option.value
                    );
                    const newFlows = {};
                    audioFlows.forEach((flow) => {
                      newFlows[flow.id] = selectedIds.includes(flow.id);
                    });
                    setFormData((prev) => ({
                      ...prev,
                      flows: { ...prev.flows, ...newFlows },
                    }));
                  }}
                  options={audioFlows.map((flow) => ({
                    label: flow.description ?? "",
                    value: flow.id,
                  }))}
                  placeholder="Select audio flows"
                />
              </FormField>
            )}

          {formData.operation === "Segment Concatenation" && (
            <ExpandableSection
              headerText="Advanced"
              variant="footer"
              expanded={showAdvancedContent}
              onChange={({ detail }) => setShowAdvancedContent(detail.expanded)}
            >
              <SpaceBetween direction="vertical" size="m">
                <FormField label="Bucket">
                  <Input
                    value={formData.bucket}
                    onChange={({ detail }) =>
                      setFormData({ ...formData, bucket: detail.value })
                    }
                    placeholder="Bucket"
                  />
                </FormField>
                <FormField label="Path">
                  <Input
                    value={formData.path}
                    onChange={({ detail }) =>
                      setFormData({ ...formData, path: detail.value })
                    }
                    placeholder="Path"
                  />
                </FormField>
                <FormField label="Filename">
                  <Input
                    value={formData.filename}
                    onChange={({ detail }) =>
                      setFormData({ ...formData, filename: detail.value })
                    }
                    placeholder="Filename"
                  />
                </FormField>
              </SpaceBetween>
            </ExpandableSection>
          )}

          <Box float="right">
            <Button
              variant="primary"
              disabled={isExportButtonDisabled}
              onClick={handleSubmit}
              loading={isLoading || isStarting}
            >
              Export
            </Button>
          </Box>
        </SpaceBetween>
      </Modal>
    </>
  );
}
