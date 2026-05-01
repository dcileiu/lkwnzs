const BASE_URL = 'https://roco.itianci.cn/api/wx';

/**
 * 封装微信请求 (Encapsulate WeChat Request)
 */
function request(url, method = 'GET', data = {}) {
  return new Promise((resolve, reject) => {
    wx.request({
      url: `${BASE_URL}${url}`,
      method: method,
      data: data,
      header: {
        'content-type': 'application/json' // Default JSON
      },
      success: (res) => {
        if (res.statusCode === 200 && res.data.code === 200) {
          resolve(res.data.data);
        } else {
          wx.showToast({
            title: res.data.message || '网络请求错误',
            icon: 'none'
          });
          reject(res.data);
        }
      },
      fail: (err) => {
        wx.showToast({
          title: '服务器连接失败',
          icon: 'none'
        });
        reject(err);
      }
    });
  });
}

const api = {
  // Articles Data
  getArticles(params) {
    return request('/articles', 'GET', params);
  },
  getArticleDetail(id) {
    return request(`/articles/${id}`, 'GET');
  },
  getArticleInteractionState(id, params) {
    return request(`/articles/${id}/interaction`, 'GET', params);
  },
  updateArticleInteraction(id, payload) {
    return request(`/articles/${id}/interaction`, 'POST', payload);
  },
  getSystemConfigs(params) {
    return request('/system-configs', 'GET', params);
  },
  recordHistory(payload) {
    return request('/history', 'POST', payload);
  },
  getHistory(params) {
    return request('/history', 'GET', params);
  },
  clearHistory(payload) {
    return request('/history', 'DELETE', payload);
  },
  // Elves Pokedex Data
  getElves(params) {
    return request('/elves', 'GET', params);
  },
  getElements() {
    return request('/elements', 'GET');
  },
  getElfDetail(id) {
    return request(`/elves/${id}`, 'GET');
  },
  // Item Data
  getItems(params) {
    return request('/items', 'GET', params);
  },
  // Traveling Merchant Shop Data
  getShopItems(params) {
    return request('/shop', 'GET', params);
  },
  // Egg Collection Data
  getEggCollection() {
    return request('/eggs', 'GET');
  },
  getEggDetail(id) {
    return request(`/eggs/${id}`, 'GET');
  },
  getEggGroups() {
    return request('/egg-groups', 'GET');
  },
  // Egg Prediction Data
  predictHatch(params) {
    return request('/hatch/predict', 'POST', params);
  }
};

module.exports = api;
