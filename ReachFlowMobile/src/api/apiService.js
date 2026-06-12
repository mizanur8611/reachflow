const BASE_URL = 'https://reachflow-j34o.onrender.com/api';

let authToken = null;

export const setToken = (token) => {
  authToken = token;
};

export const getToken = () => authToken;

const request = async (method, endpoint, data = null) => {
  const headers = { 'Content-Type': 'application/json' };
  if (authToken) headers.Authorization = `Bearer ${authToken}`;

  const res = await fetch(`${BASE_URL}${endpoint}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : null,
  });
  const text = await res.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch (e) {
      throw { response: { data: { message: 'Server error: ' + text.substring(0, 100) } } };
    }
    if (!res.ok) throw { response: { data: json } };
    return { data: json };
};

export const loginUser = (data) => request('POST', '/auth/login', data);
export const registerUser = (data) => request('POST', '/auth/register', data);
export const getCampaigns = () => request('GET', '/campaigns/available');
export const getCampaignById = (id) => request('GET', `/campaigns/${id}`);
export const applyCampaign = (id) => request('POST', `/applications`, { campaignId: id });
export const getPromoterDashboard = () => request('GET', '/promoter/dashboard');
export const getMyEarnings = () => request('GET', '/promoter/earnings');
export const submitProof = (data) => request('POST', '/submissions', data);
export const getAdvertiserDashboard = () => request('GET', '/advertiser/dashboard');
export const createCampaign = (data) => request('POST', '/campaigns', data);
export const getMyCampaigns = () => request('GET', '/advertiser/campaigns');
export const getWallet = () => request('GET', '/wallet');
export const requestWithdrawal = (data) => request('POST', '/withdrawals', data);
export const getKYCStatus = () => request('GET', '/kyc/status');
export const getNotifications = () => request('GET', '/notifications');
export const markNotificationRead = (id) => request('PUT', `/notifications/${id}/read`);
export const markAllNotificationsRead = () => request('PUT', '/notifications/read-all');
export const getTrackingLink = (campaignId) => request('POST', `/tracking/generate`, { campaignId });
export const getLeaderboard = () => request('GET', '/leaderboard');
export const getReferral = () => request('GET', '/referral/my');
export const getConversations = () => request('GET', '/messages/conversations');
export const getMessages = (conversationId) => request('GET', `/messages/${conversationId}`);
export const sendMessage = (receiverId, content) => request('POST', `/messages`, { receiverId, content });
export const getDisputes = () => request('GET', '/disputes');
export const createDispute = (data) => request('POST', '/disputes', data);
export const changePassword = (data) => request('PUT', '/auth/change-password', data);
export const updateProfile = (data) => request('PUT', '/auth/profile', data);
export const addMoney = (data) => request('POST', '/wallet/deposit', data);
export const getAnalytics = (period) => request('GET', `/advertiser/analytics?period=${period}`);
export const getSubscription = () => request('GET', '/subscription');
export const subscribePlan = (data) => request('POST', '/subscription/subscribe', data);






