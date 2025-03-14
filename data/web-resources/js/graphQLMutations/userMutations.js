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

//to be called when current token has expired
const regenerateUserToken = async () => {
  const activeUser = utilities.getActiveUserFromSS();
  const activeUserCreds = activeUser == 'user01' ? utilities.user01 : utilities.user02;
  const newTokenResponse = await getUserToken(activeUserCreds.email, activeUserCreds.password)
  utilities.setTokentoSS(newTokenResponse.token);
}

const getCustomerOrders = async (token) => {
    const query = JSON.stringify({
      query: `{ customerOrders { items { order_number id created_at grand_total status items { id product_sku product_name quantity_ordered } } } }`
    });
  
    const response = await utilities.fetchRequests(utilities.GRAPHQL_ENDPOINT, 'POST', {...utilities.HEADERS, 'Authorization': `Bearer ${token}`}, query);
  
    return response.errors ? response : response.data.customerOrders;
}


const customerQuery = async (token) => {
  const query = JSON.stringify({
    query: `{ customer { firstname lastname suffix email addresses { firstname lastname street city region { region_code region } postcode country_code telephone } } }`
  });
  const userData = await utilities.fetchRequests(utilities.GRAPHQL_ENDPOINT, 'POST', {...utilities.HEADERS, 'Authorization': `Bearer ${token}`}, query);
  return userData.errors ? userData : userData.data.customer;
}

export const userMutations = {
  getUserToken,
  customerQuery,
  regenerateUserToken,
  getCustomerOrders
};
