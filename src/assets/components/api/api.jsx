const BASE_URL = '/api';

// 공통 fetch 래퍼 함수
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

// 서버 상태 확인 API
export const commonApi = {
    getStatus: () => request('/status'),
};

// 인증 관련 API
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

// 마이페이지 관련 API
export const myPageApi = {
    getProfile: (email) => request(`/mypage/profile/${email}`),
    getCases: (email) => request(`/mypage/cases/${email}`),
};