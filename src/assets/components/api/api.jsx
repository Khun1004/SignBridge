const BASE_URL = '/api';

async function request(path, options = {}) {
    const response = await fetch(`${BASE_URL}${path}`, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || '서버 오류가 발생했습니다.');
    }

    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
        return response.json();
    }
    return response.text();
}

export const commonApi = {
    getStatus: () => request('/status'),
};

export const authApi = {
    login: (data) => request('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
    signup: (data) => request('/auth/signup', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

export const myPageApi = {
    getProfile: (email) => request(`/mypage/profile/${email}`),
    getCases:   (email) => request(`/mypage/cases/${email}`),
};

// ── 출입국 케이스 API ──
export const immigrationApi = {
    getCases:   (email) => request(`/immigration/cases?email=${encodeURIComponent(email)}`),
    saveRecord: (data)  => request('/immigration/cases', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// ── 경찰 케이스 API ──
export const policeApi = {
    getCases:   (email) => request(`/police/cases?email=${encodeURIComponent(email)}`),
    saveRecord: (data)  => request('/police/cases', {
        method: 'POST',
        body: JSON.stringify(data),
    }),
};

// ── 번역 관련 API ──
export const translateApi = {
    buildSubtitle: (words) => request('/subtitle', {
        method: 'POST',
        body: JSON.stringify({ words }),
    }),
    getSignGuide: (text) => request('/sign-guide', {
        method: 'POST',
        body: JSON.stringify({ text }),
    }),
}