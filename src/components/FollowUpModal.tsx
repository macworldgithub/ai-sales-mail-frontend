import { useEffect, useState } from "react";
import { Modal, Form, Input, Button, Card } from "antd";
import { ArrowRightOutlined } from "@ant-design/icons";
import axios from "axios";
import { SERVER_URL } from "../config";
import toast from "react-hot-toast";
import CustomLoader from "../commons/CustomLoader";

export default function FollowUpModal({
  visible,
  onClose,
  isSelectdCompaign,
  isAlreadyFollwedUp,
  followUpDurationss
}: any) {
  const [currentStep, setCurrentStep] = useState(0);
  const steps = ["Automated Follow Up Email Template", "Review & Set"];
  const token = localStorage.getItem("x-ai-sales-mail-token");
  const [emailTemplateBody, setEmailTemplateBody] = useState("");
  const [followUpDuration, setFollowUpDuration] = useState("");
  const [emailTemplateSubject, setEmailTemplateSubject] = useState("");
  const [emailTemplateClosing, setEmailTemplateClosing] = useState("");
  const [loading, setLoading] = useState(false);
  console.log(followUpDuration)
  const handleGenerateTemplate = async () => {
    setLoading(true);
    try {
      const endpoint = "/email/generateAutomatedFollowUpEmail";
      const payload = {
        compaignId: isSelectdCompaign,
      };
      const { data } = await axios.post(`${SERVER_URL}${endpoint}`, payload, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmailTemplateSubject(data.emailContent.subject);
      setEmailTemplateBody(data.emailContent.body);
      setEmailTemplateClosing(data.emailContent.closing);
    } catch (error: any) {
      console.error(
        "Error generating email template:",
        error.response?.data || error.message
      );
      toast.error("Failed to generate email template.");
    } finally {
      setLoading(false);
    }
  };
  const fetchTemplate = async () => {
    setLoading(true);
    try {
      const endpoint = `/follow-up/getFollowUpByCompaignId/${isSelectdCompaign}`;

      const { data } = await axios.get(`${SERVER_URL}${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setEmailTemplateSubject(data[0].emailTemplateSubject);
      setEmailTemplateBody(data[0].emailTemplateBody);
      setEmailTemplateClosing(data[0].emailTemplateClosing);
      setFollowUpDuration(followUpDurationss)
    } catch (error: any) {
      console.error(
        "Error generating email template:",
        error.response?.data || error.message
      );
      toast.error("Failed to generate email template.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async () => {
    setLoading(true);
    try {
      await axios.put(
        `${SERVER_URL}/follow-up/updateFollowUp/${isSelectdCompaign}`,
        {
          emailTemplateSubject: emailTemplateSubject,
          emailTemplateBody: emailTemplateBody,
          emailTemplateClosing: emailTemplateClosing,
          followUpDuration:parseInt(followUpDuration)
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmailTemplateSubject("");
      setEmailTemplateBody("");
      setEmailTemplateClosing("");
      setCurrentStep(0);
    } catch (error: any) {
      console.error(
        "Error generating email template:",
        error.response?.data || error.message
      );
      toast.error("Failed to send email.");
    } finally {
      setLoading(false);
    }
    toast.success(`Automated Reply Set!`);
    onClose();
  };
  const handleSendEmails = async () => {
    setLoading(true);
    try {
      await axios.post(
        `${SERVER_URL}/follow-up/enableFollowUp`,
        {
          emailTemplateSubject: emailTemplateSubject,
          emailTemplateBody: emailTemplateBody,
          emailTemplateClosing: emailTemplateClosing,
          campaignId: isSelectdCompaign,
          followUpDuration:parseInt(followUpDuration)

        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmailTemplateSubject("");
      setEmailTemplateBody("");
      setEmailTemplateClosing("");
      setCurrentStep(0);
    } catch (error: any) {
      console.error(
        "Error generating email template:",
        error.response?.data || error.message
      );
      toast.error("Failed to send email.");
    } finally {
      setLoading(false);
    }
    toast.success(`Automated Reply Set!`);
    onClose();
  };
  const handleRemoveAutomation = async () => {
    setLoading(true);
    try {
      await axios.get(
        `${SERVER_URL}/follow-up/removeFollowUp/${isSelectdCompaign}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setEmailTemplateSubject("");
      setEmailTemplateBody("");
      setEmailTemplateClosing("");
      setCurrentStep(0);
    } catch (error: any) {
      console.error(
        "Error generating email template:",
        error.response?.data || error.message
      );
      toast.error("Failed to send email.");
    } finally {
      setLoading(false);
    }
    toast.success(`Automation Removed!`);
    onClose();
  };

  const ChangeSteps = (currentStep: any) => {
    setCurrentStep(currentStep + 1);
  };
  useEffect(() => {
    if (isSelectdCompaign != null) {
      if (isAlreadyFollwedUp) {
        fetchTemplate();
      } else {
        handleGenerateTemplate();
      }
    }
  }, [isSelectdCompaign]);
  return (
    <Modal
      title="Set Automated Follow up Email"
      open={visible}
      onCancel={() => {
        onClose();
        setEmailTemplateSubject("");
        setEmailTemplateBody("");
        setEmailTemplateClosing("");
        setCurrentStep(0);
      }}
      footer={null}
      width={650}
    >
      <Form layout="vertical" style={{ marginTop: 20 }}>
        {isAlreadyFollwedUp && (
          <div className="flex w-full justify-end mb-4">
            <Button
              type="primary"
              style={{ backgroundColor: "red" }}
              onClick={handleRemoveAutomation}
            >
              Remove Automation
            </Button>
          </div>
        )}
        {currentStep === 0 && (
          <Card className="shadow-md p-6">
            <Form.Item label="Generated Email Subject">
              <Input.TextArea
                value={emailTemplateSubject}
                onChange={(e) => setEmailTemplateSubject(e.target.value)}
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
                onChange={(e) => setEmailTemplateClosing(e.target.value)}
                rows={1}
              />
            </Form.Item>
            <Form.Item label="Follow Up Frequency (Days)">
              <Input
              type="number"
                value={followUpDuration}
                onChange={(e) => setFollowUpDuration(e.target.value)}
              />
            </Form.Item>
          </Card>
        )}

        {currentStep === 1 && (
          <>
            <p className="font-bold">Automated Reply Email Template:</p>
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
            <Form.Item label="Follow Up Frequency (Days)">
              <Input
              type="number"
                value={followUpDuration}
              disabled

                onChange={(e) => setFollowUpDuration(e.target.value)}
              />
            </Form.Item>
          </>
        )}
        <div className="flex justify-between mt-4 ">
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
            <Button
              type="primary"
              onClick={isAlreadyFollwedUp ? handleUpdate : handleSendEmails}
            >
              {isAlreadyFollwedUp ? "Update" : "Set Automation"}
            </Button>
          )}
        </div>
      </Form>
      {loading && <CustomLoader />}
    </Modal>
  );
}
