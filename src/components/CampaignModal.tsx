import { useEffect, useState } from "react";
import {
  Modal,
  Form,
  Input,
  Button,
  Select,
  Upload,
  Steps,
  Checkbox,
  Card,
} from "antd";
import { UploadOutlined, ArrowRightOutlined } from "@ant-design/icons";
import * as XLSX from "xlsx";
import axios from "axios";
import { SERVER_URL } from "../config";
import toast from "react-hot-toast";
import CustomLoader from "../commons/CustomLoader";

const { Option } = Select;

export default function CreateCampaignModal({ visible, onClose }: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Details", "Upload Excel","Email Template",  "Review & Send"];
  const [templates, setTemplates] = useState([]);
  const token=localStorage.getItem("x-ai-sales-mail-token")
  const [campaignName, setCampaignName] = useState("");
  const [campaignDescription, setCampaignDescription] = useState("");
  const [emailTemplateBody, setEmailTemplateBody] = useState("");
  const [emailTemplateSubject, setEmailTemplateSubject] = useState("");
  const [emailTemplateClosing, setEmailTemplateClosing] = useState("");
  const [fileData, setFileData] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [customTemplateName, setCustomTemplateName] = useState("");
  const [customTemplatePurpose, setCustomTemplatePurpose] = useState("");
  const [promptToChagne, setPromptToChagne] = useState("");
  const [genarted, setGenerated] = useState(false);
  const [saveTemplate, setSaveTemplate] = useState(false);
  const [saveChanges, setSaveChanges] = useState(false);
  const [loading, setLoading] = useState(false);


  const handleSelectTemplate = async (value: any) => {
    setSelectedTemplate(value);
    if (value == "custom") {
      setCustomTemplateName("");
      setPromptToChagne("");
      setGenerated(false);
      setCustomTemplatePurpose("");
      setEmailTemplateSubject("");
      setEmailTemplateClosing("");
      setEmailTemplateBody("");
    } else {
      const res = await axios.get(`${SERVER_URL}/templates/getById/${value}`,{headers:{
        Authorization:token
      }});
      if (res.status == 200) {
        setEmailTemplateBody(res.data.emailBody);
        setEmailTemplateClosing(res.data.emailClosing);
        setCustomTemplatePurpose(res.data.templatePurpose);
        setEmailTemplateSubject(res.data.emailSubject);
      } else {
        toast.error("Error Fetching Template");
      }
    }
  };

  const handleGenerateTemplate = async () => {
    if (selectedTemplate == "custom") {
      if (!customTemplatePurpose.trim()) {
        toast.error("Please Provide Purpose");
        return;
      }
      setLoading(true);
      setGenerated(false);
      try {
        const endpoint =
          !emailTemplateBody.trim() ||
          !emailTemplateClosing.trim() ||
          !emailTemplateSubject.trim()
            ? "/email/generate"
            : "/email/makeChanges";

        const payload =
          endpoint === "/email/generate"
            ? { emailPurpose: customTemplatePurpose,
            templatePlaceholders:Object.keys(fileData[0])

             }
            : {
                emailPurpose: customTemplatePurpose,
                emailBody: emailTemplateBody,
                emailSubject: emailTemplateSubject,
                emailClosing: emailTemplateClosing,
                promptTochange: promptToChagne,
              };

        const { data } = await axios.post(`${SERVER_URL}${endpoint}`, payload,{headers:{
            Authorization:token
          }});

        setEmailTemplateSubject(data.emailContent.subject);
        setEmailTemplateBody(data.emailContent.body);
        setEmailTemplateClosing(data.emailContent.closing);
        setGenerated(true);
      } catch (error: any) {
        console.error(
          "Error generating email template:",
          error.response?.data || error.message
        );
        toast.error("Failed to generate email template.");
      } finally {
        setLoading(false);
      }
    }else{
        setLoading(true);
        setGenerated(false);

        try {
   const { data } = await axios.post(`${SERVER_URL}/email/makeChanges`,  {
            emailPurpose: customTemplatePurpose,
            emailBody: emailTemplateBody,
            emailSubject: emailTemplateSubject,
            emailClosing: emailTemplateClosing,
            promptTochange: promptToChagne,
          },{headers:{
            Authorization:token
          }});
  
          setEmailTemplateSubject(data.emailContent.subject);
          setEmailTemplateBody(data.emailContent.body);
          setEmailTemplateClosing(data.emailContent.closing);
          setGenerated(true);
        } catch (error: any) {
          console.error(
            "Error generating email template:",
            error.response?.data || error.message
          );
          toast.error("Failed to generate email template.");
        } finally {
          setLoading(false);
        } 
    }
  };

  const handleFileUpload = (file: any) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      // @ts-expect-error jh kh
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      setFileData(XLSX.utils.sheet_to_json(sheet));
      toast.success("File uploaded successfully!");
    };
    reader.readAsArrayBuffer(file);
    return false;
  };

  const handleSendEmails = async () => {
    setLoading(true);
    try {
      if (saveTemplate) {
        const res = await axios.post(`${SERVER_URL}/templates/create`, {
          templateName: customTemplateName,
          templatePurpose: customTemplatePurpose,
          emailSubject: emailTemplateSubject,
          emailBody: emailTemplateBody,
          emailClosing: emailTemplateClosing,
        },{headers:{
            Authorization:token
          }});
        if (res.status == 201 || res.status == 200) {
          toast.success("Template Saved SuccessFully");
        }
      }
      if (saveChanges) {
        const res = await axios.put(`${SERVER_URL}/templates/update/${selectedTemplate}`, {
          emailSubject: emailTemplateSubject,
          emailBody: emailTemplateBody,
          emailClosing: emailTemplateClosing,
        },{headers:{
            Authorization:token
          }});
        if (res.status == 201 || res.status == 200) {
          toast.success("Template Updated SuccessFully");
        }
      }
      await axios.post(`${SERVER_URL}/campaigns/create`, {
        emailTemplateSubject: emailTemplateSubject,
        emailTemplateBody: emailTemplateBody,
        emailTemplateClosing: emailTemplateClosing,
        campaignName,
        description:campaignDescription,
        recipients:fileData
      },{headers:{
        Authorization:token
      }});

      setEmailTemplateSubject("");
      setEmailTemplateBody("");
      setEmailTemplateClosing("");
      setCampaignName("");
      setCampaignDescription("");
      setCurrentStep(0);
      setSaveTemplate(false);
      setSaveChanges(false);
      setGenerated(false);
      fetchTemplates()
    } catch (error: any) {
      console.error(
        "Error generating email template:",
        error.response?.data || error.message
      );
      toast.error("Failed to send email.");
    } finally {
      setLoading(false);
    }
    toast.success(`Emails sent to ${fileData.length} recipients!`);
    onClose();
  };

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${SERVER_URL}/templates/getAll/names`,{headers:{
        Authorization:token
      }});
      setTemplates(res.data);
    } catch (error: any) {
      console.error(
        "Error fetching email template:",
        error.response?.data || error.message
      );
      toast.error("Failed to fetch email templates.");
    } finally {
      setLoading(false);
    }
  };

  const ChangeSteps = (currentStep: any) => {
    if (currentStep == 0) {
      if (campaignName == "") {
        toast.error("Please Provide Campaign Name");
        return;
      }
      if (campaignDescription == "") {
        toast.error("Please Provide Campaign Description");
        return;
      }
    }
    if (currentStep == 1) {
        console.log(fileData,"lp")
        if (fileData.length<1) {
          toast.error("UPload file please");
          return;
        }
      }
    if (currentStep == 2) {
      if (selectedTemplate == "") {
        toast.error("Please Select Email Template");
        return;
      }
      if (emailTemplateBody == "") {
        toast.error("There is no email Template Body");
        return;
      }
      if (emailTemplateSubject == "") {
        toast.error("There is no email Template Subject");
        return;
      }
      if (emailTemplateClosing == "") {
        toast.error("There is no email Template Closing");
        return;
      }
    }
    setCurrentStep(currentStep + 1);
  };

  useEffect(() => {
    fetchTemplates();
  }, []);
  return (
    <Modal
      title="Create New Campaign"
      open={visible}
      onCancel={()=>{onClose()}}
      footer={null}
      width={650}
    >
      <Steps current={currentStep} size="small" style={{ marginTop: 20 }}>
        {steps.map((step, index) => (
          <Steps.Step key={index} title={step} />
        ))}
      </Steps>

      <Form layout="vertical" style={{ marginTop: 20 }}>
        {currentStep === 0 && (
          <Card className="shadow-md p-6">
            <Form.Item label="Campaign Name" required>
              <Input
                value={campaignName}
                onChange={(e) => setCampaignName(e.target.value)}
                placeholder="Enter campaign name"
              />
            </Form.Item>
            <Form.Item label="Campaign Description" required>
              <Input.TextArea
                value={campaignDescription}
                onChange={(e) => setCampaignDescription(e.target.value)}
                rows={3}
                placeholder="Describe your campaign"
              />
            </Form.Item>
          </Card>
        )}

        {currentStep === 2 && (
          <Card className="shadow-md p-6">
            <Form.Item label="Select AI Email Template">
              <Select
                value={selectedTemplate}
                onChange={handleSelectTemplate}
                placeholder="Choose Template Type"
              >
                {templates &&
                  templates.length > 0 &&
                  templates.map((e: any) => (
                    <Option value={e._id}>{e.templateName}</Option>
                  ))}
                <Option value="custom">Custom Template</Option>
              </Select>
            </Form.Item>
            {selectedTemplate === "custom" && (
              <>
                <Form.Item label="Template Name" required>
                  <Input
                    value={customTemplateName}
                    onChange={(e) => setCustomTemplateName(e.target.value)}
                    placeholder="Enter template name"
                  />
                </Form.Item>
                <Form.Item label="Template Purpose" required>
                  <Input.TextArea
                    value={customTemplatePurpose}
                    onChange={(e) => setCustomTemplatePurpose(e.target.value)}
                    rows={2}
                    placeholder="Enter purpose of email"
                  />
                </Form.Item>
              </>
            )}
            {selectedTemplate === "custom"
              ? genarted && (
                  <>
                    <Form.Item label="Generated Email Subject">
                      <Input.TextArea
                        value={emailTemplateSubject}
                        onChange={(e) =>
                          setEmailTemplateSubject(e.target.value)
                        }
                        rows={1}
                      />
                    </Form.Item>
                    <Form.Item label="Generated Email Content">
                      <Input.TextArea
                        value={emailTemplateBody}
                        onChange={(e) => setEmailTemplateBody(e.target.value)}
                        rows={8}
                      />
                    </Form.Item>
                    <Form.Item label="Generated Email Closing">
                      <Input.TextArea
                        value={emailTemplateClosing}
                        onChange={(e) =>
                          setEmailTemplateClosing(e.target.value)
                        }
                        rows={1}
                      />
                    </Form.Item>
                    <Form.Item label="Prompt to Change">
                      <Input
                        value={promptToChagne}
                        onChange={(e) => setPromptToChagne(e.target.value)}
                        placeholder="Please add humaour..."
                      />
                    </Form.Item>
                    <Checkbox
                      checked={saveTemplate}
                      onChange={(e) => setSaveTemplate(e.target.checked)}
                    >
                      Save Template
                    </Checkbox>
                    <br />
                    <br />
                  </>
                )
              : selectedTemplate != "" && (
                  <>
                    <Form.Item label="Generated Email Subject">
                      <Input.TextArea
                        value={emailTemplateSubject}
                        onChange={(e) =>
                          setEmailTemplateSubject(e.target.value)
                        }
                        rows={1}
                      />
                    </Form.Item>
                    <Form.Item label="Generated Email Content">
                      <Input.TextArea
                        value={emailTemplateBody}
                        onChange={(e) => setEmailTemplateBody(e.target.value)}
                        rows={8}
                      />
                    </Form.Item>
                    <Form.Item label="Generated Email Closing">
                      <Input.TextArea
                        value={emailTemplateClosing}
                        onChange={(e) =>
                          setEmailTemplateClosing(e.target.value)
                        }
                        rows={1}
                      />
                    </Form.Item>
                    <Form.Item label="Prompt to Change">
                      <Input
                        value={promptToChagne}
                        onChange={(e) => setPromptToChagne(e.target.value)}
                        placeholder="Please add humaour..."
                      />
                    </Form.Item>
                    <Checkbox
                      checked={saveChanges}
                      onChange={(e) => setSaveChanges(e.target.checked)}
                    >
                      Save Changes
                    </Checkbox>
                    <br />
                    <br />
                  </>
                )}
            {selectedTemplate != "" && (
              <Button type="primary" onClick={handleGenerateTemplate}>
                Generate
              </Button>
            )}
          </Card>
        )}
        {currentStep === 1 && (
          <>
            <Form.Item
              label="Upload Recipient List (Excel/CSV)"
              className="mt-4"
            >
              <Upload beforeUpload={handleFileUpload} showUploadList={false}>
                <Button icon={<UploadOutlined />}>Upload File</Button>
              </Upload>
            </Form.Item>
          </>
        )}

        {/* Step 4: Confirm & Send Emails */}
        {currentStep === 3 && (
          <>
            <p className="font-bold">Campaign Name:</p> <p>{campaignName}</p>
            <br />
            <p className="font-bold">Description:</p>{" "}
            <p>{campaignDescription}</p>
            <br />
            <p className="font-bold">Email Template:</p>
            <p className="mt-2">Subject:</p>
            <Input.TextArea
              value={emailTemplateSubject}
              onChange={(e) => setEmailTemplateSubject(e.target.value)}
              rows={1}
              disabled
            />
            <p className="mt-2">Body:</p>
            <Input.TextArea
              value={emailTemplateBody}
              onChange={(e) => setEmailTemplateBody(e.target.value)}
              rows={8}
              disabled
            />
            <p className="mt-2">Closing:</p>
            <Input.TextArea
              value={emailTemplateClosing}
              onChange={(e) => setEmailTemplateClosing(e.target.value)}
              disabled
              rows={1}
            />
            <p className="font-bold mt-4">Recipients Count:</p>{" "}
            <p>{fileData.length}</p>
          </>
        )}
        <div className="flex justify-between mt-4">
          {currentStep > 0 && (
            <Button onClick={() => setCurrentStep(currentStep - 1)}>
              Back
            </Button>
          )}
          {currentStep < steps.length - 1 ? (
            <Button
              type="primary"
              onClick={() => ChangeSteps(currentStep)}
              icon={<ArrowRightOutlined />}
            >
              Next
            </Button>
          ) : (
            <Button type="primary" onClick={handleSendEmails}>
              Send Emails
            </Button>
          )}
        </div>
      </Form>
      {loading && <CustomLoader />}
    </Modal>
  );
}
