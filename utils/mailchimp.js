

const initializeMailChimp = (apiKey, audienceId) => {
    if (!apiKey || !audienceId) {
        throw new Error('API key and Audience ID are required.');
    }

    const DATACENTER = apiKey.split('-')[1]; // Extract datacenter from API key
    const MAILCHIMP_API_URL = `https://${DATACENTER}.api.mailchimp.com/3.0`;

    const subscribeUser = async (email, firstName = '', lastName = '') => {
        if (!email) {
            throw new Error('Email is required.');
        }

        try {
            const response = await axios.post(
                `${MAILCHIMP_API_URL}/lists/${audienceId}/members`,
                {
                    email_address: email,
                    status: 'subscribed',
                    merge_fields: {
                        FNAME: firstName,
                        LNAME: lastName,
                    },
                },
                {
                    headers: {
                        Authorization: `Bearer ${apiKey}`,
                    },
                }
            );
            return response.data;
        } catch (error) {
            const errMessage = error.response?.data?.detail || 'An error occurred';
            throw new Error(errMessage);
        }
    };

    return {
        subscribeUser,
    };
};

module.exports = initializeMailChimp;
