import { useState } from "react";
import { Modal, Form, Input, Button, Select, Upload, Steps, Checkbox, message, Card } from "antd";
import { UploadOutlined, ArrowRightOutlined, EditOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";

const { Option } = Select;

export default function CreateCampaignModal({ visible, onClose }) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Details", "Email Template", "Upload List", "Review & Send"];
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [emailTemplate, setEmailTemplate] = useState("");
  const [fileData, setFileData] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [customTemplatePurpose, setCustomTemplatePurpose] = useState("");
  const [genarted, setGenerated] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);

  const aiTemplates = {
    sales: "Hello [Name],\nWe are excited to introduce [Product]! Let’s schedule a call.\nBest,\n[Your Company]",
    followUp: "Hi [Name],\nJust following up on our last conversation. Let’s connect!\nBest,\n[Your Name]",
  };

  const handleSelectTemplate = (value) => {
    setSelectedTemplate(value);
    setEmailTemplate(value === "custom" ? "" : aiTemplates[value]);
  };

  const handleGenerateTemplate = () => {
    setEmailTemplate(`Hello [Name],\n${customTemplatePurpose}\nBest,\n[Your Company]`);
    setGenerated(true)
  };

  const handleFileUpload = (file) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setFileData(XLSX.utils.sheet_to_json(sheet));
      message.success("File uploaded successfully!");
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleSendEmails = () => {
    if (!campaignName || !emailTemplate || fileData.length === 0) {
      message.error("Complete all steps before sending emails.");
      return;
    }
    message.success(`Emails sent to ${fileData.length} recipients!`);
    onClose();
  };

  return (
    <Modal title="Create New Campaign" open={visible} onCancel={onClose} footer={null} width={650}>
      <Steps current={currentStep} size="small" style={{ marginTop: 20 }}>
        {steps.map((step, index) => (
          <Steps.Step key={index} title={step} />
        ))}
      </Steps>

      <Form layout="vertical" style={{ marginTop: 20 }}>
        {currentStep === 0 && (
          <Card className="shadow-md p-6">
            <Form.Item label="Campaign Name" required>
              <Input value={campaignName} onChange={(e) => setCampaignName(e.target.value)} placeholder="Enter campaign name" />
            </Form.Item>
            <Form.Item label="Campaign Description" required>
              <Input.TextArea value={campaignDescription} onChange={(e) => setCampaignDescription(e.target.value)} rows={3} placeholder="Describe your campaign" />
            </Form.Item>
          </Card>
        )}

        {currentStep === 1 && (
          <Card className="shadow-md p-6">
            <Form.Item label="Select AI Email Template">
              <Select value={selectedTemplate} onChange={handleSelectTemplate} placeholder="Choose Template Type">
                <Option value="sales">Sales Outreach</Option>
                <Option value="followUp">Follow-Up Email</Option>
                <Option value="custom">Custom Template</Option>
              </Select>
            </Form.Item>
            {selectedTemplate === "custom" && (
              <>
                <Form.Item label="Template Name" required>
                  <Input value={customTemplateName} onChange={(e) => setCustomTemplateName(e.target.value)} placeholder="Enter template name" />
                </Form.Item>
                <Form.Item label="Template Purpose" required>
                  <Input.TextArea value={customTemplatePurpose} onChange={(e) => setCustomTemplatePurpose(e.target.value)} rows={3} placeholder="Enter purpose of email" />
                </Form.Item>
              </>
            )}
{    selectedTemplate === "custom" ?    genarted&&
<>
<Form.Item label="Generated Email Content">
              <Input.TextArea value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} rows={5} />
            </Form.Item>
              <Form.Item label="Prompt to Change">
                  <Input value={customTemplateName} onChange={(e) => setCustomTemplateName(e.target.value)} placeholder="Please add humaour..." />
                </Form.Item>
              <Checkbox checked={saveTemplate} onChange={(e) => setSaveTemplate(e.target.checked)}>Save Template</Checkbox>
              <br/>
              <br/>
</>
            :
            <>
           <Form.Item label="Email Content">
              <Input.TextArea value={emailTemplate} onChange={(e) => setEmailTemplate(e.target.value)} rows={5} />
            </Form.Item>
            <Form.Item label="Prompt to Change">
                  <Input value={customTemplateName} onChange={(e) => setCustomTemplateName(e.target.value)} placeholder="Please add humaour..." />
                </Form.Item>
              <Checkbox checked={saveTemplate} onChange={(e) => setSaveTemplate(e.target.checked)}>Save Changes</Checkbox>
              <br/>
              <br/>
            </>
        }
                <Button type="primary" onClick={handleGenerateTemplate}>Generate</Button>

            </Card>
            
        )}
{currentStep === 2 && (
          <>
            <Form.Item label="Upload Recipient List (Excel/CSV)" className="mt-4">
              <Upload beforeUpload={handleFileUpload} showUploadList={false}>
                <Button icon={<UploadOutlined />}>Upload File</Button>
              </Upload>
            </Form.Item>
          </>
        )}

        {/* Step 4: Confirm & Send Emails */}
        {currentStep === 3 && (
          <>
            <p className="font-bold">Campaign Name:</p> <p>{campaignName}</p><br />
            <p className="font-bold">Description:</p> <p>{campaignDescription}</p><br />
            <p className="font-bold">Email Template:</p>
            <Input value={emailTemplate} disabled />
            <p className="font-bold">Recipients Count:</p> <p>{fileData.length}</p>
       
          </>
        )}
        <div className="flex justify-between mt-4">
          {currentStep > 0 && <Button onClick={() => setCurrentStep(currentStep - 1)}>Back</Button>}
          {currentStep < steps.length - 1 ? (
            <Button type="primary" onClick={() => setCurrentStep(currentStep + 1)} icon={<ArrowRightOutlined />}>Next</Button>
          ) : (
            <Button type="primary" onClick={handleSendEmails}>Send Emails</Button>
          )}
        </div>
      </Form>
    </Modal>
  );
}