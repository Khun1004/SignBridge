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
    getProfile:    (email)         => request(`/mypage/profile/${email}`),
    getCases:      (email)         => request(`/mypage/cases/${email}`),
    // 프로필 수정 (이름, 장애등급, 주사용수어)
    updateProfile: (email, data)   => request(`/mypage/profile/${email}`, {
        method: 'PATCH',
        body:   JSON.stringify(data),
    }),
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
    buildSubtitle: (words, place = 'immigration', prevSentence = '') => request('/subtitle', {
        method: 'POST',
        body: JSON.stringify({ words, place, prevSentence }),
    }),
    getSignGuide: (text) => request('/sign-guide', {
        method: 'POST',
        body: JSON.stringify({ text }),
    }),
}

// ── 개인 케이스 API ──────────────────────────────────────────
export const personalApi = {
    /** 개인 대화 기록 등록 */
    saveCase: (data) => request('/personal/cases', {
        method: 'POST',
        body:   JSON.stringify(data),
    }),

    /** 사용자별 개인 케이스 목록 (messages 포함) */
    getCases: (email) => request(`/personal/cases?email=${encodeURIComponent(email)}`),

    /** 케이스 단건 삭제 */
    deleteCase: (id) => request(`/personal/cases/${id}`, { method: 'DELETE' }),

    /** 세션 ID 기준 대화 기록 삭제 */
    deleteSession: (sessionId) =>
        request(`/personal/cases/session/${encodeURIComponent(sessionId)}`, { method: 'DELETE' }),
}

// ── 대화 기록 / 영상 API ──────────────────────────────────────
export const conversationApi = {

    /**
     * 녹화 영상 Blob을 서버에 업로드한다.
     * @param {Blob}   videoBlob  - MediaRecorder가 생성한 webm/mp4 Blob
     * @param {string} userEmail  - 로그인 사용자 이메일
     * @returns {Promise<{ videoId: string }>}
     */
    uploadVideo: async (videoBlob, userEmail) => {
        const ext      = videoBlob.type?.includes('mp4') ? 'mp4' : 'webm'
        const filename = `recording_${Date.now()}.${ext}`
        const formData = new FormData()
        formData.append('video',  videoBlob, filename)
        formData.append('email',  userEmail ?? '')

        const response = await fetch(`${BASE_URL}/conversations/video`, {
            method: 'POST',
            body:   formData,
            // Content-Type은 FormData 자동 설정 — 헤더 직접 지정 금지
        })

        if (!response.ok) {
            const msg = await response.text()
            throw new Error(msg || '영상 업로드 실패')
        }
        return response.json() // { videoId, url }
    },

    /**
     * 서버에 저장된 영상의 스트림 URL을 반환한다.
     * <video src={conversationApi.getVideoUrl(id)} controls />
     */
    getVideoUrl: (videoId) => `${BASE_URL}/conversations/video/${videoId}`,

    /**
     * 대화 기록(텍스트) + 영상 ID를 함께 저장한다.
     * @param {{ messages, videoId, userEmail, place }} data
     */
    saveConversation: (data) => request('/conversations', {
        method: 'POST',
        body:   JSON.stringify(data),
    }),

    /**
     * 사용자의 대화 기록 목록을 가져온다.
     */
    getConversations: (email) =>
        request(`/conversations?email=${encodeURIComponent(email)}`),

    /**
     * 특정 대화 기록 상세 조회.
     */
    getConversation: (id) => request(`/conversations/${id}`),
}