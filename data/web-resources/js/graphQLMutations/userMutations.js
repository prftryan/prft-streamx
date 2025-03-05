import { utilities } from "./utility.js";

const getUserToken = async (userEmail, userPsw) => {
    const query = JSON.stringify({
      query: `mutation {
        generateCustomerToken(email: "${userEmail}", password: "${userPsw}") {
          token
        }
      }`,
      variables: {},
    });
  
    const response = await utilities.fetchRequests(utilities.GRAPHQL_ENDPOINT, 'POST', utilities.HEADERS, query);
  
    return response.data.generateCustomerToken;
}
const getCustomerOrders = async (token) => {
    const query = JSON.stringify({
      query: `{ customerOrders { items { order_number id created_at grand_total status } } }`
    });
  
    const response = await utilities.fetchRequests(utilities.GRAPHQL_ENDPOINT, 'POST', {...utilities.HEADERS, 'Authorization': `Bearer ${token}`}, query);
  
    return response.data.customerOrders;
}


const customerQuery = async (token) => {
  const query = JSON.stringify({
    query: `{ customer { firstname lastname suffix email addresses { firstname lastname street city region { region_code region } postcode country_code telephone } } }`
  });
  const userData = await utilities.fetchRequests(utilities.GRAPHQL_ENDPOINT, 'POST', {...utilities.HEADERS, 'Authorization': `Bearer ${token}`}, query);
  return userData;
}

export const userMutations = {
  getUserToken,
  customerQuery,
  getCustomerOrders
};
