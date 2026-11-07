import toast from 'react-hot-toast';
import { api } from '../config';
export async function processCampaign(id: string) {
  const { data, status } = await api.post(`/campaigns/${id}/process`);
  if (data.smtpHold) toast(data.message || data.smtpHold.reason);
  else if (data.campaign?.lastDeliveryError) toast.error(data.campaign.lastDeliveryError);
  else if (status === 202 || data.campaign?.status !== 'sent') toast(data.message || 'Campaign remains queued for the next delivery batch.');
  else toast.success('Campaign sent');
  return data;
}
